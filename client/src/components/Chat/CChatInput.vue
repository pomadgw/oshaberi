<script setup lang="ts">
import { ref } from 'vue'
import CButton from '../CButton.vue'

const props = defineProps({
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
  (e: 'sendMessage', value: string): void
  (e: 'type', value: string): void
}>()

const userMessage = ref('')

const sendMessage = (): void => {
  emit('sendMessage', userMessage.value)
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
        @keyup="() => emit('type', userMessage)"
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
    <c-button
      :disabled="props.isSending"
      :is-loading="props.isSending"
      @click="sendMessage"
      >Send</c-button
    >
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
