// Deprecated direct model import. Use server-side /api/schema-edit instead.
import { SketchAction } from '../sketchStore'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || 'AIzaSyBC3JWht6Y2SNf2t2UuOSVc-u6xGPnAxTM')
const model = genAI.getGenerativeModel({ 
  model: process.env.NEXT_PUBLIC_GENAI_MODEL || 'gemini-2.0-flash-exp' 
})

export interface ActionResult {
  success: boolean
  updatedCode?: string
  newPages?: Array<{
    name: string
    route: string
    content: string
  }>
  error?: string
  changes: string[]
}

export interface ExecutionContext {
  currentCode: string
  originalPrompt: string
  action: SketchAction
  allActions: SketchAction[]
}

export async function executeAction(context: ExecutionContext): Promise<ActionResult> {
  const { currentCode, originalPrompt, action, allActions } = context

  try {
    switch (action.type) {
      case 'create_page':
        return await executeCreatePage(context)
      case 'add_component':
        return await executeAddComponent(context)
      case 'modify_component':
        return await executeModifyComponent(context)
      case 'add_feature':
        return await executeAddFeature(context)
      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`,
          changes: []
        }
    }
  } catch (error) {
    console.error('Error executing action:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      changes: []
    }
  }
}

async function executeCreatePage(context: ExecutionContext): Promise<ActionResult> {
  const { currentCode, originalPrompt, action } = context

  const systemPrompt = `You are an expert React/TypeScript developer. You need to create a new page component based on user sketches and requirements.

**Requirements:**
1. Create a complete, production-ready React page component
2. Use modern Tailwind CSS styling
3. Make it responsive and accessible
4. Follow the design language of the existing UI
5. Include proper navigation integration

**Page Details:**
- Page Name: ${action.parameters.pageName || 'New Page'}
- Route: ${action.parameters.route || '/new-page'}
- Description: ${action.description}

**Context:**
- Original UI Theme: ${originalPrompt}
- Current UI Code: ${currentCode.substring(0, 1000)}...

**Return ONLY the complete JSX code for the new page component. Do not include function declarations, imports, or exports - just the JSX starting with <div> and ending with </div>.**

Make the page beautiful, modern, and consistent with the existing design.`

  const userPrompt = `Create a new page component for: ${action.description}

Parameters: ${JSON.stringify(action.parameters, null, 2)}

Make it visually appealing and functional.`

  const result = await model.generateContent([systemPrompt, userPrompt])
  const response = await result.response
  const newPageCode = response.text().trim()

  return {
    success: true,
    newPages: [{
      name: action.parameters.pageName || 'New Page',
      route: action.parameters.route || '/new-page',
      content: newPageCode
    }],
    changes: [`Created new page: ${action.parameters.pageName || 'New Page'}`]
  }
}

async function executeAddComponent(context: ExecutionContext): Promise<ActionResult> {
  const { currentCode, originalPrompt, action } = context

  const systemPrompt = `You are an expert React/TypeScript developer. You need to add a new component to the existing UI based on user sketches.

**Requirements:**
1. Add the component to the existing UI code
2. Use modern Tailwind CSS styling
3. Make it responsive and accessible
4. Integrate seamlessly with existing design
5. Position it appropriately based on user intent

**Component Details:**
- Component Type: ${action.parameters.componentType || 'generic'}
- Description: ${action.description}
- Target Element: ${action.targetElement || 'none specified'}
- Content: ${action.parameters.content || 'none specified'}
- Style: ${action.parameters.style || 'none specified'}

**Context:**
- Original UI Theme: ${originalPrompt}
- Current UI Code: ${currentCode}

**Your task:**
Modify the existing UI code to include the new component. Return the complete updated JSX code that includes the new component integrated into the existing layout.

Return ONLY the complete JSX code starting with <div> and ending with </div>. Include the entire UI with the new component added.`

  const userPrompt = `Add this component to the existing UI:

Component: ${action.description}
Type: ${action.parameters.componentType}
Content: ${action.parameters.content}
Style: ${action.parameters.style}

Integrate it naturally into the existing design.`

  const result = await model.generateContent([systemPrompt, userPrompt])
  const response = await result.response
  const updatedCode = response.text().trim()

  return {
    success: true,
    updatedCode,
    changes: [`Added ${action.parameters.componentType || 'component'}: ${action.description}`]
  }
}

async function executeModifyComponent(context: ExecutionContext): Promise<ActionResult> {
  const { currentCode, originalPrompt, action } = context

  const systemPrompt = `You are an expert React/TypeScript developer. You need to modify an existing component based on user sketches and requirements.

**Requirements:**
1. Modify the existing component as specified
2. Maintain the overall design consistency
3. Use modern Tailwind CSS styling
4. Ensure responsiveness and accessibility
5. Preserve the component's functionality while making the requested changes

**Modification Details:**
- Target Element: ${action.targetElement || 'not specified'}
- Description: ${action.description}
- Changes: ${JSON.stringify(action.parameters, null, 2)}

**Context:**
- Original UI Theme: ${originalPrompt}
- Current UI Code: ${currentCode}

**Your task:**
Modify the existing UI code to implement the requested changes. Return the complete updated JSX code with the modifications applied.

Return ONLY the complete JSX code starting with <div> and ending with </div>. Include the entire UI with the modifications applied.`

  const userPrompt = `Modify the existing UI component:

Target: ${action.targetElement}
Changes: ${action.description}
Parameters: ${JSON.stringify(action.parameters, null, 2)}

Apply the modifications while maintaining design consistency.`

  const result = await model.generateContent([systemPrompt, userPrompt])
  const response = await result.response
  const updatedCode = response.text().trim()

  return {
    success: true,
    updatedCode,
    changes: [`Modified ${action.targetElement || 'component'}: ${action.description}`]
  }
}

async function executeAddFeature(context: ExecutionContext): Promise<ActionResult> {
  const { currentCode, originalPrompt, action } = context

  const systemPrompt = `You are an expert React/TypeScript developer. You need to add new functionality to the existing UI based on user requirements.

**Requirements:**
1. Add the new feature to the existing UI
2. Use modern Tailwind CSS styling
3. Make it interactive and functional
4. Integrate seamlessly with existing design
5. Ensure proper user experience

**Feature Details:**
- Description: ${action.description}
- Parameters: ${JSON.stringify(action.parameters, null, 2)}

**Context:**
- Original UI Theme: ${originalPrompt}
- Current UI Code: ${currentCode}

**Your task:**
Modify the existing UI code to include the new feature. Return the complete updated JSX code with the new functionality added.

Return ONLY the complete JSX code starting with <div> and ending with </div>. Include the entire UI with the new feature integrated.`

  const userPrompt = `Add this feature to the existing UI:

Feature: ${action.description}
Parameters: ${JSON.stringify(action.parameters, null, 2)}

Make it functional and well-integrated with the existing design.`

  const result = await model.generateContent([systemPrompt, userPrompt])
  const response = await result.response
  const updatedCode = response.text().trim()

  return {
    success: true,
    updatedCode,
    changes: [`Added feature: ${action.description}`]
  }
}

export async function executeActionPlan(actions: SketchAction[], context: Omit<ExecutionContext, 'action' | 'allActions'>): Promise<ActionResult[]> {
  const results: ActionResult[] = []
  
  for (const action of actions) {
    try {
      const result = await executeAction({
        ...context,
        action,
        allActions: actions
      })
      results.push(result)
      
      // Update context with the latest code if successful
      if (result.success && result.updatedCode) {
        context.currentCode = result.updatedCode
      }
      
      // Add delay between actions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error)
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        changes: []
      })
    }
  }
  
  return results
}
