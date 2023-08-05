import { useMutation } from '@tanstack/vue-query'
import {
  type CreateChatCompletionResponse,
  // type ChatCompletionResponseMessage,
  // type ChatCompletionRequestMessage,
  type CreateChatCompletionRequest
} from 'openai'
import axios, { type AxiosResponse, type AxiosError } from 'axios'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useLLM() {
  const url = '/api/chat'
  const callFuncUrl = '/api/chat/function'

  async function doChat(
    data: CreateChatCompletionRequest
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    return await axios.post(url, data)
  }

  async function callFunc(
    data: CreateChatCompletionRequest
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    return await axios.post(callFuncUrl, data)
  }

  const chat = useMutation<
    AxiosResponse<CreateChatCompletionResponse>,
    AxiosError<any>,
    CreateChatCompletionRequest
  >(['chat'], doChat)

  const chatFunc = useMutation<
    AxiosResponse<CreateChatCompletionResponse>,
    AxiosError<any>,
    CreateChatCompletionRequest
  >(['chat-func'], callFunc)

  return {
    chat,
    chatFunc
  }
}
