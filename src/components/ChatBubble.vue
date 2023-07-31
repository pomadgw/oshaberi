<script setup lang="ts">
import { type ChatCompletionResponseMessage } from 'openai'

import { marked } from 'marked'

const props = defineProps<{
  chat: ChatCompletionResponseMessage
}>()
</script>
<template>
  <div class="flex flex-col items-start gap-1">
    <div
      :class="{ 'self-end': props.chat.role === 'assistant' }"
      class="flex items-center gap-2"
    >
      <div class="text-sm text-gray-600 flex-1">
        {{ props.chat.role }}
      </div>
      <button
        :data-clipboard-text="props.chat.content ?? ''"
        class="js-copy-btn text-xs text-blue-400"
      >
        Copy this content
      </button>
    </div>
    <div
      :class="{
        'self-end': props.chat.role === 'assistant',
        'border-blue-300': props.chat.role === 'user',
        'border-yellow-300': props.chat.role === 'assistant'
      }"
      class="border-2 rounded-md p-4 marked max-w-full overflow-x-auto"
      v-html="marked.parse(props.chat.content ?? '')"
    ></div>
  </div>
</template>
