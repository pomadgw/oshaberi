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
  }
})

export const useSavedMessages = defineStore('savedMessages', {
  state: (): {
    messages: KeyedChatMessages<ChatCompletionRequestMessage>
    selected: string
  } => ({
    messages: {
      default: []
    },
    selected: 'default'
  }),
  getters: {
    getKeys(): string[] {
      return Object.keys(this.messages)
    },
    getSelected(): ChatMessages<ChatCompletionRequestMessage> {
      return this.messages[this.selected]
    }
  },
  actions: {
    selectChat(key: string) {
      this.selected = key
    },
    setSelectedMessages(messages: ChatMessages<ChatCompletionRequestMessage>) {
      console.log('setSelectedMessages', messages)
      this.messages[this.selected] = messages
    },
    addMessage(
      key: string,
      message: ChatMessage<ChatCompletionRequestMessage>
    ) {
      if (this.messages[key] == null) {
        this.messages[key] = []
      }

      this.messages[key] = [...this.messages[key], message]
    }
  },
  persist: true
})
