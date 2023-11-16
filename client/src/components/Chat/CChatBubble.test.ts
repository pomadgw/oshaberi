import { it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import matchers from '@testing-library/jest-dom/matchers'

import emitter from '../../clipboard'
import Component from './CChatBubble.vue'

expect.extend(matchers)

const ClipboardMock = vi.fn(() => ({
  read: vi.fn().mockResolvedValue('Test'),
  readText: vi.fn().mockResolvedValue('Test'),
  write: vi.fn().mockResolvedValue('Test'),
  writeText: vi.fn().mockResolvedValue('Test')
}))

afterEach(() => {
  vi.restoreAllMocks()
})

it('should copy the text content', async () => {
  vi.stubGlobal('navigator.clipboard', ClipboardMock)

  const spy = vi.spyOn(emitter, 'emit')
  render(Component, {
    attrs: {
      message: {
        user: 'user',
        message: 'Hello'
      }
    }
  })

  const button = screen.getByText('Copy')

  const user = userEvent.setup()

  await user.click(button)

  expect(spy).toHaveBeenCalledWith(
    'success',
    expect.objectContaining({
      text: 'Hello'
    })
  )
})
