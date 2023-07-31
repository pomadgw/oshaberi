<script setup lang="ts">
import {
  type CreateChatCompletionResponse,
  type ChatCompletionResponseMessage,
  type CreateChatCompletionRequest
} from 'openai'

import axios, { type AxiosResponse } from 'axios'
import debounce from 'lodash/debounce'

import CSettings from './components/CSettings.vue'
import CToast from './components/CToast.vue'
import CButton from './components/CButton.vue'
import ChatBubble from './components/ChatBubble.vue'
import { type ComputedRef, computed, ref, watch } from 'vue'
import { useChatGPTSetting } from './store'
import useLoading from './hooks/useLoading'

import clipboardEvent from './clipboard'

const store = useChatGPTSetting()

const isToastOpen = ref(false)
const toastText = ref('')

const dialogOpen = ref(false)

const openSettings = (): void => {
  dialogOpen.value = true
}

const userMessage = ref('')
const userMessages = ref<ChatCompletionResponseMessage[]>([])
const userMessagesTokenLength = ref(0)

const onSuccessCopy = (): void => {
  toastText.value = 'Copied!'
  isToastOpen.value = true
}

clipboardEvent.on('success', onSuccessCopy)

const systemMessage: ComputedRef<ChatCompletionResponseMessage[]> = computed(
  () => {
    return store.system !== ''
      ? [{ role: 'system', content: store.system }]
      : []
  }
)

const clearChat = (): void => {
  userMessages.value = []
}

const { isLoading: isLoadingTokensLength, call: getTokensLength } = useLoading(
  async (): Promise<void> => {
    const result: AxiosResponse<{ tokens: number }> = await axios.post(
      '/api/chat/tokens',
      [
        ...systemMessage.value,
        ...userMessages.value,
        {
          role: 'user',
          content: userMessage.value
        }
      ]
    )

    userMessagesTokenLength.value = result.data.tokens
  }
)

watch(
  () => [...systemMessage.value, ...userMessages.value, userMessage.value],
  debounce(async () => {
    await getTokensLength()
  }, 100)
)

// reversed to show latest message at the bottom
const reversedUserMessages = computed(() =>
  userMessages.value.slice().reverse()
)

const detectLanguage = async (text: string): Promise<string> => {
  const result = await axios.post('/api/language', {
    text
  })

  return result.data.language as string
}

const reversedUserMessagesWithLanguages = ref<
  Array<ChatCompletionResponseMessage & { lang: string }>
>([])

watch(reversedUserMessages, async () => {
  reversedUserMessagesWithLanguages.value = await Promise.all(
    reversedUserMessages.value.map(
      async (message: ChatCompletionResponseMessage) => {
        const lang = await detectLanguage(message.content ?? '')
        return {
          ...message,
          lang
        }
      }
    )
  )
})

const send = async (isResend = false): Promise<void> => {
  if (!isResend) {
    userMessages.value = [
      ...userMessages.value,
      {
        role: 'user',
        content: userMessage.value
      }
    ]
    userMessage.value = ''
  }

  const messages: ChatCompletionResponseMessage[] = [
    ...systemMessage.value,
    ...userMessages.value
  ]

  const params: CreateChatCompletionRequest = {
    model: store.model,
    messages,
    temperature: store.temperature,
    max_tokens:
      store.maxTokens === 0
        ? undefined
        : store.maxTokens - userMessagesTokenLength.value,
    presence_penalty: store.presencePenalty,
    frequency_penalty: store.frequencyPenalty
  }

  try {
    const result: AxiosResponse<CreateChatCompletionResponse> =
      await axios.post('/api/chat', params)

    if (result.data.choices.length === 0) {
      return
    }

    const lastChoice = result.data.choices[0]

    userMessages.value = [
      ...userMessages.value,
      {
        role: lastChoice.message?.role ?? 'assistant',
        content: lastChoice.message?.content ?? ''
      }
    ]
  } catch (err) {
    console.error(err)
    toastText.value = `Failed to send message: ${(err as Error).toString()}`
    isToastOpen.value = true
  }
}

const { isLoading: isChatLoading, call: sendChat } = useLoading(send)

const resend = async (): Promise<void> => {
  // remove last element if it's assitant message
  if (userMessages.value[userMessages.value.length - 1].role === 'assistant') {
    userMessages.value = userMessages.value.slice(0, -1)
  }

  await sendChat(true)
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />

  <CToast v-model:open="isToastOpen" :text="toastText" />
  <div class="max-w-7xl p-8 m-auto flex flex-col h-screen">
    <div class="flex gap-3">
      <c-button @click="openSettings">Open Settings</c-button>
      <c-button @click="clearChat">Clear Chat</c-button>
    </div>
    <div class="flex flex-col py-6">
      <div
        class="inline-flex flex-col-reverse overflow-auto gap-4 mb-4 pr-3"
        style="height: calc(100vh - 48px - 24px - 24px - 200px)"
      >
        <div>
          <c-button
            :disabled="isChatLoading || userMessages.length === 0"
            :is-loading="isChatLoading"
            @click="resend"
            >Resend</c-button
          >
        </div>
        <ChatBubble
          v-for="(msg, index) in reversedUserMessagesWithLanguages"
          :key="index"
          :chat="msg"
        />
      </div>
      <div class="flex-1 flex gap-4">
        <div
          :data-replicated-value="userMessage"
          class="flex-1 grid grow-wrap after:max-h-[100px] after:border-blue-100 after:whitespace-pre-wrap after:invisible after:px-3 after:py-2 after:overflow-hidden"
          @keyup="
            (e) => {
              if (e.key === 'Enter' && e.getModifierState('Control')) {
                sendChat()
                return
              }
            }
          "
        >
          <textarea
            v-model="userMessage"
            class="w-full max-h-[100px] rounded-md border border-blue-100 outline-blue-200 px-3 py-2 resize-none"
          ></textarea>
          <div>
            <span class="text-xs text-gray-400"
              >Press Ctrl + Enter to send.</span
            >&nbsp;
            <span v-if="isLoadingTokensLength" class="text-xs text-gray-400">
              Calculating tokens length...
            </span>
            <span class="text-xs text-gray-400"
              >Current tokens length: {{ userMessagesTokenLength }}</span
            >
          </div>
        </div>
        <c-button
          :disabled="isChatLoading"
          :is-loading="isChatLoading"
          @click="sendChat"
          >Send</c-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.grow-wrap::after {
  /* Note the weird space! Needed to preventy jumpy behavior */
  content: attr(data-replicated-value) ' ';
}

.grow-wrap > textarea,
.grow-wrap::after {
  /* Identical styling required!! */
  /* Place on top of each other */
  grid-area: 1 / 1 / 2 / 2;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
