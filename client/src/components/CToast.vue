<script setup lang="ts">
import { watch } from 'vue'
import { injectToast } from '../hooks/useToast'

const { isToastOpen, toastText, closeToast } = injectToast()

watch(
  () => isToastOpen.value,
  (value) => {
    if (value) {
      setTimeout(() => {
        closeToast()
      }, 3000)
    }
  },
  {
    immediate: true
  }
)
</script>
<template>
  <Transition>
    <div v-if="isToastOpen" class="toast toast-center toast-top" role="alert">
      <div class="alert alert-info">
        <span>{{ toastText }}</span>

        <button
          type="button"
          class="btn btn-ghost btn-xs"
          aria-label="Close"
          @click="closeToast"
        >
          <span class="sr-only">Close</span>
          <svg
            class="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>
<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
