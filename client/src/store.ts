import { defineStore } from 'pinia'
import {
  type KeyedChatMessages,
  type ChatMessage,
  type ChatMessages
} from './lib/types/chat'
import { type ChatCompletionRequestMessage } from 'openai'

type Model = 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4'
const supportedModels: Model[] = ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4']

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useChatGPTSetting = defineStore('chatgptSettings', {
  state: () => ({
    temperature: 1,
    maxTokens: 1024,
    model: 'gpt-3.5-turbo' as Model,
    presencePenalty: 0,
    frequencyPenalty: 0,
    system: ''
  }),
  actions: {
    setTemperature(temperature: number) {
      this.temperature = temperature
    },
    setMaxTokens(maxTokens: number) {
      this.maxTokens = maxTokens
    },
    setModel(model: string) {
      if (!supportedModels.includes(model as Model)) {
        throw new Error(`Model ${model} is not supported`)
      }

      this.model = model as Model
    }
  },
  persist: true
})

export const useSavedMessages = defineStore('savedMessages', {
  state: (): {
    messages: KeyedChatMessages<ChatCompletionRequestMessage>
    selectedSession: string
  } => ({
    messages: {
      default: []
    },
    selectedSession: 'default'
  }),
  getters: {
    getSessions(): string[] {
      return Object.keys(this.messages)
    },
    getSelected(): ChatMessages<ChatCompletionRequestMessage> {
      return this.messages[this.selectedSession]
    }
  },
  actions: {
    selectSession(session: string) {
      this.selectedSession = session
    },
    removeSession(session: string) {
      this.messages = Object.fromEntries(
        Object.entries(this.messages).filter(([k]) => k !== session)
      )
    },
    addNewSession(key: string) {
      this.messages[key] = []
    },
    setMessagesToSelectedSession(
      messages: ChatMessages<ChatCompletionRequestMessage>
    ) {
      this.messages[this.selectedSession] = messages
    },
    addMessage(
      session: string,
      message: ChatMessage<ChatCompletionRequestMessage>
    ) {
      if (this.messages[session] == null) {
        this.messages[session] = []
      }

      this.messages[session] = [...this.messages[session], message]
    }
  },
  persist: true
})
