import path from 'path'

import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'

import homeRouters from './routers/home.js'
import assetsRouters from './routers/assets.js'
import chatRouters from './routers/chatgpt.js'

if (process.env.NODE_ENV === 'production') {
  dotenv.config({
    path: path.join(path.resolve(), '.env')
  })
} else {
  dotenv.config({
    path: path.join(path.resolve(), '../.env')
  })
}

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOSTNAME ?? 'localhost'
const publicPath = path.join(path.resolve(), '../client/public')
const distPath = path.join(path.resolve(), 'dist')

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use('/', express.static(distPath))
} else {
  app.use('/', express.static(publicPath))
  app.use('/src', assetsRouters)
}

const whitelist = ['http://localhost:3000', 'http://localhost:5173']

// get additional whitelisted allowed origins from env variable
if (process.env.CORS_WHITELIST != null) {
  const additionalWhitelist = process.env.CORS_WHITELIST.split(',')
  whitelist.push(...additionalWhitelist)
}

// add body parser
app.use(express.json())

app.options(
  '/api/.+',
  cors({
    origin: function (origin, callback) {
      if (origin != null && whitelist.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  })
)

app.use('/api/chat', chatRouters())

app.use(homeRouters)

app.listen(port, hostname, () => {
  console.log('Server listening on port', port)
})
