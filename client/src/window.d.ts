declare global {
  interface Window {
    copyToClipboard: (text: string) => Promise<void>
  }
}
