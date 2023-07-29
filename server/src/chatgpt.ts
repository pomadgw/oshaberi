import { type AxiosError } from 'axios'
import express from 'express'

import {
  type ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi
} from 'openai'
import { get_encoding } from '@dqbd/tiktoken'

const router = express.Router()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

const tokenizer = get_encoding('cl100k_base')

export function tokenLength(
  messages: string | ChatCompletionRequestMessage[]
): number {
  if (typeof messages === 'string') {
    return tokenizer.encode(messages).length
  }

  const tokensPerMessage = 4

  let totalTokens = 0

  for (const message of messages) {
    totalTokens += tokensPerMessage
    totalTokens += tokenizer.encode(message.content ?? '').length
  }

  totalTokens += 3

  return totalTokens
}

router.post('/tokens', async (req, res) => {
  try {
    const tokens = tokenLength(req.body)

    res.json({ tokens })
  } catch (err) {
    console.error(err)
    const axiosError = err as AxiosError<any>

    res.status(axiosError.status ?? 500).json(axiosError.response?.data)
  }
})

router.post('/', async (req, res) => {
  try {
    const chatCompletion = await openai.createChatCompletion(req.body)

    res.json(chatCompletion.data)
  } catch (err) {
    console.error(err)
    const axiosError = err as AxiosError<any>

    res.status(axiosError.status ?? 500).json(axiosError.response?.data)
  }
})

export default router
