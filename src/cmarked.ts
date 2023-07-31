import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

marked.use(gfmHeadingId())
marked.use({
  renderer: {
    code(code, lang = 'plaintext'): string {
      // we want to put the code into an HTML attribute.
      // we need to escape the code first.
      const copiedCode = code.replace(/"/g, '\\"')

      const language = hljs.getLanguage(lang) != null ? lang : 'plaintext'
      return `
<div class="code-highlight">
  <p class="text-sm text-gray-600 border-b pb-3 px-3 -mx-3">Language: ${language}</p>
    <pre class="overflow-auto w-full">${
      hljs.highlight(code, { language }).value
    }</pre>
  <div class="flex gap-2 items-center border-t pt-3 px-3 -mx-3">
    <div class="flex-1">
      <p class="text-sm text-gray-600">Use the code with caution.</p>
    </div>
    <button class="js-copy-btn text-sm" data-clipboard-text="${copiedCode}">
      Copy
    </button>
  </div>
</div>
      `
    }
  },
  hooks: {
    postprocess(html) {
      return DOMPurify.sanitize(html)
    }
  }
})
