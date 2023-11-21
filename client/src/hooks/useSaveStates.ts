import { onMounted, onUnmounted, ref } from 'vue'
import axios, { type AxiosError } from 'axios'

import { useChatGPTSetting, useChatSession } from '../store'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useSaveStates() {
  const settingsStore = useChatGPTSetting()
  const messageStore = useChatSession()

  let unsubscribeSettings: () => void
  let unsubscribeSession: () => void

  const id = new URLSearchParams(window.location.search).get('id') ?? '1'

  const isFetched = ref(false)

  onMounted(async () => {
    await axios
      .get(`/api/states/settings/${id}`)
      .then((res) => {
        const { data } = res

        settingsStore.$state = data
      })
      .catch((err) => {
        console.error(err)
      })

    await axios
      .get(`/api/states/sessions/${id}`)
      .then((res) => {
        const { data } = res

        messageStore.$state = data
      })
      .catch((err) => {
        console.error(err)
        const error = err as AxiosError<any>
        if (error.response?.status === 404) {
          axios
            .post(`/api/states/sessions/${id}`, {
              state: messageStore.$state
            })
            .catch((err) => {
              console.error(err)
            })
        }
      })

    unsubscribeSession = messageStore.$onAction(({ after }) => {
      after(() => {
        axios
          .post(`/api/states/sessions/${id}`, {
            state: messageStore.$state
          })
          .catch((err) => {
            console.error(err)
          })
      })
    })

    isFetched.value = true
  })

  onUnmounted(() => {
    unsubscribeSettings()
    unsubscribeSession()
  })

  return { isFetched }
}
