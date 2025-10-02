// Deprecated direct model import. Use server-side /api/schema-edit instead.

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || 'AIzaSyBC3JWht6Y2SNf2t2UuOSVc-u6xGPnAxTM')
const model = genAI.getGenerativeModel({ 
  model: process.env.NEXT_PUBLIC_GENAI_MODEL || 'gemini-2.0-flash-exp' 
})

export interface Drawing {
  id: string
  type: 'pen' | 'circle' | 'arrow' | 'text'
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  text?: string
  position?: { x: number; y: number }
}

export interface EditInstruction {
  type: 'move' | 'resize' | 'color' | 'text' | 'add' | 'remove' | 'style'
  target: string
  value: any
  description: string
  confidence: number
}

export interface EditAnalysisResult {
  instructions: EditInstruction[]
  summary: string
  confidence: number
}

export async function analyzeEdits(
  drawings: Drawing[],
  currentCode: string,
  canvasDimensions: { width: number; height: number }
): Promise<EditAnalysisResult> {
  try {
    // Convert drawings to a description
    const drawingDescription = describeDrawings(drawings, canvasDimensions)
    
    const systemPrompt = `You are an expert UI/UX analyst who understands user interface modifications through drawings and annotations.

Your task is to analyze user drawings and text annotations on a UI and convert them into specific, actionable instructions for modifying the UI code.

You will receive:
1. A description of drawings made on the UI
2. The current UI code
3. Canvas dimensions for context

Return a JSON object with this structure:
{
  "instructions": [
    {
      "type": "move|resize|color|text|add|remove|style",
      "target": "specific element or component to modify",
      "value": "new value or change to apply",
      "description": "human-readable description of the change",
      "confidence": 0.0-1.0
    }
  ],
  "summary": "Brief summary of all changes requested",
  "confidence": 0.0-1.0
}

Types of instructions:
- "move": Change position of an element
- "resize": Change size of an element  
- "color": Change colors, backgrounds, or styling
- "text": Modify text content
- "add": Add new elements
- "remove": Remove elements
- "style": Change styling properties

Be specific about which elements to target using CSS selectors or component names.`

    const userPrompt = `Analyze these UI modifications:

DRAWINGS:
${drawingDescription}

CURRENT UI CODE:
${currentCode}

CANVAS DIMENSIONS: ${canvasDimensions.width}x${canvasDimensions.height}

Convert the drawings into specific UI modification instructions.`

    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response')
    }

    const analysis = JSON.parse(jsonMatch[0])
    return analysis as EditAnalysisResult

  } catch (error) {
    console.error('Error analyzing edits:', error)
    
    // Fallback analysis based on drawing types
    return fallbackAnalysis(drawings)
  }
}

function describeDrawings(drawings: Drawing[], canvasDimensions: { width: number; height: number }): string {
  return drawings.map(drawing => {
    const normalizedPoints = drawing.points.map(point => ({
      x: Math.round((point.x / canvasDimensions.width) * 100),
      y: Math.round((point.y / canvasDimensions.height) * 100)
    }))

    switch (drawing.type) {
      case 'pen':
        return `Freehand drawing in ${drawing.color} at positions: ${JSON.stringify(normalizedPoints)}`
      case 'circle':
        return `Circle drawn in ${drawing.color} around position: ${JSON.stringify(normalizedPoints[0])}`
      case 'arrow':
        return `Arrow drawn in ${drawing.color} from ${JSON.stringify(normalizedPoints[0])} to ${JSON.stringify(normalizedPoints[1])}`
      case 'text':
        return `Text note "${drawing.text}" added in ${drawing.color} at position: ${JSON.stringify(normalizedPoints[0])}`
      default:
        return `Unknown drawing type: ${drawing.type}`
    }
  }).join('\n')
}

function fallbackAnalysis(drawings: Drawing[]): EditAnalysisResult {
  const instructions: EditInstruction[] = []
  
  drawings.forEach(drawing => {
    switch (drawing.type) {
      case 'circle':
        instructions.push({
          type: 'style',
          target: 'element',
          value: { border: `2px solid ${drawing.color}` },
          description: 'Add border to circled element',
          confidence: 0.7
        })
        break
      case 'arrow':
        instructions.push({
          type: 'move',
          target: 'element',
          value: { position: 'relative' },
          description: 'Move element as indicated by arrow',
          confidence: 0.6
        })
        break
      case 'text':
        if (drawing.text) {
          instructions.push({
            type: 'text',
            target: 'element',
            value: drawing.text,
            description: `Update text: ${drawing.text}`,
            confidence: 0.8
          })
        }
        break
    }
  })

  return {
    instructions,
    summary: `Applied ${instructions.length} modifications based on drawings`,
    confidence: 0.6
  }
}
