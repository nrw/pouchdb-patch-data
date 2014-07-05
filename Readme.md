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
      [ { ts: '2014-06-28T06:05:53.100Z', // timestamp
          patch: { a: 'a' },
          _id: 'docÿ2014-06-28T06:05:53.100Z' }, // namespaced and sorted by ts
        { user: 'lee',
          ts: '2014-06-28T06:05:53.113Z',
          patch: { b: 'c' },
          _id: 'docÿ2014-06-28T06:05:53.113Z' } ]
    })
  })
})
```

See tests for more examples.

## Methods

### var patch = Patch(db, opts)

- `db`: an instance of `pouchdb` to store patches and data.
- `opts.separator`: the string to use as a separator for key fields. default:
  `'\xff'`
- `opts.timestampField`: the field to use to store the `timestamp`. default:
  `ts`
- `opts.keyField`: the field to use to store the `key`. default: `_id`
- `opts.patchField`: the field to use to store the `patch`. default: `patch`
- `opts.key`: the function to use to generate each patch's key. Use a custom
  key to add some entropy if there is a chance you'll have two commits in the
  same millisecond.

  ```js
  // default
  opts.key = function (meta, namespace, opts) {
    return [namespace, meta[opts.timestampField]].join(opts.separator)
  }
  ```

### patch.add(namespace, patch, meta, callback)

alias: `addPatch`

- `namespace`: the string to identify this collections of patches. This module
  is designed for use with [patcher](https://www.npmjs.org/package/patcher)
  patches for a single object per unique `namespace`
- `patch`: the object to store as the patch
- `meta`: key/value pairs to store with this patch. Note: the keys
  `opts.timestampField`, `opts.keyField`, and `opts.patchField` will be
  overwritten if set.
- `callback`: receives two arguments, `err` which is only set if an error occurs
  and `commit`, which is the patch and its metadata exactly as it was saved.

### patch.get(namespace, since, callback)

aliases: `patches`, `getPatches`

Callback is called with any error and a list of commits in insert order.

- `namespace`: the collection of patches to read. patches will be streamed in
  the order inserted.
- `since`: optional. pass the `key` of the commit to read commits since. The
  commit with `key === since` will not be returned, only all commits after it.

## License

MIT
