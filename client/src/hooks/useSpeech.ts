import { type Ref, ref } from 'vue'

interface useSpeachReturn {
  voices: Ref<SpeechSynthesisVoice[]>
  speak: (text: string, selectedVoice: SpeechSynthesisVoice) => void
}

const voices = ref<SpeechSynthesisVoice[]>([])

// cancel any current speech when the page is closed
window.addEventListener(
  'beforeunload',
  () => {
    if (typeof speechSynthesis === 'undefined') return

    const synth = window.speechSynthesis
    synth.cancel()
  },
  { once: true }
)

export default function useSpeech(): useSpeachReturn {
  function populateVoiceList(): SpeechSynthesisVoice[] {
    if (typeof speechSynthesis === 'undefined') {
      return []
    }

    return speechSynthesis.getVoices()
  }

  if (typeof speechSynthesis !== 'undefined') {
    const synth = window.speechSynthesis

    synth.addEventListener('voiceschanged', () => {
      const res = populateVoiceList()
      res.sort((a, b) => {
        const aname = `${a.lang} ${a.name}`.toUpperCase()
        const bname = `${b.lang} ${b.name}`.toUpperCase()
        if (aname < bname) return -1
        else if (aname === bname) return 0
        else return +1
      })

      voices.value = res
    })
  }

  function speak(text: string, selectedVoice: SpeechSynthesisVoice): void {
    if (typeof speechSynthesis === 'undefined') return

    const synth = window.speechSynthesis
    synth.cancel()

    const utterThis = new SpeechSynthesisUtterance(text)
    utterThis.voice = selectedVoice

    synth.speak(utterThis)
  }

  return {
    voices,
    speak
  }
}
