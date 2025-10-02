// Deprecated: editing handled via schema + /api/schema-edit using @google/genai
import { EditInstruction } from './editAnalysis'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || 'AIzaSyBC3JWht6Y2SNf2t2UuOSVc-u6xGPnAxTM')
const model = genAI.getGenerativeModel({ 
  model: process.env.NEXT_PUBLIC_GENAI_MODEL || 'gemini-2.0-flash-exp' 
})

export interface RegenerationRequest {
  currentCode: string
  instructions: EditInstruction[]
  originalPrompt: string
}

export interface RegenerationResponse {
  updatedCode: string
  changes: string[]
  warnings: string[]
}

export async function regenerateUI(request: RegenerationRequest): Promise<RegenerationResponse> {
  try {
    // Validate the regeneration request
    const validation = validateRegenerationRequest(request)
    
    const systemPrompt = `You are an expert React/TypeScript developer. Your task is to modify existing UI code based on specific instructions while maintaining code quality and consistency.

Guidelines:
1. Only modify the parts of the code that need to be changed
2. Maintain the existing structure and styling approach
3. Use Tailwind CSS for all styling
4. Keep the code clean and readable
5. Preserve existing functionality
6. Apply changes incrementally and precisely
7. Maintain responsive design
8. Keep the lovable, playful design style with rounded corners and soft shadows
9. NEVER hardcode edits directly into HTML - always update the component structure properly
10. Use high-contrast text (text-gray-900 on light backgrounds, text-white on dark backgrounds)
11. Use responsive grid/flex layouts instead of absolute positioning
12. Always use valid image URLs (https://via.placeholder.com/400x300 if no URL provided)
13. Avoid applying opacity or backdrop-blur to main content unless explicitly requested

Return ONLY the updated JSX code. Do not include imports, exports, or explanations.`

    const instructionsText = request.instructions.map(inst => 
      `- ${inst.type}: ${inst.description} (target: ${inst.target}, value: ${JSON.stringify(inst.value)})`
    ).join('\n')

    const userPrompt = `Modify this React component based on the following instructions:

ORIGINAL PROMPT: ${request.originalPrompt}

CURRENT CODE:
${request.currentCode}

MODIFICATION INSTRUCTIONS:
${instructionsText}

Apply these changes to the code while maintaining the overall design and structure.`

    const result = await model.generateContent([systemPrompt, userPrompt])
    const response = await result.response
    const updatedCode = response.text()

    // Clean the code
    const cleanedCode = cleanCode(updatedCode)
    
    // Generate change summary
    const changes = generateChangeSummary(request.instructions)
    const generatedWarnings = generateWarnings(cleanedCode, request.currentCode)
    
    // Combine validation warnings with generated warnings
    const allWarnings = [...validation.warnings, ...generatedWarnings]

    return {
      updatedCode: cleanedCode,
      changes,
      warnings: allWarnings
    }

  } catch (error) {
    console.error('Error regenerating UI:', error)
    throw new Error('Failed to regenerate UI. Please try again.')
  }
}

function cleanCode(code: string): string {
  return code
    .replace(/```tsx?/g, '')
    .replace(/```/g, '')
    .replace(/```jsx?/g, '')
    .trim()
}

function validateRegenerationRequest(request: RegenerationRequest): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Check if we're making too many changes at once
  if (request.instructions.length > 5) {
    warnings.push('Making many changes at once - consider breaking into smaller edits')
  }
  
  // Check for hardcoded values that should be avoided
  const hasHardcodedValues = request.instructions.some(inst => 
    typeof inst.value === 'string' && 
    (inst.value.includes('<div') || inst.value.includes('<span') || inst.value.includes('style='))
  )
  
  if (hasHardcodedValues) {
    warnings.push('Detected potential hardcoded HTML - ensure proper component structure')
  }
  
  // Check if we're regenerating the entire UI unnecessarily
  const isFullRegeneration = request.instructions.some(inst => 
    inst.type === 'modify_component' && inst.target === 'entire_ui'
  )
  
  if (isFullRegeneration && request.instructions.length === 1) {
    warnings.push('Full UI regeneration detected - consider more targeted edits')
  }
  
  return {
    isValid: true, // Always allow, but warn
    warnings
  }
}

function generateChangeSummary(instructions: EditInstruction[]): string[] {
  return instructions.map(instruction => {
    switch (instruction.type) {
      case 'move':
        return `Moved ${instruction.target} to new position`
      case 'resize':
        return `Resized ${instruction.target}`
      case 'color':
        return `Updated colors for ${instruction.target}`
      case 'text':
        return `Updated text content for ${instruction.target}`
      case 'add':
        return `Added new ${instruction.target}`
      case 'remove':
        return `Removed ${instruction.target}`
      case 'style':
        return `Updated styling for ${instruction.target}`
      default:
        return `Modified ${instruction.target}`
    }
  })
}

function generateWarnings(newCode: string, oldCode: string): string[] {
  const warnings: string[] = []

  // Check for potential issues
  if (newCode.length < oldCode.length * 0.5) {
    warnings.push('Significant code reduction detected - please verify all functionality is preserved')
  }

  if (!newCode.includes('className=')) {
    warnings.push('No Tailwind classes found - styling may be missing')
  }

  if (newCode.includes('undefined') || newCode.includes('null')) {
    warnings.push('Potential undefined values detected in the code')
  }

  return warnings
}

// Helper function to apply incremental changes
export function applyIncrementalChanges(
  currentCode: string, 
  instructions: EditInstruction[]
): string {
  let modifiedCode = currentCode

  instructions.forEach(instruction => {
    switch (instruction.type) {
      case 'color':
        modifiedCode = applyColorChange(modifiedCode, instruction)
        break
      case 'text':
        modifiedCode = applyTextChange(modifiedCode, instruction)
        break
      case 'style':
        modifiedCode = applyStyleChange(modifiedCode, instruction)
        break
      // Add more specific change handlers as needed
    }
  })

  return modifiedCode
}

function applyColorChange(code: string, instruction: EditInstruction): string {
  // Simple color replacement logic
  if (instruction.value && typeof instruction.value === 'object') {
    const colorValue = instruction.value.color || instruction.value.background
    if (colorValue) {
      // Replace common color patterns
      return code.replace(/bg-\w+-\d+/g, `bg-${colorValue}`)
    }
  }
  return code
}

function applyTextChange(code: string, instruction: EditInstruction): string {
  // Simple text replacement logic
  if (instruction.value && typeof instruction.value === 'string') {
    // This is a simplified approach - in practice, you'd want more sophisticated text replacement
    return code.replace(/>[^<]*</g, (match) => {
      if (match.includes(instruction.target)) {
        return match.replace(/>[^<]*</, `>${instruction.value}<`)
      }
      return match
    })
  }
  return code
}

function applyStyleChange(code: string, instruction: EditInstruction): string {
  // Apply style changes based on instruction
  if (instruction.value && typeof instruction.value === 'object') {
    // Add or modify className attributes
    const newClasses = Object.keys(instruction.value).map(key => {
      const value = instruction.value[key]
      return `${key}-${value}`
    }).join(' ')
    
    // This is simplified - in practice, you'd want more sophisticated class manipulation
    return code.replace(/className="([^"]*)"/g, (match, existingClasses) => {
      return `className="${existingClasses} ${newClasses}"`
    })
  }
  return code
}
