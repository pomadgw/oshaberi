<script setup lang="ts">
import { type ChatCompletionResponseMessage } from 'openai'

import CChat from './components/Chat/CChat.vue'
import { type ChatMessages } from './lib/types/chat'

const a = (): Array<{
  user: 'user' | 'assistant'
  message: string
}> => [
  {
    user: 'user',
    message: 'Hello, how are you?'
  },
  {
    user: 'assistant',
    message: `I am fine.`
  }
]

const messages: ChatMessages<ChatCompletionResponseMessage> = [
  ...a(),
  ...a(),
  ...a(),
  ...a(),
  ...a(),
  ...a(),
  ...a(),
  ...a(),
  ...a()
]
</script>

<template>
  <div class="max-w-5xl m-auto p-8">
    <CChat :messages="messages" />
  </div>
</template>
