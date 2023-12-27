import { Hono } from 'hono'

import logger from './logger'
import setAPIRoutes from './api'

const app = new Hono()

app.use('*', async (c, next) => {
  // get http request
  const req = c.req

  logger.info({
    method: req.method,
    url: req.url.toString(),
    'content-length': req.header('content-length'),
    'user-agent': req.header('user-agent')
  })

  const timeBegin = performance.now()

  await next()

  const timeEnd = performance.now()

  logger.info({
    method: req.method,
    url: req.url.toString(),
    'content-length': req.header('content-length'),
    'user-agent': req.header('user-agent'),
    duration: `${timeEnd - timeBegin}ms`,
    response: {
      status: c.res.status
    }
  })
})

app.get('/', (c) => c.text('Hono!'))

setAPIRoutes(app)

const server = Bun.serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000)
})

logger.info(`Server started at ${server.url.toString()}`)
