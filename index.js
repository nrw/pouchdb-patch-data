var extend = require('xtend')
var Queue = require('push-queue')
var monotonic = require('monotonic-timestamp')

module.exports = function (db, opts) {
  opts = opts || {}
  opts.patchField = opts.patchField || 'patch'
  opts.namespaceField = opts.namespaceField || 'namespace'

  var enqueue = Queue(function (item, callback) {
    db.put(item.value, function (err) {
      item.callback(err, item.value)
      callback()
    })
  })

  return {
    addPatch: addPatch,
    add: addPatch,
    patches: patches,
    get: patches,
    getPatches: patches,
    init: init
  }

  function addPatch (namespace, patch, meta, cb) {
    if (!cb) {
      cb = meta
      meta = {}
    }

    var props = {
      _id: monotonic().toString(36)
    }

    props[opts.namespaceField] = namespace
    props[opts.patchField] = patch

    var value = extend(meta, props)

    enqueue({value: value, callback: cb})
  }

  function patches (namespace, start, cb) {
    if (!cb) {
      cb = start
      start = null
    }

    var query = {
      include_docs: true
    }

    if (start) {
      query.startkey = [namespace, start]
      query.endkey = [namespace, {}]
      query.skip = 1
    } else {
      query.startkey = [namespace]
      query.endkey = [namespace, {}]
    }

    db.query('patches/by_namespace', query, function (err, res) {
      // console.log('err', err, res)
      if (err) return cb(err)

      cb(null, res.rows.map(function (row) { return row.doc }))
    })
  }

  function init (cb) {
    var design = {
      _id: '_design/patches',
      views: {
        by_namespace: {
          map: 'function (doc) {' +
            'if (doc.namespace) emit([doc.namespace, doc._id], null)' +
          '}'
        }
      }
    }
    db.get(design._id, function (err, res) {
      if (err && err.status !== 404) return cb(err)

      if (res && res._rev) design._rev = res._rev

      db.put(design, cb)
    })
  }
}
