<script setup lang="ts">
// emit click
const props = defineProps<{
  disabled?: boolean
  isLoading?: boolean
}>()
const emit = defineEmits<(e: 'click') => void>()
</script>
<template>
  <button
    :disabled="props.disabled || props.isLoading"
    :class="{
      '!bg-blue-300': props.disabled,
      '!cursor-wait': props.isLoading
    }"
    class="bg-blue-500 text-white rounded-md py-3 px-6 max-h-16"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
