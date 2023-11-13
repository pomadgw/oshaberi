<script setup lang="ts">
// emit click
defineProps<{
  disabled?: boolean
  isLoading?: boolean
}>()
const emit = defineEmits<(e: 'click') => void>()
</script>
<template>
  <button
    :disabled="disabled || isLoading"
    :class="{
      '!btn-disabled': disabled,
      '!cursor-wait': isLoading
    }"
    class="btn btn-primary"
    @click="emit('click')"
  >
    <span v-if="isLoading" class="loading loading-spinner"></span>
    <slot />
  </button>
</template>
