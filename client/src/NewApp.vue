<script setup lang="ts">
import {
  type ChatCompletionResponseMessageRoleEnum,
  type ChatCompletionResponseMessage,
  type CreateChatCompletionRequest
} from 'openai'

import CChat from './components/Chat/CChat.vue'
import CChatInput from './components/Chat/CChatInput.vue'
import CToast from './components/CToast.vue'
import CSettings from './components/CSettings.vue'
import CButton from './components/CButton.vue'

import { type ChatMessages } from './lib/types/chat'
import { type Ref, type ComputedRef, ref, watch, nextTick, computed } from 'vue'
import useTokenCalculator from './hooks/useTokenCalculator'
import { useChatGPTSetting } from './store'
import clipboardEvent from './clipboard'
import useLLM from './hooks/useLLM'
import { marked } from 'marked'
import useToast from './hooks/useToast'

const { openToast } = useToast()

const settingStore = useChatGPTSetting()
const messages: Ref<ChatMessages<ChatCompletionResponseMessage>> = ref([])

const clearChat = (): void => {
  messages.value = []
}

const systemMessage: ComputedRef<ChatCompletionResponseMessage[]> = computed(
  () => {
    return settingStore.system !== ''
      ? [{ role: 'system', content: settingStore.system }]
      : []
  }
)

const messagesToSend = computed(() => {
  return [
    ...systemMessage.value,
    ...(messages.value.map((message) => message.value) ?? [])
  ]
})

const { tokenCount } = useTokenCalculator(messagesToSend)
const cchatRef = ref()

const params: ComputedRef<CreateChatCompletionRequest> = computed(() => ({
  model: settingStore.model,
  messages: messagesToSend.value,
  temperature: settingStore.temperature,
  max_tokens:
    settingStore.maxTokens === 0
      ? undefined
      : settingStore.maxTokens - tokenCount.value,
  presence_penalty: settingStore.presencePenalty,
  frequency_penalty: settingStore.frequencyPenalty
}))

const appendToMessages = (
  role: ChatCompletionResponseMessageRoleEnum,
  content: string
): void => {
  messages.value = [
    ...messages.value,
    {
      user: role as string,
      message: role === 'user' ? content : marked.parse(content),
      isHTML: role !== 'user',
      value: {
        content,
        role
      }
    }
  ]
}

const { chat } = useLLM()
const send = (isResend = false): void => {
  const messageLength = messages.value.length

  if (!isResend && messages.value[messageLength - 1].user !== 'user') {
    messages.value = messages.value.slice(0, messageLength - 1)
  }

  chat.mutate(params.value)
}

watch(chat.isSuccess, (value) => {
  if (value) {
    const data = chat.data?.value?.data

    if (data != null) {
      const message = data.choices[0].message?.content ?? ''
      const role = data.choices[0].message?.role ?? 'assistant'

      appendToMessages(role, message)
    }
  }
})

watch(chat.isError, (isError) => {
  if (isError) {
    console.error(chat.error?.value)
    const errorMessage =
      chat.error?.value?.response?.data?.error.toString() ?? 'Unknown error'
    openToast(`Error: ${errorMessage}`)
  }
})

const sendMessage = (message: string): void => {
  appendToMessages('user', message)
  send()
}

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

const onSuccessCopy = (): void => {
  openToast('Copied!')
}

clipboardEvent.on('success', onSuccessCopy)

const dialogOpen = ref(false)
const openSettings = (): void => {
  dialogOpen.value = true
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />
  <CToast class="z-50" />
  <div class="max-w-5xl m-auto p-8 flex flex-col h-screen">
    <div class="flex gap-3">
      <c-button @click="openSettings">Open Settings</c-button>
      <c-button @click="clearChat">Clear Chat</c-button>
    </div>
    <div class="flex-1">
      <CChat
        ref="cchatRef"
        :messages="messages"
        style="max-height: calc(100vh - 48px - 124px - 64px)"
      />
    </div>

    <CChatInput
      :token-count="tokenCount"
      :is-sending="chat.status.value === 'loading'"
      class="mt-3"
      @send-message="sendMessage"
    />
  </div>
</template>
