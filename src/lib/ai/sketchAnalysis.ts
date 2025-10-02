// Deprecated direct model import. Use server-side /api/schema-edit instead.
import { SketchElement, SketchAction } from '../sketchStore'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || 'AIzaSyBC3JWht6Y2SNf2t2UuOSVc-u6xGPnAxTM')
const model = genAI.getGenerativeModel({ 
  model: process.env.NEXT_PUBLIC_GENAI_MODEL || 'gemini-2.0-flash-exp' 
})

export interface SketchAnalysis {
  description: string
  action: 'add_component' | 'modify_component' | 'add_page' | 'highlight' | 'note'
  confidence: number
  targetElement?: string
  parameters: Record<string, any>
  suggestedAction?: SketchAction
}

export interface SketchContext {
  currentCode: string
  originalPrompt: string
  canvasSize: { width: number; height: number }
  existingSketches: SketchElement[]
}

export async function analyzeSketch(
  sketch: SketchElement, 
  context: SketchContext
): Promise<SketchAnalysis> {
  try {
    const systemPrompt = `You are an expert UI/UX analyst specializing in understanding user sketches and annotations on web interfaces. Your job is to analyze hand-drawn sketches and determine what the user wants to achieve.

**Your Analysis Should Include:**
1. **Description**: What the sketch represents in plain English
2. **Action Type**: What the user wants to do (add_component, modify_component, add_page, highlight, note)
3. **Confidence**: How confident you are (0-100)
4. **Target Element**: If modifying existing UI, what element is being targeted
5. **Parameters**: Specific details needed to implement the change

**Action Types:**
- **add_component**: User is adding a new UI component (button, form, card, etc.)
- **modify_component**: User is changing an existing component
- **add_page**: User is indicating a new page/section should be created
- **highlight**: User is highlighting something for attention
- **note**: User is adding a text note or comment

**Context Information:**
- Original UI Prompt: "${context.originalPrompt}"
- Canvas Size: ${context.canvasSize.width}x${context.canvasSize.height}
- Existing Sketches: ${context.existingSketches.length} previous sketches

**Analyze this sketch:**
- Type: ${sketch.type}
- Color: ${sketch.color}
- Stroke Width: ${sketch.strokeWidth}
- Text: ${sketch.text || 'None'}
- Position: ${sketch.position ? `(${sketch.position.x}, ${sketch.position.y})` : 'Not specified'}
- Points: ${sketch.points.length} points

Return your analysis as a JSON object with this exact structure:
{
  "description": "Clear description of what the sketch represents",
  "action": "one of the action types listed above",
  "confidence": number between 0 and 100,
  "targetElement": "specific element being modified (if applicable)",
  "parameters": {
    "componentType": "button|form|card|navigation|etc",
    "content": "text content if applicable",
    "style": "visual style preferences",
    "position": "where it should be placed",
    "functionality": "what it should do"
  },
  "suggestedAction": {
    "type": "create_page|add_component|modify_component|add_feature",
    "description": "detailed action description",
    "parameters": {
      "pageName": "if creating new page",
      "componentName": "if adding component",
      "route": "if adding new page/route"
    }
  }
}`

    const userPrompt = `Please analyze this sketch on a web interface and determine what the user wants to accomplish. Consider the context of the original UI design and provide actionable insights.

Sketch Details:
- Drawing type: ${sketch.type}
- Color used: ${sketch.color}
- Text content: ${sketch.text || 'None'}
- Number of points: ${sketch.points.length}
- Stroke width: ${sketch.strokeWidth}

Context:
- This is part of a UI for: ${context.originalPrompt}
- Current code includes: ${context.currentCode.substring(0, 500)}...
- Previous sketches in session: ${context.existingSketches.length}

Analyze this sketch and return the JSON response.`

    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = await result.response
    const analysisText = response.text()

    // Parse the JSON response
    try {
      const analysis = JSON.parse(analysisText)
      return {
        description: analysis.description || 'Unknown sketch',
        action: analysis.action || 'note',
        confidence: analysis.confidence || 50,
        targetElement: analysis.targetElement,
        parameters: analysis.parameters || {},
        suggestedAction: analysis.suggestedAction
      }
    } catch (parseError) {
      console.error('Error parsing sketch analysis:', parseError)
      return {
        description: 'Unable to parse sketch analysis',
        action: 'note',
        confidence: 0,
        parameters: {},
        suggestedAction: undefined
      }
    }

  } catch (error) {
    console.error('Error analyzing sketch:', error)
    return {
      description: 'Error analyzing sketch',
      action: 'note',
      confidence: 0,
      parameters: {},
      suggestedAction: undefined
    }
  }
}

export async function analyzeAllSketches(
  sketches: SketchElement[],
  context: SketchContext
): Promise<SketchAnalysis[]> {
  const analyses: SketchAnalysis[] = []
  
  for (const sketch of sketches) {
    // Skip sketches that already have analysis
    if (sketch.description) {
      continue
    }

    try {
      const analysis = await analyzeSketch(sketch, context)
      analyses.push(analysis)
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`Error analyzing sketch ${sketch.id}:`, error)
    }
  }

  return analyses
}

export async function generateActionPlan(
  analyses: SketchAnalysis[],
  context: SketchContext
): Promise<SketchAction[]> {
  try {
    const systemPrompt = `You are a UI development assistant that creates action plans based on user sketches and annotations. You need to convert sketch analyses into concrete, actionable development tasks.

**Available Actions:**
1. **create_page**: Create a new page/route (e.g., testimonials page, about page)
2. **add_component**: Add a new UI component to existing page
3. **modify_component**: Modify an existing component
4. **add_feature**: Add new functionality to the application

**Context:**
- Original UI: ${context.originalPrompt}
- Current code length: ${context.currentCode.length} characters
- Number of sketches to process: ${analyses.length}

**Your task:**
Create a prioritized action plan based on the sketch analyses. Each action should be specific, implementable, and address the user's intent.

Return a JSON array of actions with this structure:
[
  {
    "type": "action_type",
    "description": "Clear description of what needs to be done",
    "targetElement": "specific element if modifying",
    "parameters": {
      "pageName": "if creating page",
      "componentName": "if adding component",
      "route": "URL route",
      "content": "text content",
      "style": "styling preferences"
    },
    "status": "pending"
  }
]`

    const analysesText = analyses.map((analysis, index) => 
      `${index + 1}. ${analysis.description} (Action: ${analysis.action}, Confidence: ${analysis.confidence}%)`
    ).join('\n')

    const userPrompt = `Based on these sketch analyses, create an action plan:

${analysesText}

Generate specific, actionable tasks that will implement the user's requested changes. Prioritize by importance and logical order.`

    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = await result.response
    const actionsText = response.text()

    try {
      const actions = JSON.parse(actionsText)
      return Array.isArray(actions) ? actions : []
    } catch (parseError) {
      console.error('Error parsing action plan:', parseError)
      return []
    }

  } catch (error) {
    console.error('Error generating action plan:', error)
    return []
  }
}
