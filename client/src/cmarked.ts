import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

marked.use(gfmHeadingId())
marked.use({
  renderer: {
    blockquote(quote) {
      return `<blockquote class="border-l-4 border-blue-400 pl-4 text-gray-600">${quote}</blockquote>`
    },
    list(body, ordered, start) {
      console.log(body, ordered, start)

      if (ordered) {
        return `<ol class="list-decimal ml-4" start="${start}">${body}</ol>`
      } else {
        return `<ul class="list-disc ml-4">${body}</ul>`
      }
    },
    table(header, body) {
      return `
<div class="rounded-md bg-blue-400 pt-1">
  <table class="table-auto w-full border-collapse">
    <thead>
      ${header}
    </thead>
    <tbody class="bg-white border border-blue-300">
      ${body}
    </tbody>
  </table>
</div>`
    },
    tablecell(content, flags) {
      const createAlignClass = (
        alignType: 'center' | 'left' | 'right' | null
      ): string => {
        if (alignType === 'center') {
          return 'text-center'
        }

        if (alignType === 'right') {
          return 'text-right'
        }

        if (alignType === 'left') return 'text-left'

        return 'text-left'
      }

      if (flags.header) {
        return `<th class="bg-blue-400 text-white border-b border-blue-200 py-2 px-4 ${createAlignClass(
          flags.align
        )}">${content}</th>`
      }

      return `<td class="border-b border-gray-300 py-2 px-4 ${createAlignClass(
        flags.align
      )}">${content}</td>`
    },
    code(code, lang = 'plaintext'): string {
      // we want to put the code into an HTML attribute.
      // we need to escape the code first.
      const copiedCode = code.replace(/"/g, '&quot;')

      const language = hljs.getLanguage(lang) != null ? lang : 'plaintext'
      return `
<div class="code-highlight">
  <p class="code-highlight__lang">Language: ${language}</p>
    <pre class="overflow-auto w-full">${
      hljs.highlight(code, { language }).value
    }</pre>
  <div class="code-highlight__footer">
    <div class="code-highlight__footer-inner flex-1">
      <p class="code-highlight__disclaimer">Use the code with caution.</p>
    </div>
    <button class="js-copy-btn code-highlight__copy-btn" data-clipboard-text="${copiedCode}">
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
