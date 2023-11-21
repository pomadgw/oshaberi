<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

import CChat from './components/Chat/CChat.vue'
import CChatInput from './components/Chat/CChatInput.vue'
import CToast from './components/CToast.vue'
import CSettings from './components/CSettings.vue'
import { useChatSession } from './store'
import clipboardEvent from './clipboard'
import useMessages from './hooks/useMessages'
import useChat from './hooks/useChat'
import useToast from './hooks/useToast'
import useSaveStates from './hooks/useSaveStates'

const { openToast } = useToast()

const messageStore = useChatSession()

const { isFetched } = useSaveStates()

const { messages, clearChat, currentMessage, currentMessageTokenLength } =
  useMessages()

const newSession = ref('')

const { cchatRef, sendMessage, isSendingChat, resend, appendToMessages } =
  useChat()

watch(
  messages,
  async () => {
    if (cchatRef.value != null) {
      await nextTick(() => {
        const element = cchatRef.value.$el as HTMLElement

        element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
      })
    }
  },
  {
    immediate: true
  }
)

const onSuccessCopy = (): void => {
  openToast('Copied!')
}

clipboardEvent.on('success', onSuccessCopy)

const insertMessageMode = ref(false)

const dialogOpen = ref(false)
const openSettings = (): void => {
  dialogOpen.value = true
}

const historyDialog = ref<HTMLDialogElement>()

const openHistory = (): void => {
  historyDialog.value?.showModal()
}

const closeHistory = (): void => {
  historyDialog.value?.close()
}

const systemMessageDialog = ref<HTMLDialogElement>()

const openSystemMessage = (): void => {
  systemMessageDialog.value?.showModal()
}

const closeSystemMessage = (): void => {
  systemMessageDialog.value?.close()
}
</script>

<template>
  <CSettings v-model:open="dialogOpen" />
  <CToast class="z-50" />
  <div v-if="isFetched" class="flex flex-col max-w-[1200px] m-auto h-screen">
    <div class="navbar bg-base-100">
      <div>
        <a class="btn btn-ghost normal-case text-xl">oShaberi</a>
      </div>
      <div class="text-md flex gap-2 flex-1">
        <span>Session:</span>
        <span class="font-bold">{{ messageStore.selectedSession }}</span>
      </div>
      <div class="navbar-end">
        <button class="btn btn-ghost normal-case" @click="openHistory">
          History
        </button>
        <button class="btn btn-ghost normal-case" @click="openSettings">
          Settings
        </button>
        <button class="btn btn-ghost normal-case" @click="openSystemMessage">
          System message
        </button>
        <button class="btn btn-ghost normal-case" @click="clearChat">
          Clear chat
        </button>
      </div>
    </div>
    <div class="flex flex-1 w-full gap-5 p-4 md:p-8">
      <dialog ref="historyDialog" class="z-50 modal modal-middle">
        <form
          method="dialog"
          class="flex flex-col gap-3 p-4 border rounded-md modal-box"
        >
          <div class="ml-4 text-sm font-bold">Chat history</div>
          <div
            class="overflow-y-auto"
            style="height: calc(100vh - 48px - 124px - 64px - 64px - 18px)"
          >
            <div
              v-for="key in messageStore.getSessions"
              :key="key"
              class="flex gap-2"
            >
              <button
                class="text-left hover:bg-purple-300 dark:hover:bg-purple-800 p-4 w-full rounded-lg"
                :class="{
                  'bg-purple-300 dark:bg-purple-800':
                    messageStore.selectedSession === key
                }"
                @click="messageStore.selectSession(key)"
              >
                {{ key }}
              </button>
              <button
                v-if="
                  messageStore.getSessions.length > 1 &&
                  messageStore.selectedSession !== key
                "
                @click="messageStore.removeSession(key)"
              >
                &times;
              </button>
              <div v-else class="invisible">x</div>
            </div>
          </div>
          <input v-model="newSession" class="input input-bordered" />
          <button
            class="btn btn-primary"
            @click="
              () => {
                messageStore.addNewSession(newSession)
                newSession = ''
              }
            "
          >
            Add
          </button>
          <button class="btn" @click="closeHistory">Close</button>
        </form>
      </dialog>
      <dialog ref="systemMessageDialog" class="z-50 modal modal-middle">
        <form
          method="dialog"
          class="flex flex-col gap-3 p-4 border rounded-md modal-box"
        >
          <div class="form-control w-full">
            <div class="label">
              <p class="label-text">System</p>
              <p class="label-text-alt">Use this to direct the dialogs</p>
            </div>
            <textarea
              class="w-full min-h-[200px] textarea textarea-bordered"
              :value="messageStore.getCurrentSystemMessage"
              @keyup="
                (e) => {
                  if (e.target != null) {
                    messageStore.setCurrentSystemMessage(
                      (e.target as HTMLTextAreaElement).value
                    )
                  }
                }
              "
            ></textarea>
          </div>

          <button class="btn btn-primary" @click="closeSystemMessage">
            Close
          </button>
        </form>
      </dialog>
      <div class="flex flex-col h-full w-full">
        <div class="flex-1">
          <CChat
            ref="cchatRef"
            :messages="messages"
            style="max-height: calc(100vh - 48px - 124px - 64px - 64px)"
            @updateMessage="messages = $event"
          />
        </div>

        <button class="btn" @click="resend">Resend Last Messages</button>

        <CChatInput
          :insertMessageMode="insertMessageMode"
          :token-count="currentMessageTokenLength"
          :is-sending="isSendingChat"
          class="mt-3"
          @send-message="sendMessage"
          @type="currentMessage = $event"
          @edit="insertMessageMode = true"
          @append="
            (message) => {
              appendToMessages(message.role, message.message)
              insertMessageMode = false
            }
          "
        />
      </div>
    </div>
  </div>
</template>
