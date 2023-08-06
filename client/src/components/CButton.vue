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
      '!btn-disabled': props.disabled,
      '!cursor-wait': props.isLoading
    }"
    class="btn btn-primary"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
