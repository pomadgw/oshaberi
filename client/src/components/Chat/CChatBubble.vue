<!-- prettier-ignore -->
<script setup lang="ts" generic="T">
import { type ChatMessage } from 'client/src/lib/types/chat'

defineProps<{
  message: ChatMessage<T>
}>()
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <div
      :class="{
        'self-end bg-blue-100': message.user !== 'user',
        'bg-yellow-100': message.user === 'user'
      }"
      class="flex flex-col gap-2 border p-3 rounded-md"
    >
      <div class="text-sm text-gray-700">
        {{ message.user }}

        <button :data-clipboard-text="message.message" class="js-copy-btn">
          Copy
        </button>
      </div>
      <div class="marked max-w-sm md:max-w-xl overflow-x-auto">
        <div v-if="message.isHTML" v-html="message.message" />
        <p v-else>{{ message.message }}</p>
      </div>
    </div>
  </div>
</template>
