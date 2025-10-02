import { NextRequest, NextResponse } from 'next/server'
import '@/polyfills/node-fetch'
import { Client } from '@google/genai'
import { validateSchema, fixSchemaIssues, createDefaultSchema } from '@/lib/uiSchema'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, style = 'modern', colorScheme = 'blue and white', layout = 'single-page' } = body || {}

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const client = new Client({ apiKey: process.env.GEMINI_API_KEY })

    const system = `You are an expert UI/UX designer and developer. Generate a JSON schema for a complete UI layout.

Schema rules:
- Every node has: id, type, props, style, function, children (array)
- High-contrast text (text-gray-900 on light bg, text-white on dark)
- Responsive flex/grid layouts; avoid absolute positioning
- Valid image URLs or https://via.placeholder.com/400x300
- Style object uses camelCase keys and string values only
- Never return JSX; only JSON schema
`

    const user = `Create a UI schema for: "${prompt}"
Style: ${style}
Color Scheme: ${colorScheme}
Layout: ${layout}
Return only JSON.`

    const response = await client.models.generate_content({
      model: 'gemini-2.5-flash',
      contents: [system, user],
      config: { response_mime_type: 'application/json' }
    })

    let schema
    try {
      const text = typeof response.output_text === 'string' ? response.output_text : JSON.stringify(response, null, 2)
      schema = JSON.parse(text)
    } catch (e) {
      schema = createDefaultSchema(prompt || 'Untitled')
    }

    // Ensure validation and fixes
    const validation = validateSchema(schema)
    if (!validation.isValid) {
      // proceed; fix common issues regardless
    }
    const fixed = fixSchemaIssues(schema)

    return NextResponse.json({ schema: fixed })
  } catch (error: any) {
    console.error('schema-generate error:', error)
    return NextResponse.json({ error: 'Failed to generate schema' }, { status: 500 })
  }
}


