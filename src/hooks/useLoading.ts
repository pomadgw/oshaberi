import { type Ref, ref } from 'vue'

// create a type for the function that recevie any number of arguments and return a promise of T
type PromiseFunction<T> = (...args: any[]) => Promise<T>

export default function useLoading<F extends PromiseFunction<any>>(
  callback: F
): {
  isLoading: Ref<boolean>
  call: (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>
} {
  const isLoading = ref(false)

  const call = async (
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>> => {
    try {
      isLoading.value = true
      // eslint-disable-next-line n/no-callback-literal
      return await callback(...args)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    call
  }
}
