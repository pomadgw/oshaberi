<script setup lang="ts">
import { type ChatCompletionResponseMessage } from 'openai'

import { type ChatMessages } from '../../lib/types/chat'
import CChatBubble from './CChatBubble.vue'

const props = defineProps<{
  messages: ChatMessages<ChatCompletionResponseMessage>
}>()

const emit =
  defineEmits<
    (
      e: 'updateMessage',
      value: ChatMessages<ChatCompletionResponseMessage>
    ) => void
  >()
</script>

<template>
  <div class="masked-overflow overflow-y-auto flex flex-col gap-3 p-6">
    <CChatBubble
      v-for="(message, index) in props.messages"
      :key="index"
      :message="message"
      @updateMessage="
        (message) => {
          const messageCopy = [...props.messages]
          message.value.content = message.message
          messageCopy[index] = message
          emit('updateMessage', messageCopy)
        }
      "
      @deleteMessage="
        () => {
          const messageCopy = [...props.messages]
          messageCopy.splice(index, 1)
          emit('updateMessage', messageCopy)
        }
      "
    />
  </div>
</template>

<style scoped>
/* fadeout effect overflow use codes from:
   https://pqina.nl/blog/fade-out-overflow-using-css-mask-image/
*/
.masked-overflow {
  /* scroll bar width, for use in mask calculations */
  --scrollbar-width: 8px;

  /* mask fade distance, for use in mask calculations */
  --mask-height: 32px;

  /* If content exceeds height of container, overflow! */
  overflow-y: auto;

  /* Need to make sure container has bottom space,
  otherwise content at the bottom is always faded out */
  padding-bottom: var(--mask-height);

  /* Keep some space between content and scrollbar */
  padding-right: 20px;

  /* The CSS mask */

  /* The content mask is a linear gradient from top to bottom */
  --mask-image-content: linear-gradient(
    to bottom,
    transparent,
    black var(--mask-height),
    black calc(100% - var(--mask-height)),
    transparent
  );

  /* Here we scale the content gradient to the width of the container
  minus the scrollbar width. The height is the full container height */
  --mask-size-content: calc(100% - var(--scrollbar-width)) 100%;

  /* The scrollbar mask is a black pixel */
  --mask-image-scrollbar: linear-gradient(black, black);

  /* The width of our black pixel is the width of the scrollbar.
  The height is the full container height */
  --mask-size-scrollbar: var(--scrollbar-width) 100%;

  /* Apply the mask image and mask size variables */
  mask-image: var(--mask-image-content), var(--mask-image-scrollbar);
  mask-size: var(--mask-size-content), var(--mask-size-scrollbar);

  /* Position the content gradient in the top left, and the
  scroll gradient in the top right */
  mask-position:
    0 0,
    100% 0;

  /* We don't repeat our mask images */
  mask-repeat: no-repeat, no-repeat;
}

/* Firefox */
.masked-overflow {
  scrollbar-width: thin; /* can also be normal, or none, to not render scrollbar */
  scrollbar-color: #808080 transparent; /* foreground background */
}

/* Webkit / Blink */
.masked-overflow::-webkit-scrollbar {
  width: var(--scrollbar-width);
}

.masked-overflow::-webkit-scrollbar-thumb {
  background-color: #808080;
  border-radius: 9999px; /* always round */
}

.masked-overflow::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
