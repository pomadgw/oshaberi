<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

import CChat from './components/Chat/CChat.vue'
import CChatInput from './components/Chat/CChatInput.vue'
import CToast from './components/CToast.vue'
import CSettings from './components/CSettings.vue'
import { useChatSession, useBasicAuth } from './store'
import clipboardEvent from './clipboard'
import useMessages from './hooks/useMessages'
import useChat from './hooks/useChat'
import useToast from './hooks/useToast'
import useSaveStates from './hooks/useSaveStates'

const { openToast } = useToast()

const messageStore = useChatSession()
const basicAuthStore = useBasicAuth()

const { isFetched, isErrorAuth } = useSaveStates()

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

const basicAuthDialog = ref<HTMLDialogElement>()

const openBasicAuthDialog = (): void => {
  basicAuthDialog.value?.showModal()
}

const closeBasicAuthDialog = (): void => {
  // reload page
  window.location.reload()
}

watch(
  [isErrorAuth, basicAuthDialog],
  async () => {
    if (isErrorAuth.value && basicAuthDialog.value !== null) {
      await nextTick(() => {
        openBasicAuthDialog()
      })
    }
  },
  {
    immediate: true
  }
)
</script>

<template>
  <CSettings v-model:open="dialogOpen" />
  <CToast class="z-50" />
  <div v-if="isFetched" class="flex flex-col max-w-[1200px] m-auto h-screen">
    <nav class="navbar bg-base-100 hidden md:flex">
      <div>
        <a class="btn btn-ghost normal-case text-xl">oShaberi</a>
      </div>
      <div class="text-md flex gap-2 flex-1">
        <button class="btn btn-ghost normal-case" @click="openHistory">
          <span>Session:</span>
          <span class="font-bold">{{ messageStore.selectedSession }}</span>
        </button>
      </div>
      <div class="navbar-end">
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
    </nav>
    <ul class="menu menu-horizontal bg-base-200 z-10 md:hidden">
      <li><span class="font-bold">oShaberi</span></li>
      <li>
        <a @click="openHistory"
          >Session:
          <span class="font-bold">{{ messageStore.selectedSession }}</span>
        </a>
      </li>

      <li>
        <details>
          <summary>Menu</summary>
          <ul>
            <li><a @click="openSettings">Settings</a></li>
            <li><a @click="openSystemMessage">System message</a></li>
            <li><a @click="clearChat">Clear chat</a></li>
          </ul>
        </details>
      </li>
      <!-- <li>
        <details>
          <summary>Parent item</summary>
          <ul class="menu">
            <li><a>Submenu 1</a></li>
            <li><a>Submenu 2</a></li>
            <li>
              <details open>
                <summary>Parent</summary>
                <ul>
                  <li><a>item 1</a></li>
                  <li><a>item 2</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </details>
      </li>
      <li><a>Item 3</a></li> -->
    </ul>
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
                messageStore.selectSession(newSession)
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

      <dialog ref="basicAuthDialog" class="z-50 modal modal-middle">
        <form
          method="dialog"
          class="flex flex-col gap-3 p-4 border rounded-md modal-box"
        >
          <div class="form-control w-full">
            <div class="label">
              <p class="label-text">Username</p>
            </div>
            <input
              v-model="basicAuthStore.username"
              type="text"
              class="input input-bordered"
            />
          </div>
          <div class="form-control w-full">
            <div class="label">
              <p class="label-text">Password</p>
            </div>
            <input
              v-model="basicAuthStore.password"
              type="password"
              class="input input-bordered"
            />
          </div>

          <button class="btn btn-primary" @click="closeBasicAuthDialog">
            Save and Reload
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
