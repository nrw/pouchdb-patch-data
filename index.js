var extend = require('xtend')
var bytewise = require('bytewise')
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
    getPatches: patches
  }

  function addPatch (namespace, patch, meta, cb) {
    if (!cb) {
      cb = meta
      meta = {}
    }

    var props = {
      _id: encode([namespace, monotonic().toString(36)])
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
      query.startkey = start
      query.endkey = encode([namespace, {}])
      query.skip = 1
    } else {
      query.startkey = encode([namespace])
      query.endkey = encode([namespace, {}])
    }

    db.allDocs(query, function (err, res) {
      if (err) return cb(err)

      cb(null, res.rows.map(function (row) { return row.doc }))
    })
  }
}

function encode (arr) {
  return bytewise.encode(arr).toString('hex')
}

function decode (str) {
  return bytewise.decode(new Buffer(str, 'hex'))
}
