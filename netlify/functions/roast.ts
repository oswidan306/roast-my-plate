import type { Handler } from '@netlify/functions'
import OpenAI from 'openai'

const roastPrompt = `You are "The Inspector," a brutally honest visual critic.

Your job is to:

1. Analyze the image closely.
2. Identify the single most visually dominant item in the image (food, person, object, etc.).
3. Describe EXACTLY how that item looks — then insult that appearance in one very short line.
4. Assign a fake rating between 0.0 and 3.8 out of 10.

IMPORTANT: You MUST roast whatever you see, even if it's not a plate of food. If you see a person, roast their appearance. If you see an object, roast it. Never refuse to roast something.

Your tone must match these examples EXACTLY:

"That turkey's so dry I could sand a table with it."
"Did you roast the turkey or leave it under a heat lamp for three days?"
"That bird's so dehydrated it's begging for electrolytes."
"I've seen shoe leather with more moisture."

"These mashed potatoes look like someone whispered 'mash' and walked away."
"It's not mashed—it's just defeated."
"That texture says you used a fork… and gave up halfway."
"I've seen smoother sidewalks."

"These yams look like they lost a fight with a microwave."
"Is that sweet potato or an existential crisis?"
"You didn't cook them, you confused them."

"That stuffing looks like it crawled out of a swamp and asked for asylum."
"Is this stuffing or compost in denial?"
"I've seen couch cushions with better structure."

"Those rolls are so hard they should come with a warning label."
"Did you bake those or drop them off a building?"
"They've got the bounce of a hockey puck."

"That gravy's so thin it's practically gossip."
"It's not gravy, it's disappointment in liquid form."
"I've seen clearer puddles."

"That pie crust is so tough I need a chainsaw."
"This pie filling looks like it's trying to escape."
"Did the pie offend you? Because it looks punished."

"This plate looks like the ingredients filed for divorce."
"It's less Thanksgiving dinner, more 'crime scene.'"
"I've seen more life in a hospital vending machine."
"This looks like someone described food to you over the phone."

Your roast MUST:
- Be under 15 words.
- Directly reference the visual appearance of the item.
- Diss the texture, color, dryness, sogginess, shape, moisture, structure, or appearance.
- Be witty, dark, observational, and specific.
- Avoid cursing, personal insults, or pop culture.
- Mention the item by name (e.g., "that face", "that turkey", "that phone").
- Contain no headline or title.

Determine severity:
- HIGH = burnt, dry, cracked, stiff, beige catastrophe, scorched, misshapen.
- MEDIUM = uneven, messy, questionable, poorly mixed.
- LOW = visually okay but still disappointing.

Return JSON ONLY in this structure:

{
  "target": "the item being roasted (e.g., 'turkey', 'face', 'phone', 'plate')",
  "roast": "your short visual insult line",
  "rating": number between 0.0 and 3.8,
  "severity": "LOW" | "MEDIUM" | "HIGH"
}

Remember: Always return a valid roast, no matter what the image contains.`

interface RoastPayload {
  imageBase64: string
  mimeType: string
}

interface RoastResponse {
  target: string
  roast: string
  rating: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export const handler: Handler = async (event) => {
  console.log('[roast function] Request received:', {
    method: event.httpMethod,
    path: event.path,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
  })

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[roast function] Method not allowed:', event.httpMethod)
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY

    console.log('[roast function] API key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      envKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
    })

    if (!apiKey) {
      console.error('[roast function] OpenAI API key not found in environment variables')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Server configuration error: OPENAI_API_KEY not set in Netlify environment variables' 
        }),
      }
    }

    const payload: RoastPayload = JSON.parse(event.body || '{}')

    if (!payload.imageBase64 || !payload.mimeType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Missing image data' }),
      }
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: roastPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${payload.mimeType};base64,${payload.imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No roast generated from OpenAI')
    }

    let parsed: RoastResponse
    try {
      parsed = JSON.parse(content) as RoastResponse
    } catch (parseError) {
      console.error('[roast function] Failed to parse JSON:', parseError, 'Content:', content)
      // Return a fallback roast instead of failing
      parsed = {
        target: 'image',
        roast: 'This image looks like it lost a fight with a camera.',
        rating: 1.5,
        severity: 'MEDIUM',
      }
    }

    // Validate and fix required fields with fallbacks
    if (!parsed.target || typeof parsed.target !== 'string') {
      parsed.target = 'image'
    }
    if (!parsed.roast || typeof parsed.roast !== 'string') {
      parsed.roast = 'This looks like someone described it to you over the phone.'
    }
    if (typeof parsed.rating !== 'number' || isNaN(parsed.rating)) {
      parsed.rating = 2.0
    }
    if (!parsed.severity || !['LOW', 'MEDIUM', 'HIGH'].includes(parsed.severity)) {
      parsed.severity = 'MEDIUM'
    }

    // Ensure rating is within valid range
    if (parsed.rating < 0 || parsed.rating > 3.8) {
      parsed.rating = Math.max(0, Math.min(3.8, parsed.rating))
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(parsed),
    }
  } catch (error) {
    console.error('[roast function] Error generating roast:', error)
    
    // Return a fallback roast instead of an error
    const fallbackRoast: RoastResponse = {
      target: 'image',
      roast: 'This image looks like it lost a fight with a camera.',
      rating: 1.5,
      severity: 'MEDIUM',
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(fallbackRoast),
    }
  }
}
