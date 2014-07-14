# pouchdb-patch-data [![build status](https://secure.travis-ci.org/nrw/pouchdb-patch-data.png)](http://travis-ci.org/nrw/pouchdb-patch-data)

Store and read object patches (with metadata) in insert order. Based on [level-patch-data](https://github.com/nrw/level-patch-data).

[![testling badge](https://ci.testling.com/nrw/pouchdb-patch-data.png)](https://ci.testling.com/nrw/pouchdb-patch-data)

## Example

``` js
var assert = require('assert')
var Pouch = require('pouchdb')
var Patch = require('pouchdb-patch-data')

var db = Pouchdb('patch-test')
var patch = Patch(db)

patch.add('doc', {a: 'a'}, {user: 'lee'}, function (err, commit) {
  patch.add('doc', {b: 'c'}, {user: 'kara'}, function (err, commit) {
    patch.get('doc', function (body) {
      // body is
      [ { user: 'lee',
          namespace: 'doc',
          patch: { a: 'a' },
          // _id is namespaced and sorted by timestamp
          _id: 'a070646f6335007068786c38693434352e30366274390000',
          _rev: '1-92e0f5bd431fb35aef6dbcc509e07732' },
        { user: 'kara',
          namespace: 'doc',
          patch: { b: 'c' },
          _id: 'a070646f6335007068786c38693434352e30376c64690000',
          _rev: '1-66ca124e82aecce68d0a3a3a25ccb6d6' } ]
    })
  })
})
```

See tests for more examples.

## Methods

### var patch = Patch(db, opts)

- `db`: an instance of `pouchdb` to store patches and data.
- `opts.namespaceField`: the field to use to store the `namespace`. default:
  `namespace`
- `opts.patchField`: the field to use to store the `patch`. default: `patch`

### patch.add(namespace, patch, meta, callback)

alias: `addPatch`

- `namespace`: the string to identify this collections of patches. This module
  is designed for use with [patcher](https://www.npmjs.org/package/patcher)
  patches for a single object per unique `namespace`
- `patch`: the object to store as the patch
- `meta`: key/value pairs to store with this patch. Note: the keys
  `opts.namespaceField`, and `opts.patchField` will be
  overwritten if set.
- `callback`: receives two arguments, `err` which is only set if an error occurs
  and `commit`, which is the patch and its metadata exactly as it was saved.

### patch.get(namespace, since, callback)

aliases: `patches`, `getPatches`

Callback is called with any error and a list of commits in insert order.

- `namespace`: the collection of patches to read. patches will be streamed in
  the order inserted.
- `since`: optional. pass the `_id` of the commit to read commits since. The
  commit with `_id === since` will not be returned, only all commits after it.

## License

MIT
