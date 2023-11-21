import path from 'path'

import express from 'express'
import basicAuth from 'express-basic-auth'

import homeRouters from './home.js'
import assetsRouters from './assets.js'
import chatRouters from './chatgpt.js'
import stateRouters from './state.js'

const publicPath = path.join(path.resolve(), '../client/public')
const distPath = path.join(path.resolve(), 'dist')

export function attachRouters(app: express.Express): void {
  if (process.env.NODE_ENV === 'production') {
    app.use('/', express.static(distPath))
  } else {
    app.use('/', express.static(publicPath))
    app.use('/src', assetsRouters)
  }

  const apiRouter = express.Router()

  // add basic auth
  if (
    process.env.BASIC_AUTH_USERNAME != null &&
    process.env.BASIC_AUTH_PASSWORD != null
  ) {
    apiRouter.use(
      basicAuth({
        users: {
          [process.env.BASIC_AUTH_USERNAME]: process.env.BASIC_AUTH_PASSWORD
        }
      })
    )
  }

  apiRouter.use('/chat', chatRouters())
  apiRouter.use('/states', stateRouters)

  app.use('/api', apiRouter)

  app.use(homeRouters)
}
