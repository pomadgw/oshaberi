<script setup lang="ts">
import { type ChatCompletionResponseMessage } from 'openai'

import { marked } from 'marked'

import useSpeech from '../hooks/useSpeech'
import { ref, watch } from 'vue'

const props = defineProps<{
  chat: ChatCompletionResponseMessage & { lang: string }
}>()

const { voices, speak } = useSpeech()

const selectedLanguage = ref(props.chat.lang)
const selectedVoice = ref<SpeechSynthesisVoice | null>(null)

watch(
  () => props.chat.lang,
  (lang) => {
    selectedLanguage.value = lang
  }
)

watch(
  () => selectedLanguage.value,
  (lang) => {
    selectedVoice.value =
      voices.value.find((v) => v.lang.split('-')[0] === lang) ?? null
  }
)

const doSpeak = (): void => {
  if (selectedVoice.value != null) {
    speak(props.chat.content ?? '', selectedVoice.value)
  }
}
</script>
<template>
  <div class="flex flex-col items-start gap-1">
    <div
      :class="{ 'self-end': props.chat.role === 'assistant' }"
      class="flex items-center gap-2"
    >
      <div class="text-sm text-gray-600 flex-1">
        {{ props.chat.role }}
      </div>
      <button
        :data-clipboard-text="props.chat.content ?? ''"
        class="js-copy-btn text-xs text-blue-400"
      >
        Copy this content
      </button>
      {{ selectedLanguage ?? 'unk' }}
      <select
        v-model="selectedVoice"
        class="bg-white border border-blue-300 text-blue-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
      >
        <option v-for="model in voices" :key="model.name" :value="model">
          [{{ model.lang }}] {{ model.name }}
        </option>
      </select>
      <button class="text-xs text-blue-400" @click="doSpeak">Speak</button>
    </div>
    <div
      :class="{
        'self-end': props.chat.role === 'assistant',
        'border-blue-300': props.chat.role === 'user',
        'border-yellow-300': props.chat.role === 'assistant'
      }"
      class="border-2 rounded-md p-4 marked max-w-full overflow-x-auto"
      v-html="marked.parse(props.chat.content ?? '')"
    ></div>
  </div>
</template>
