import { defineStore } from 'pinia'

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
