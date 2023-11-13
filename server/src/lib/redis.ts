import { createClient } from 'redis'

let client: ReturnType<typeof createClient> | undefined

export async function getClient(): Promise<ReturnType<typeof createClient>> {
  if (client == null) {
    client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379'
    })

    await client.connect()
  }

  return client
}
