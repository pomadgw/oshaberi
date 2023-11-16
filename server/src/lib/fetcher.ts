import axios, { type AxiosResponse, type AxiosRequestConfig } from 'axios'

import { getClient } from './redis'

export const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

async function fetchData(
  url: string | URL,
  config: AxiosRequestConfig = {
    method: 'GET',
    responseType: 'text',
    headers: {
      'User-Agent': USER_AGENT
    }
  }
): Promise<string> {
  const redisClient = await getClient()

  // url to base64
  const key = `fetcher:${Buffer.from(url.toString()).toString('base64')}`

  const cached = await redisClient.get(key)

  if (cached != null) {
    return cached
  }

  const response = await axios<any, AxiosResponse<string>>({
    url: url.toString(),
    ...config
  })

  await redisClient.setEx(key, 60 * 60 * 24, response.data)

  return response.data
}

export const fetch = fetchData
