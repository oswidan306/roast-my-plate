import { roastPrompt, defaultModel } from './prompt'

export interface RoastResponse {
  roast: string
}

export interface RoastPayload {
  imageBase64: string
}

/**
 * Placeholder request helper for OpenAI. The real implementation will inject the
 * API key from server-side environment variables and call /v1/responses with
 * vision inputs.
 */
export async function requestRoast(_payload: RoastPayload): Promise<RoastResponse> {
  console.info('[roast] Calling OpenAI with model', defaultModel)
  console.info('[roast] Prompt:', roastPrompt)

  // TODO: Implement real API call.
  return Promise.resolve({
    roast:
      'Placeholder roast from the chef: This plate looks like the leftovers got into a bar fight and lost.',
  })
}

