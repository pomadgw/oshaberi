<!-- prettier-ignore -->
<script setup lang="ts" generic="T">
import { marked } from 'marked'
import { type ChatMessage } from '../../lib/types/chat'
import { computed, ref } from 'vue';

const props =defineProps<{
  message: ChatMessage<T>
}>()

const emit = defineEmits<(e: 'updateMessage', value: ChatMessage<T>) => void>()

const messageValue = computed({
  get: () => props.message.message,
  set: (value) => {
    emit('updateMessage', {
      ...props.message,
      message: value,
    })
  }
})

const editMode = ref(false)
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
        <div class="flex items-center gap-3">
          <div class="text-sm flex-1">{{ message.user }}</div>

          <button @click="editMode = !editMode" class="text-xs">Edit</button>

          <button
            :data-clipboard-text="message.message"
            class="js-copy-btn text-xs"
          >
            Copy
          </button>
        </div>
        <div class="marked max-w-full overflow-x-auto">
          <template v-if="editMode">
            <textarea
              v-model="messageValue"
              class="textarea textarea-bordered w-full"
            ></textarea>
          </template>
          <template v-else>
            <div v-if="message.isHTML" v-html="marked.parse(message.message)" />
            <p v-else>{{ message.message }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
