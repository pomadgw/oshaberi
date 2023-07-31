import 'dotenv/config'

import express from 'express'
import path from 'path'
import cors from 'cors'

// import { franc } from 'franc'
import lingua from 'lingua-nodejs'

import homeRouters from './home.js'
import assetsRouters from './assets.js'
import chatRouters from './chatgpt.js'

const port = Number(process.env.PORT ?? 3000)
const hostname = process.env.HOSTNAME ?? 'localhost'
const publicPath = path.join(path.resolve(), 'public')
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

app.use('/api/chat', chatRouters)

app.post('/api/language', (req, res) => {
  const { text } = req.body
  const language = lingua.detectLanguage(text)

  res.json({ language })
})

app.use(homeRouters)

app.listen(port, hostname, () => {
  console.log('Server listening on port', port)
})
