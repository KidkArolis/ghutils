const test    = require('tape')
    , xtend   = require('xtend')
    , util    = require('./test-util')
    , ghutils = require('./')


test('that lister follows res.headers.link', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , urlBase  = 'https://api.github.com/foobar'
    , server

  server = util.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghutils.lister(xtend(auth), urlBase, {}, util.verifyData(t, result))
    })
    .on('request', util.verifyRequest(t, auth))
    .on('get', util.verifyUrl(t, [
        'https://api.github.com/foobar'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , util.verifyClose(t))
})

test('that lister appends query string correctly', function (t) {
  t.plan(3)
  var urlBase  = 'https://api.github.com/foobar'

  testListerUrl({}, 'https://api.github.com/foobar', function () {
    testListerUrl({state: 'all'}, 'https://api.github.com/foobar?state=all', function () {
      urlBase += '?param=1'
      testListerUrl({state: 'all'}, 'https://api.github.com/foobar?param=1&state=all')
    })
  })

  function testListerUrl(options, expectedUrl, done) {
    util.makeServer([[]])
      .on('ready', function () {
        ghutils.lister({}, urlBase, options, function () {})
      })
      .on('get', util.verifyUrl(t, [expectedUrl]))
      .on('close', done || function () {})
  }
})
