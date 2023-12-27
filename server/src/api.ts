import { Hono } from 'hono'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { type BaseChatModel } from 'langchain/chat_models/base'
import { ChatOllama } from 'langchain/chat_models/ollama'
import { AIMessage, type BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema'
import { ZodError } from 'zod'

import { OshaberiChatParameter, type OshaberiValidLLMProvider } from './types'

const api = new Hono()

// const openaiProvider = new OpenAI()

interface LLMProvider {
  setTemperature: (temperature: number) => void
  setModel: (model: string) => void

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

  getModel(): BaseChatModel {
    return this.ollama
  }
}

const providers: Record<OshaberiValidLLMProvider, LLMProvider> = {
  openai: new OpenAIProvider(),
  ollama: new OllamaProvider()
}

api.post('/chat', async (c) => {
  try {
    const body = OshaberiChatParameter.parse(await c.req.json())
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
  } catch (e) {
    c.status(400)

    if (e instanceof ZodError) {
      return c.json({
        errors: e.errors
      })
    }

    return c.json({
      errors: [(e as any).toString()]
    })
  }
})

export default (app: Hono) => app.route('/api', api)
