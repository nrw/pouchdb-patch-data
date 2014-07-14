var test = require('tape')
var Pouch = require('pouchdb')
var Patch = require('../')

var db, patch

test('setup', function (t) {
  Pouch.destroy('patch-data', function (err) {
    t.error(err)
    db = Pouch('patch-data')
    patch = Patch(db)
    t.end()
  })
})

test('adds patch', function (t) {
  patch.add('doc1', {a: 'b'}, function (err, commit) {
    t.error(err, 'no err')
    t.same(commit.patch, {a: 'b'}, 'correct patch')
    t.ok(commit._id, 'has key')
    t.end()
  })
})

test('reads patches', function (t) {
  patch.patches('doc1', function (err, body) {
    t.error(err)
    t.same(body.length, 1, 'correct number of patches')
    t.same(body[0].patch, {a: 'b'}, 'correct patches')
    t.ok(body[0]._id, 'has key')
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
    t.ok(body[0]._id, 'has _id')
    t.notOk(body[0].user, 'no user')

    t.same(body[1].patch, {a: 'c'}, 'correct patches')
    t.equal(body[1].user, 'lee', 'with user')
    t.ok(body[1]._id, 'has _id')
    t.end()
  })
})

test('multiple docs do not clash', function (t) {
  t.plan(14)

  patch.add('doc2', {a: 'd'}, {user: 'kara'}, function (err) {
    t.error(err, 'no err')

    patch.patches('doc1', function (err, body) {
      t.error(err)
      t.same(body.length, 2, 'correct number of patches')
      t.same(body[0].patch, {a: 'b'}, 'correct patches')
      t.ok(body[0]._id, 'has _id')
      t.notOk(body[0].user, 'no user')

      t.same(body[1].patch, {a: 'c'}, 'correct patches')
      t.equal(body[1].user, 'lee', 'with user')
      t.ok(body[1]._id, 'has _id')
    })

    patch.patches('doc2', function (err, body) {
      t.error(err)
      t.same(body.length, 1, 'correct number of patches')
      t.same(body[0].patch, {a: 'd'}, 'correct patches')
      t.equal(body[0].user, 'kara', 'with user')
      t.ok(body[0]._id, 'has _id')
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
      t.ok(body[0]._id, 'has _id')
      t.end()
    })
  })
})

test('order check: fill', function (t) {
  t.plan(2000)

  setTimeout(function () {
    var i = 0
    while (i < 1000) {
      patch.add('doc4', {i: i}, noErr)
      i++
    }
  }, 0)

  setTimeout(function () {
    var i = 0
    while (i < 1000) {
      patch.add('doc5', {i: i}, noErr)
      i++
    }
  }, 0)

  function noErr (err) { t.error(err) }
})

test('order check: sync', function (t) {
  patch.patches('doc4', function (err, body) {
    t.error(err, 'no err')
    t.equal(body.length, 1000)
    var copy = body.slice(0)
    copy.sort(function (a, b) { return a.patch.i - b.patch.i })
    t.same(body, copy)
    t.end()
  })
})

test('order check: sync', function (t) {
  patch.patches('doc5', function (err, body) {
    t.error(err, 'no err')
    t.equal(body.length, 1000)
    var copy = body.slice(0)
    copy.sort(function (a, b) { return a.patch.i - b.patch.i })
    t.same(body, copy)
    t.end()
  })
})

test('teardown', function (t) {
  Pouch.destroy('patch-data', t.end)
})
