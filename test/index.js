var test = require('tape')
var Pouch = require('pouchdb')
var Patch = require('../')

var db, patch

test('setup', function (t) {
  Pouch.destroy('patch-data', function (err) {
    t.error(err)
    db = Pouch('patch-data', {db: require('memdown')})
    patch = Patch(db)
    t.end()
  })
})

test('adds patch', function (t) {
  patch.add('doc1', {a: 'b'}, function (err, commit) {
    t.error(err, 'no err')

    t.same(commit.patch, {a: 'b'}, 'correct patch')
    t.ok(/^doc1\xff/.test(commit._id), 'has key')
    t.ok(commit.ts, 'has timestamp')
    t.end()
  })
})

test('reads patches', function (t) {
  patch.patches('doc1', function (err, body) {
    t.error(err)
    t.same(body.length, 1, 'correct number of patches')
    t.same(body[0].patch, {a: 'b'}, 'correct patches')
    t.ok(/^doc1\xff/.test(body[0]._id), 'has key')
    t.ok(body[0].ts, 'has timestamp')
    t.end()
  })
})

test('accepts meta', function (t) {
  patch.add('doc1', {a: 'c'}, {user: 'lee'}, function (err) {
    t.error(err, 'no err')
    t.end()
  })
})

test('includes meta', function (t) {
  patch.patches('doc1', function (err, body) {
    t.error(err)
    t.same(body.length, 2, 'correct number of patches')
    t.same(body[0].patch, {a: 'b'}, 'correct patches')
    t.ok(/^doc1\xff/.test(body[0]._id), 'has key')
    t.notOk(body[0].user, 'no user')

    t.same(body[1].patch, {a: 'c'}, 'correct patches')
    t.equal(body[1].user, 'lee', 'with user')
    t.ok(/^doc1\xff/.test(body[1]._id), 'has key')
    t.ok(body[1].ts, 'has timestamp')
    t.end()
  })
})

test('multiple docs do not clash', function (t) {
  t.plan(16)

  patch.add('doc2', {a: 'd'}, {user: 'kara'}, function (err) {
    t.error(err, 'no err')

    patch.patches('doc1', function (err, body) {
      t.error(err)
      t.same(body.length, 2, 'correct number of patches')
      t.same(body[0].patch, {a: 'b'}, 'correct patches')
      t.ok(/^doc1\xff/.test(body[0]._id), 'has key')
      t.notOk(body[0].user, 'no user')

      t.same(body[1].patch, {a: 'c'}, 'correct patches')
      t.equal(body[1].user, 'lee', 'with user')
      t.ok(/^doc1\xff/.test(body[1]._id), 'has key')
      t.ok(body[1].ts, 'has timestamp')
    })

    patch.patches('doc2', function (err, body) {
      t.error(err)
      t.same(body.length, 1, 'correct number of patches')
      t.same(body[0].patch, {a: 'd'}, 'correct patches')
      t.equal(body[0].user, 'kara', 'with user')
      t.ok(/^doc2\xff/.test(body[0]._id), 'has key')
      t.ok(body[0].ts, 'has timestamp')
    })
  })
})

test('custom key', function (t) {
  patch = Patch(db, {key: function (meta, namespace, opts) {
    return [
      namespace,
      meta[opts.timestampField],
      meta.user || ''
    ].join(opts.separator)
  }})

  patch.add('doc3', {a: 'e'}, {user: 'd'}, function (err) {
    t.error(err, 'no err')

    patch.patches('doc3', function (err, body) {
      t.error(err)
      t.same(body.length, 1, 'correct number of patches')
      t.ok(/^doc3\xff/.test(body[0]._id), 'has key')
      t.ok(/\xffd$/.test(body[0]._id), 'has key')
      t.same(body[0].patch, {a: 'e'}, 'correct patches')
      t.equal(body[0].user, 'd', 'has user')
      t.end()
    })
  })
})

test('get since commit id', function (t) {
  patch.patches('doc1', function (err, base) {
    patch.patches('doc1', base[0]._id, function (err, body) {
      t.error(err)
      t.same(body.length, 1, 'correct number of patches')
      t.same(body[0].patch, {a: 'c'}, 'correct patches')
      t.equal(body[0].user, 'lee', 'with user')
      t.ok(/^doc1\xff/.test(body[0]._id), 'has key')
      t.ok(body[0].ts, 'has timestamp')
      t.end()
    })
  })
})

test('teardown', function (t) {
  Pouch.destroy('patch-data', t.end)
})
