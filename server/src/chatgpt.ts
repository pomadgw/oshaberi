import { type AxiosError } from 'axios'
import express from 'express'

import {
  type ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
  type CreateChatCompletionRequest
} from 'openai'
import { get_encoding } from '@dqbd/tiktoken'

import functions, { functionLibraries } from './lib/functions.js'

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

export default function chatGptRouter(): express.Router {
  const router = express.Router()

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
  })

  const openai = new OpenAIApi(configuration)

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
      const chatCompletion = await openai.createChatCompletion({
        ...req.body,
        functions
      })

      res.json(chatCompletion.data)
    } catch (err) {
      console.error(err)
      const axiosError = err as AxiosError<any>

      res.status(axiosError.status ?? 500).json(axiosError.response?.data)
    }
  })

  router.post('/function', async (req, res) => {
    const body: CreateChatCompletionRequest = { ...req.body, functions }

    // get the last message
    const lastMessage = body.messages[body.messages.length - 1]
    if (lastMessage.role !== 'assistant') {
      res.status(400).json({
        error: 'The last message must be from the assistant.'
      })

      return
    }

    if (lastMessage.function_call == null) {
      res.status(400).json({
        error: 'The last message must be a function call.'
      })

      return
    }

    const functionLibrary = functionLibraries.find(
      (fn) => fn.name === lastMessage.function_call?.name
    )

    if (functionLibrary == null) {
      res.status(400).json({
        error: `The function ${
          lastMessage.function_call?.name ?? ''
        } does not exist.`
      })

      return
    }

    if (typeof lastMessage.content === 'undefined') {
      lastMessage.content = ''
    }

    try {
      const argumentsFromOpenAI = lastMessage.function_call?.arguments
      let parsedArguments

      try {
        parsedArguments = JSON.parse(argumentsFromOpenAI ?? '{}')
      } catch (e) {
        console.error(e)
      }

      const result = await functionLibrary?.callback(
        parsedArguments ?? argumentsFromOpenAI
      )
      console.log({ result })

      body.messages.push({
        role: 'function',
        name: lastMessage.function_call?.name,
        content: JSON.stringify(result)
      })

      const chatCompletion = await openai.createChatCompletion(body)

      res.json(chatCompletion.data)
    } catch (err) {
      console.error(err)
      const axiosError = err as AxiosError<any>

      res
        .status(axiosError.status ?? 500)
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        .json(axiosError.response?.data ?? axiosError.toString())
    }
  })

  return router
}
