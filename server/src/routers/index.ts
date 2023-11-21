import path from 'path'

import express from 'express'

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

  app.use('/api/chat', chatRouters())
  app.use('/api/states', stateRouters)

  app.use(homeRouters)
}
