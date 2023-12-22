import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Hono!'))

const server = Bun.serve({
  fetch: app.fetch,
  port: Number(process.env.PORT || 3000),
})

console.log(`Server started at ${server.url}`)
