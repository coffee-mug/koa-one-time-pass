const crypto = require('crypto')
const url = require('url')
const Koa = require('koa')

const app = new Koa()

let users = {}
let session = {}

const MINUTES = 60 * 1000
const SESSION_DURATION = 30 * MINUTES

app.use(async ctx => {
  switch (ctx.path) {
    case '/':
      ctx.body = 'Home'
      break
    case '/login':
    case '/login/':
      switch (ctx.method) {
        case 'GET':
          // user already logged in
          if (ctx.cookies.get('token')) {
            ctx.redirect('/')
          }

          let token = await createToken(16)
          let url = new URL('http://localhost:5000')

          // Get the email to which we should send the token
          // normally from the POST form data, fake here for
          // simplification
          let fakeEmail = 'test@yolo.fr'

          // Keep the key value pair in session store
          // or memory here, for dev
          session[token] = fakeEmail

          // the url should points to /confirm and contain token and email query params
          url.pathname = '/confirm'
          url.searchParams.set('token', token)
          url.searchParams.set('email', fakeEmail)

          ctx.type = 'html'
          ctx.body = `Login - Token: <a href="${url.href}">Login with fake url, already registered </a>`
          break
        case 'POST':
          // for the moment, we'll handle it on "GET" handler
          break
      }
      break
    case '/confirm':
      if (!ctx.query.email || !ctx.query.token) {
        ctx.status = 401
        ctx.redirect('/login')
      }
      // check if user is registered in session
      try {
        // TODO: add a timestamp too
        let tokenExists = session[ctx.query.token] && session[ctx.query.token] === ctx.query.email
        if (tokenExists) {
          ctx.cookies.set('token', ctx.query.token, { maxAge: SESSION_DURATION })
          ctx.redirect('/protected')
        }
      } catch (e) {
        console.log(e)
        ctx.status = 500
      }
      break
    case '/protected':
      // authenticated user ?
      if (!ctx.cookies.get('token') || !session[ctx.cookies.get('token')]) {
        ctx.redirect('/login')
      }
      // logged-in user
      ctx.body = 'Logged in space !'
      break
    default:
      ctx.status = 404
  }
})

const createToken = async (count) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(count, (err, buf) => {
      if (err) throw err
      resolve(buf.toString('hex'))
    })
  })
}

app.listen(5000)

// https://zeit.co/confirm?email=lucas.kostka%40escdijon.eu&token=tyAH8s88nGMc2XwXWkAsuoeR&mode=login
