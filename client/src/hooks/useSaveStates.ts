import { onMounted, onUnmounted, ref } from 'vue'
import axios, { type AxiosError } from 'axios'

import { useBasicAuth, useChatGPTSetting, useChatSession } from '../store'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useSaveStates() {
  const settingsStore = useChatGPTSetting()
  const messageStore = useChatSession()
  const basicAuth = useBasicAuth()

  let unsubscribeSettings: () => void
  let unsubscribeSession: () => void

  const id = new URLSearchParams(window.location.search).get('id') ?? '1'

  const isFetched = ref(false)
  const isErrorAuth = ref(false)

  onMounted(async () => {
    await Promise.all([
      axios
        .get(`/api/states/settings/${id}`, {
          auth: {
            username: basicAuth.username,
            password: basicAuth.password
          }
        })
        .then((res) => {
          const { data } = res

          settingsStore.$state = data
        })
        .catch((err) => {
          const error = err as AxiosError<any>
          console.error(err)

          if (error.response?.status === 401) {
            isErrorAuth.value = true
          }
        }),

      axios
        .get(`/api/states/sessions/${id}`, {
          auth: {
            username: basicAuth.username,
            password: basicAuth.password
          }
        })
        .then((res) => {
          const { data } = res

          messageStore.$state = data
        })
        .catch((err) => {
          const error = err as AxiosError<any>
          console.error(err)

          if (error.response?.status === 401) {
            isErrorAuth.value = true
          }
        })
    ])

    unsubscribeSettings = settingsStore.$onAction(({ after }) => {
      after(() => {
        axios
          .post(
            `/api/states/settings/${id}`,
            {
              state: settingsStore.$state
            },
            {
              auth: {
                username: basicAuth.username,
                password: basicAuth.password
              }
            }
          )
          .catch((err) => {
            console.error(err)
          })
      })
    })

    unsubscribeSession = messageStore.$onAction(({ after }) => {
      after(() => {
        axios
          .post(
            `/api/states/sessions/${id}`,
            {
              state: messageStore.$state
            },
            {
              auth: {
                username: basicAuth.username,
                password: basicAuth.password
              }
            }
          )
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

  return { isFetched, isErrorAuth }
}
