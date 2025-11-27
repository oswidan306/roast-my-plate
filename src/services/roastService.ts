/**
 * Compresses and downscales an image file
 * Scales the image so its longest side is no more than 1000px
 * Converts to JPEG at quality 0.7
 */
export async function compressImage(file: File): Promise<File> {
  const bmp = await createImageBitmap(file)
  const canvas = document.createElement('canvas')

  const MAX = 1000
  const scale = Math.min(MAX / bmp.width, MAX / bmp.height, 1)

  canvas.width = bmp.width * scale
  canvas.height = bmp.height * scale

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)

  return await new Promise(resolve => {
    canvas.toBlob(
      blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
      'image/jpeg',
      0.7
    )
  })
}

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export interface RoastResponse {
  target: string
  roast: string
  rating: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Generates a roast for a plate image using Netlify function
 */
export async function generateRoast(file: File): Promise<RoastResponse> {
  try {
    // Bypass API call for localhost testing
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (isLocalhost) {
      console.log('[roast] Localhost detected - bypassing API call with mock response')
      
      // Return mock response after a short delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResponse: RoastResponse = {
        target: 'turkey',
        roast: 'This turkey died twice.',
        rating: 1.8,
        severity: 'HIGH',
      }
      
      console.log('[roast] Mock response:', mockResponse)
      return mockResponse
    }

    // Compress and downscale image before converting to base64
    const compressedFile = await compressImage(file)
    const imageBase64 = await fileToBase64(compressedFile)
    const mimeType = 'image/jpeg' // Always JPEG after compression

    // Determine the function URL - use full URL in production, relative in dev
    const functionUrl = import.meta.env.PROD
      ? `${window.location.origin}/.netlify/functions/roast`
      : '/.netlify/functions/roast'

    console.log('[roast] Calling Netlify function:', functionUrl)
    console.log('[roast] Image size:', imageBase64.length, 'bytes (base64)')

    // Call Netlify function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
      }),
    })

    console.log('[roast] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[roast] Error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || `HTTP error! status: ${response.status}` }
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: RoastResponse = await response.json()
    console.log('[roast] Success! Received:', data)
    
    return data
  } catch (error) {
    console.error('[roast] Error generating roast:', error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to generate roast. Please try again.')
  }
}

