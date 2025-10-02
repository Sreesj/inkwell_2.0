// Schema-first AI generation system
import { UISchema, UISchemaNode, createDefaultSchema, validateSchema, fixSchemaIssues } from '../uiSchema'

export interface SchemaGenerationRequest {
  prompt: string
  style?: string
  colorScheme?: string
  layout?: string
}

export interface SchemaGenerationResponse {
  schema: UISchema
  jsx: string
  description: string
  suggestions: string[]
}

export async function generateUISchema(request: SchemaGenerationRequest): Promise<SchemaGenerationResponse> {
  try {
    const systemPrompt = `You are an expert UI/UX designer and developer. Your task is to generate a JSON schema that represents a complete UI layout.

**Schema Requirements:**
1. Generate a complete JSON schema with nested components
2. Each component must have: id, type, props, style, function, and optional children
3. Use high-contrast text (text-gray-900 on light backgrounds, text-white on dark backgrounds)
4. Use responsive flex/grid layouts, avoid absolute positioning
5. Always provide valid image URLs or use https://via.placeholder.com/400x300
6. Define clear functions for each component
7. Ensure proper component hierarchy and nesting

**Component Types Available:**
- container: Layout containers (div)
- button: Interactive buttons
- text: Text content (p, h1, h2, h3, etc.)
- image: Images with src and alt
- card: Content cards
- navigation: Navigation menus
- hero: Hero sections
- section: Content sections

**Style Guidelines:**
- Use Tailwind CSS classes in props.className
- Use CSS properties in style object for custom styling
- Ensure text contrast ratio >= 4.5:1
- Use responsive design patterns
- Avoid opacity/backdrop-blur on main content unless requested

**Function Guidelines:**
- Describe what each component does
- Be specific about user interactions
- Explain the component's purpose in the overall layout

Return ONLY a valid JSON schema. Do not include any explanations or markdown formatting.`

    const userPrompt = `Create a UI schema based on this description: "${request.prompt}"

Style: ${request.style || 'modern'}
Color Scheme: ${request.colorScheme || 'blue and white'}
Layout: ${request.layout || 'single-page'}

Generate a complete JSON schema with proper nesting, high contrast, and responsive design.`

    // Prefer server API route that uses @google/genai (multimodal)
    const apiRes = await fetch('/api/schema-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: request.prompt,
        style: request.style,
        colorScheme: request.colorScheme,
        layout: request.layout
      })
    })
    let schemaText = ''
    if (apiRes.ok) {
      const { schema } = await apiRes.json()
      schemaText = JSON.stringify(schema)
    } else {
      schemaText = JSON.stringify(createDefaultSchema(request.prompt))
    }

    // Clean the response
    schemaText = schemaText.replace(/```json/g, '').replace(/```/g, '').trim()

    let schema: UISchema
    try {
      schema = JSON.parse(schemaText)
    } catch (parseError) {
      console.error('Failed to parse AI-generated schema:', parseError)
      // Fallback to default schema
      schema = createDefaultSchema(request.prompt)
    }

    // Validate and fix the schema
    const validation = validateSchema(schema)
    if (!validation.isValid) {
      console.warn('Schema validation failed:', validation.errors)
    }

    // Fix common issues
    const fixedSchema = fixSchemaIssues(schema)

    // Convert to JSX
    const jsx = schemaToJSX(fixedSchema)

    // Generate suggestions
    const suggestions = generateSuggestions(fixedSchema)

    return {
      schema: fixedSchema,
      jsx,
      description: `Generated UI schema based on: ${request.prompt}`,
      suggestions
    }

  } catch (error: any) {
    console.error('Error generating UI schema:', error)
    // Return fallback schema
    const fallbackSchema = createDefaultSchema(request.prompt)
    return {
      schema: fallbackSchema,
      jsx: schemaToJSX(fallbackSchema),
      description: `Fallback UI schema for: ${request.prompt}`,
      suggestions: ['Try refining your prompt for better results']
    }
  }
}

// Convert schema to JSX
function schemaToJSX(schema: UISchema): string {
  function nodeToJSX(node: UISchemaNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    
    // Build props object
    const props: Record<string, any> = { ...node.props }
    
    // Add style properties
    if (node.style && Object.keys(node.style).length > 0) {
      props.style = node.style
    }

    // Convert props to JSX format
    const jsxProps = Object.entries(props)
      .map(([key, value]) => {
        if (key === 'className') return `className="${value}"`
        if (key === 'style' && typeof value === 'object') {
          const styleStr = Object.entries(value)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
            .join('; ')
          return `style={{${styleStr}}}`
        }
        if (key === 'content') {
          // For text nodes, content becomes children
          return ''
        }
        return `${key}="${value}"`
      })
      .filter(Boolean)
      .join(' ')

    const tagName = getTagName(node.type)
    const hasChildren = node.children && node.children.length > 0
    const hasContent = node.props.content && !hasChildren

    if (hasChildren) {
      const childrenJSX = node.children!.map(child => nodeToJSX(child, depth + 1)).join('\n')
      return `${indent}<${tagName} ${jsxProps}>\n${childrenJSX}\n${indent}</${tagName}>`
    } else if (hasContent) {
      return `${indent}<${tagName} ${jsxProps}>${node.props.content}</${tagName}>`
    } else {
      return `${indent}<${tagName} ${jsxProps} />`
    }
  }

  return nodeToJSX(schema.root)
}

function getTagName(type: string): string {
  const tagMap: Record<string, string> = {
    'container': 'div',
    'button': 'button',
    'text': 'p',
    'image': 'img',
    'card': 'div',
    'navigation': 'nav',
    'hero': 'section',
    'section': 'section'
  }
  return tagMap[type] || 'div'
}

function generateSuggestions(schema: UISchema): string[] {
  const suggestions: string[] = []
  
  // Analyze schema for suggestions
  const nodeCount = countNodes(schema.root)
  if (nodeCount < 5) {
    suggestions.push('Consider adding more components for a richer layout')
  }
  
  const hasImages = hasNodeType(schema.root, 'image')
  if (!hasImages) {
    suggestions.push('Add images to make the layout more visually appealing')
  }
  
  const hasButtons = hasNodeType(schema.root, 'button')
  if (!hasButtons) {
    suggestions.push('Add interactive buttons for better user engagement')
  }
  
  return suggestions
}

function countNodes(node: UISchemaNode): number {
  let count = 1
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0)
  }
  return count
}

function hasNodeType(node: UISchemaNode, type: string): boolean {
  if (node.type === type) return true
  if (node.children) {
    return node.children.some(child => hasNodeType(child, type))
  }
  return false
}
