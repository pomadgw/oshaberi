import { Redis } from 'ioredis'

let client: Redis | undefined

export async function getClient(): Promise<Redis> {
  if (client == null) {
    client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
  }

  return client
}
