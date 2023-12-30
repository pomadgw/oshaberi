import { ChatOpenAI } from 'langchain/chat_models/openai'
import { type BaseChatModel } from 'langchain/chat_models/base'
import { ChatOllama } from 'langchain/chat_models/ollama'
import OpenAI from 'openai'

import { type OshaberiValidLLMProvider } from './types'
import { OllamaTagSchema } from './types/ollama'

interface LLMProvider {
  setTemperature: (temperature: number) => void
  setModel: (model: string) => void

  getModelLists: () => Promise<string[]>
  getModel: () => BaseChatModel
}

class OpenAIProvider implements LLMProvider {
  private readonly openai = new ChatOpenAI()
  private models: string[] = []

  setTemperature(temperature: number): void {
    this.openai.temperature = temperature
  }

  setModel(model: string): void {
    this.openai.modelName = model
  }

  async getModelLists(): Promise<string[]> {
    if (this.models.length === 0) {
      const openAiInstance = new OpenAI({
        apiKey: this.openai.openAIApiKey
      })

      const list = await openAiInstance.models.list()

      this.models = list.data.map((e) => e.id).filter((e) => e.includes('gpt'))
    }

    return this.models
  }

  getModel(): BaseChatModel {
    return this.openai
  }
}

class OllamaProvider implements LLMProvider {
  private readonly ollama: ChatOllama
  private models: string[] = []

  constructor(
    address: string = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: string = 'llama'
  ) {
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
    if (this.models.length === 0) {
      const path = new URL('/api/tags', this.ollama.baseUrl)

      const data = await (await fetch(path.toString())).json()
      const list = OllamaTagSchema.parse(data)

      this.models = list.models.map((e) => e.name)
    }

    return this.models
  }

  getModel(): BaseChatModel {
    return this.ollama
  }
}

export const providers: Record<OshaberiValidLLMProvider, LLMProvider> = {
  openai: new OpenAIProvider(),
  ollama: new OllamaProvider()
}
