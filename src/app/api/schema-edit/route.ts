import { NextRequest, NextResponse } from 'next/server'
import '@/polyfills/node-fetch'
import { Client, types } from '@google/genai'
import { validateSchema, fixSchemaIssues } from '@/lib/uiSchema'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { schema, instruction, sketchBase64 } = body || {}

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const client = new Client({ apiKey: process.env.GEMINI_API_KEY })

    const contents: any[] = [
      'Here is the current UI schema and an edit instruction. Return an updated JSON schema only. Ensure: high-contrast text, valid images, camelCase style keys (string values), children arrays, and no absolute positioning.',
      JSON.stringify(schema),
      instruction || 'Apply small, targeted change. Do not regenerate entire layout.'
    ]

    if (sketchBase64) {
      const sketchBytes = Buffer.from(sketchBase64.split(',').pop() || '', 'base64')
      contents.push(types.Part.from_bytes({ data: sketchBytes, mime_type: 'image/png' }))
    }

    const response = await client.models.generate_content({
      model: 'gemini-2.5-flash',
      contents,
      config: { response_mime_type: 'application/json' }
    })

    let updated
    try {
      const text = typeof response.output_text === 'string' ? response.output_text : JSON.stringify(response, null, 2)
      updated = JSON.parse(text)
    } catch (e) {
      return NextResponse.json({
        error: "I couldn’t process this. Please describe what this element should do.",
        needsHelp: true
      }, { status: 400 })
    }

    // Validate and fix
    const validation = validateSchema(updated)
    const fixed = fixSchemaIssues(updated)

    return NextResponse.json({ schema: fixed, warnings: [...validation.warnings] })
  } catch (error: any) {
    console.error('schema-edit error:', error)
    return NextResponse.json({
      error: "I couldn’t process this. Please describe what this element should do.",
      needsHelp: true
    }, { status: 500 })
  }
}


