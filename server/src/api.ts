import { Hono } from 'hono'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { type BaseChatModel } from 'langchain/chat_models/base'
import { ChatOllama } from 'langchain/chat_models/ollama'
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema'
import { ZodError } from 'zod'
import OpenAI from 'openai'

import {
  OshaberiChatParameterSchema,
  type OshaberiValidLLMProvider,
  OshaberiValidLLMProviderSchema
} from './types'
import { OllamaTagSchema } from './types/ollama'

const api = new Hono()

interface LLMProvider {
  setTemperature: (temperature: number) => void
  setModel: (model: string) => void

  getModelLists: () => Promise<string[]>
  getModel: () => BaseChatModel
}

class OpenAIProvider implements LLMProvider {
  private readonly openai = new ChatOpenAI()

  setTemperature(temperature: number): void {
    this.openai.temperature = temperature
  }

  setModel(model: string): void {
    this.openai.modelName = model
  }

  async getModelLists(): Promise<string[]> {
    const openAiInstance = new OpenAI({
      apiKey: this.openai.openAIApiKey
    })

    const list = await openAiInstance.models.list()

    return list.data.map((e) => e.id)
  }

  getModel(): BaseChatModel {
    return this.openai
  }
}

class OllamaProvider implements LLMProvider {
  private readonly ollama: ChatOllama

  constructor(address: string = 'http://localhost:11434', model: string = 'llama') {
    this.ollama = new ChatOllama({
      baseUrl: address,
      model
    })
  }

  setTemperature(temperature: number): void {
    this.ollama.temperature = temperature
  }

  setModel(model: string): void {
    this.ollama.model = model
  }

  async getModelLists(): Promise<string[]> {
    const path = new URL('/api/tags', this.ollama.baseUrl)

    const data = await (await fetch(path.toString())).json()
    const list = OllamaTagSchema.parse(data)

    return list.models.map((e) => e.name)
  }

  getModel(): BaseChatModel {
    return this.ollama
  }
}

const providers: Record<OshaberiValidLLMProvider, LLMProvider> = {
  openai: new OpenAIProvider(),
  ollama: new OllamaProvider()
}

api.onError((e, c) => {
  console.error(e)
  c.status(400)

  if (e instanceof ZodError) {
    return c.json({
      errors: e.errors
    })
  }

  return c.json({
    errors: [(e as any).toString()]
  })
})

api.get('/models', async (c) => {
  const providerId = OshaberiValidLLMProviderSchema.parse(c.req.query('provider'))
  const provider = providers[providerId]

  c.status(200)

  const models = await provider.getModelLists()
  return c.json({ models })
})

api.post('/chat', async (c) => {
  const body = OshaberiChatParameterSchema.parse(await c.req.json())
  const llmProvider = providers[body.provider]

  llmProvider.setModel(body.model)
  llmProvider.setTemperature(body.temperature)

  let messages: BaseMessage[] = []

  for (const m of body.messages) {
    if (m.role === 'user') {
      messages.push(
        new HumanMessage({
          content: m.content
        })
      )
    } else if (m.role === 'assistant') {
      messages.push(
        new AIMessage({
          content: m.content
        })
      )
    } else {
      messages = [
        new SystemMessage({
          content: m.content
        }),
        ...messages
      ]
    }
  }

  const result = await llmProvider.getModel().predictMessages(messages)

  c.status(200)

  return c.json({
    content: result.content,
    role: 'assistant'
  })
})

export default (app: Hono) => app.route('/api', api)
