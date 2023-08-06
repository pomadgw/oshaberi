import { type Ref, inject, provide, ref } from 'vue'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useToast() {
  const isToastOpen = ref(false)
  const toastText = ref('')

  const openToast = (text: string): void => {
    toastText.value = text
    isToastOpen.value = true
  }

  const closeToast = (): void => {
    isToastOpen.value = false
  }

  provide('toast', {
    isToastOpen,
    toastText,
    closeToast
  })

  return {
    openToast,
    closeToast
  }
}

export function injectToast(): {
  isToastOpen: Ref<boolean>
  toastText: Ref<string>
  closeToast: () => void
} {
  const { isToastOpen, toastText, closeToast } = inject<{
    isToastOpen: Ref<boolean>
    toastText: Ref<string>
    closeToast: () => void
  }>('toast', {
    isToastOpen: ref(false),
    toastText: ref(''),
    closeToast: () => {}
  })

  return {
    isToastOpen,
    toastText,
    closeToast
  }
}
