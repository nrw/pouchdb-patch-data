var extend = require('xtend')

module.exports = function (db, opts) {
  opts = opts || {}
  opts.separator = opts.separator || '\xff'
  opts.timestampField = opts.timestampField || 'ts'
  opts.keyField = opts.keyField || '_id'
  opts.patchField = opts.patchField || 'patch'
  opts.key = opts.key || function (meta, namespace, opts) {
    return [namespace, meta[opts.timestampField]].join(opts.separator)
  }

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

    var meta = ts(meta, opts.timestampField)
    var props = {}

    props[opts.keyField] = opts.key(meta, namespace, opts)
    props[opts.patchField] = patch

    var value = extend(meta, props)

    db.put(value, function (err) {
      if (err) return cb(err)
      cb(null, value)
    })
  }

  function patches (namespace, start, cb) {
    if (!cb) {
      cb = start
      start = null
    }

    var query = {
      startkey: (start || namespace + opts.separator) + '\x00',
      endkey: namespace + opts.separator + '\xff',
      include_docs: true
    }

    db.allDocs(query, function (err, res) {
      if (err) return cb(err)

      cb(null, res.rows.map(function (row) { return row.doc }))
    })
  }
}

function ts (meta, field) {
  var obj = {}
  obj[field] = new Date().toISOString()
  return extend(meta, obj)
}
