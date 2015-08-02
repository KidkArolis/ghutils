const jsonist = require('jsonist')
    , xtend   = require('xtend')
    , qs      = require('querystring')
    , url     = require('url')
    , util    = require('util')

    , apiRoot = 'https://api.github.com'

function makeOptions (auth, options) {
  return xtend({
      headers : { 'User-Agent' : 'Magic Node.js application that does magic things' }
    , auth    : auth.user + ':' + auth.token
  }, options)
}


function handler (callback) {
  return function responseHandler (err, data, res) {
    if (err)
      return callback(err)

    if (data.error || data.message)
      return callback(new Error('Error from GitHub: ' + (data.error || data.message)))

    callback(null, data, res)
  }
}


function ghget (auth, url, options, callback) {
  options = makeOptions(auth, options)

  jsonist.get(url, options, handler(callback))
}


function ghpost (auth, url, data, options, callback) {
  options = makeOptions(auth, options)

  jsonist.post(url, data, options, handler(callback))
}


function lister (auth, urlbase, options, callback) {
  var retdata = []
    , optqs  = qs.stringify(options)

  ;(function next (url) {

    if (optqs) {
      url = appendQueryString(url, optqs)
    }

    ghget(auth, url, options, function (err, data, res) {
      if (err)
        return callback(err)

      if (util.isArray(data) && data.length)
        retdata.push.apply(retdata, data)
      else
        retdata.push(data)

      var nextUrl = getNextUrl(res.headers.link)
      if (nextUrl)
        return next(nextUrl)

      callback(null, retdata)
    })
  }(urlbase))

  function getNextUrl (link) {
    if (typeof link == 'undefined')
      return
    var match = /<(.*)>; rel="next"/.exec(link)
    return match && match[1]
  }

  function appendQueryString(urlbase, qs) {
    return urlbase + (!!url.parse(urlbase).search ? '&' : '?') + optqs
  }
}


module.exports.makeOptions = makeOptions
module.exports.ghpost      = ghpost
module.exports.ghget       = ghget
module.exports.handler     = handler
module.exports.lister      = lister
module.exports.apiRoot     = apiRoot
