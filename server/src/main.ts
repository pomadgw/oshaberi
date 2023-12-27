import { Hono } from 'hono'

import setAPIRoutes from './api'

const app = new Hono()

app.get('/', (c) => c.text('Hono!'))

setAPIRoutes(app)

const server = Bun.serve({
  fetch: app.fetch,
  port: Number(process.env.PORT ?? 3000)
})

console.log(`Server started at ${server.url.toString()}`)
