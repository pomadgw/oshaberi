import { type AxiosError } from 'axios'
import express from 'express'

import { Configuration, OpenAIApi } from 'openai'

const router = express.Router()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

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
