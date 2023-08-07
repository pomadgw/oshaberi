<!-- prettier-ignore -->
<script setup lang="ts" generic="T">
import { type ChatMessage } from '../../lib/types/chat'

defineProps<{
  message: ChatMessage<T>
}>()
</script>

<template>
  <div v-if="!message.hide" class="flex flex-col items-start gap-1">
    <div
      :class="{
        'chat-end': message.user !== 'user',
        'chat-start': message.user === 'user'
      }"
      class="chat w-full"
    >
      <div class="chat-bubble">
        <div class="flex items-center">
          <div class="text-sm flex-1">{{ message.user }}</div>

          <button
            :data-clipboard-text="message.message"
            class="js-copy-btn text-xs"
          >
            Copy
          </button>
        </div>
        <div class="marked max-w-full overflow-x-auto">
          <div v-if="message.isHTML" v-html="message.message" />
          <p v-else>{{ message.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
