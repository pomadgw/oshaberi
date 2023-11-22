import path from 'path'

import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { attachRouters } from './routers/index.js'

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

const app = express()

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

app.use(morgan('combined'))

attachRouters(app)

app.listen(port, hostname, () => {
  console.log('Server listening on port', port)
})
