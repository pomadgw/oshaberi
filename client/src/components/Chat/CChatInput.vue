<script setup lang="ts">
import { computed, ref } from 'vue'
import { type ChatCompletionRequestMessageRoleEnum } from 'openai'

import CButton from '../CButton.vue'
import { useChatGPTSetting } from '../../store'

const props = defineProps({
  insertMessageMode: {
    type: Boolean,
    default: false
  },
  isSending: {
    type: Boolean,
    default: false
  },
  tokenCount: {
    type: Number,
    default: () => 0
  }
})

const emit = defineEmits<{
  (
    e: 'sendMessage',
    value: { message: string; role: ChatCompletionRequestMessageRoleEnum }
  ): void
  (
    e: 'type',
    value: { message: string; role: ChatCompletionRequestMessageRoleEnum }
  ): void
  (
    e: 'append',
    value: { message: string; role: ChatCompletionRequestMessageRoleEnum }
  ): void
  (e: 'edit'): void
}>()

const userMessage = ref('')
const role = ref<ChatCompletionRequestMessageRoleEnum>('user')

const message = computed(() => ({
  message: userMessage.value,
  role: role.value
}))

const store = useChatGPTSetting()
const isExceedingMaxSupportedTokens = computed(
  () => props.tokenCount >= store.maxSupportedTokens
)

const append = (): void => {
  emit('append', message.value)
  userMessage.value = ''
}

const sendMessage = (): void => {
  emit('sendMessage', {
    ...message.value,
    role: 'user'
  })
  userMessage.value = ''
}
</script>
<template>
  <div class="flex gap-4">
    <div
      :data-replicated-value="userMessage"
      class="flex-1 grid grow-wrap after:max-h-[100px] after:border-blue-100 after:whitespace-pre-wrap after:invisible after:px-3 after:py-2 after:overflow-hidden"
      @keydown="
        (e) => {
          if (e.key === 'Enter' && !e.getModifierState('Shift')) {
            e.preventDefault()
            sendMessage()
            return
          }
        }
      "
    >
      <textarea
        v-model="userMessage"
        class="w-full max-h-[100px] textarea textarea-bordered"
        @keyup="() => emit('type', message)"
      ></textarea>
      <div>
        <span class="text-xs text-gray-400 hidden md:inline-block"
          >Press Enter to send. Press Shift+Enter to add newline.</span
        >&nbsp;
        <span class="text-xs text-gray-400"
          >Current tokens length: {{ tokenCount }}</span
        >
      </div>
    </div>
    <div v-if="insertMessageMode" class="flex flex-col gap-3">
      <!-- role dropdown -->
      <select v-model="role" class="select select-bordered">
        <option value="user">user</option>
        <option value="assistant">assistant</option>
      </select>
      <c-button @click="append">Save</c-button>
    </div>
    <div v-else class="flex flex-col gap-3">
      <c-button
        :disabled="props.isSending || isExceedingMaxSupportedTokens"
        :is-loading="props.isSending"
        @click="sendMessage"
        >Send</c-button
      >
      <c-button @click="emit('edit')">Edit</c-button>
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
</style>
