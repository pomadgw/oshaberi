import { useMutation } from '@tanstack/vue-query'
import {
  type CreateChatCompletionResponse,
  type ErrorResponse,
  // type ChatCompletionResponseMessage,
  // type ChatCompletionRequestMessage,
  type CreateChatCompletionRequest,
  type ChatCompletionRequestMessage
} from 'openai'
import axios, { type AxiosResponse, type AxiosError } from 'axios'

import { useBasicAuth } from '../store'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function useLLM() {
  const url = '/api/chat'
  const callFuncUrl = '/api/chat/function'

  const basicAuth = useBasicAuth()

  async function doChat(
    data: CreateChatCompletionRequest
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    return await axios.post(url, data, {
      auth: {
        username: basicAuth.username,
        password: basicAuth.password
      }
    })
  }

  async function callFunc(data: CreateChatCompletionRequest): Promise<
    AxiosResponse<{
      result: CreateChatCompletionResponse
      functionMessage: ChatCompletionRequestMessage
    }>
  > {
    return await axios.post(callFuncUrl, data, {
      auth: {
        username: basicAuth.username,
        password: basicAuth.password
      }
    })
  }

  const chat = useMutation<
    AxiosResponse<CreateChatCompletionResponse>,
    AxiosError<ErrorResponse>,
    CreateChatCompletionRequest
  >(['chat'], doChat)

  const chatFunc = useMutation<
    AxiosResponse<{
      result: CreateChatCompletionResponse
      functionMessage: ChatCompletionRequestMessage
    }>,
    AxiosError<ErrorResponse>,
    CreateChatCompletionRequest
  >(['chat-func'], callFunc)

  return {
    chat,
    chatFunc
  }
}
