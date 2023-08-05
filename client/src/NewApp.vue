<script setup lang="ts">
import { type ChatCompletionResponseMessage } from 'openai'

import CChat from './components/Chat/CChat.vue'
import CChatInput from './components/Chat/CChatInput.vue'
import CToast from './components/CToast.vue'
import CSettings from './components/CSettings.vue'
import CButton from './components/CButton.vue'

import { type ChatMessages } from './lib/types/chat'
import { type Ref, ref, watch, nextTick, computed } from 'vue'
import useTokenCalculator from './hooks/useTokenCalculator'
import clipboardEvent from './clipboard'

const messages: Ref<ChatMessages<ChatCompletionResponseMessage>> = ref([])

const clearChat = (): void => {
  messages.value = []
}
const appendToMessages = (content: string): void => {
  messages.value = [
    ...messages.value,
    {
      user: 'user',
      message: content,
      value: {
        content,
        role: 'user'
      }
    }
  ]
}

const messageForTokenCalculator = computed(() => {
  return messages.value.map((message) => message.value) ?? []
})

const { tokenCount } = useTokenCalculator(messageForTokenCalculator)
const cchatRef = ref()

watch(
  messages,
  async () => {
    if (cchatRef.value != null) {
      await nextTick(() => {
        const element = cchatRef.value.$el as HTMLElement

        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
      })
    }
  },
  {
    immediate: true
  }
)

const isToastOpen = ref(false)
const toastText = ref('')
const onSuccessCopy = (): void => {
  toastText.value = 'Copied!'
  isToastOpen.value = true
}

clipboardEvent.on('success', onSuccessCopy)

const dialogOpen = ref(false)
const openSettings = (): void => {
  dialogOpen.value = true
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />
  <CToast v-model:open="isToastOpen" :text="toastText" />
  <div class="max-w-5xl m-auto p-8 flex flex-col h-screen">
    <div class="flex gap-3">
      <c-button @click="openSettings">Open Settings</c-button>
      <c-button @click="clearChat">Clear Chat</c-button>
    </div>
    <div class="flex-1">
      <CChat ref="cchatRef" :messages="messages" />
    </div>

    <CChatInput
      :messages="messages"
      :token-count="tokenCount"
      @send-message="appendToMessages"
    />
  </div>
</template>
