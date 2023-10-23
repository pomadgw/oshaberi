<!-- prettier-ignore -->
<script setup lang="ts" generic="T">
import { marked } from 'marked'
import { type ChatMessage } from '../../lib/types/chat'
import { ref } from 'vue';

const props =defineProps<{
  message: ChatMessage<T>
}>()

const emit = defineEmits<{
  (e: 'updateMessage', value: ChatMessage<T>): void
  (e: 'deleteMessage'): void
}>()

// eslint-disable-next-line vue/no-setup-props-destructure
const messageValue = ref(props.message.message)
const editMode = ref(false)

const save = (): void => {
  emit('updateMessage', {
    ...props.message,
    message: messageValue.value,
  })

  editMode.value = false
}

const cancel = (): void => {
  messageValue.value = props.message.message
  editMode.value = false
}

const deleteMessage = (): void => {
  if (confirm('Are you sure you want to delete this message?')) {
    emit('deleteMessage')
  }
}
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
      <div :class="editMode ? 'w-full' : ''" class="chat-bubble">
        <div class="flex items-center gap-3">
          <div class="text-sm flex-1">{{ message.user }}</div>

          <button v-if="!editMode" @click="editMode = true" class="text-xs">
            Edit
          </button>

          <button v-if="!editMode" @click="deleteMessage" class="text-xs">
            Delete
          </button>

          <button
            :data-clipboard-text="message.message"
            class="js-copy-btn text-xs"
          >
            Copy
          </button>
        </div>
        <div class="marked max-w-full overflow-x-auto">
          <div v-if="editMode" class="flex flex-col gap-2">
            <textarea
              v-model="messageValue"
              class="textarea textarea-bordered w-full h-[200px]"
            ></textarea>
            <div class="flex gap-3 justify-end">
              <button class="btn btn-primary" @click="save">Save</button>
              <button class="btn btn-secondary" @click="cancel">Cancel</button>
            </div>
          </div>
          <template v-else>
            <div v-if="message.isHTML" v-html="marked.parse(message.message)" />
            <p v-else>{{ message.message }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
