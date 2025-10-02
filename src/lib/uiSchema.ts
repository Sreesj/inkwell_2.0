// UI Schema system for Inkwell Builder
export interface UISchemaNode {
  id: string
  type: 'container' | 'button' | 'text' | 'image' | 'card' | 'navigation' | 'hero' | 'section'
  props: Record<string, any>
  style: Record<string, any>
  function: string
  children?: UISchemaNode[]
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface UISchema {
  id: string
  version: number
  root: UISchemaNode
  metadata: {
    title: string
    description: string
    createdAt: number
    lastModified: number
  }
}

// Schema validation functions
export function validateSchema(schema: UISchema): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  function validateNode(node: UISchemaNode, path: string = 'root'): void {
    // Check required fields
    if (!node.id) {
      errors.push(`Missing id at ${path}`)
    }
    if (!node.type) {
      errors.push(`Missing type at ${path}`)
    }
    if (!node.function) {
      warnings.push(`Missing function description at ${path}`)
    }

    // Validate specific node types
    switch (node.type) {
      case 'image':
        if (!node.props.src || node.props.src === '') {
          warnings.push(`Image at ${path} has no src, will use placeholder`)
        }
        break
      
      case 'text':
        if (!node.props.content || node.props.content === '') {
          warnings.push(`Text node at ${path} has no content`)
        }
        break
      
      case 'button':
        if (!node.props.text || node.props.text === '') {
          warnings.push(`Button at ${path} has no text`)
        }
        break
    }

    // Validate style properties
    if (node.style) {
      // Check for low contrast text
      if (node.style.color && node.style.backgroundColor) {
        const contrast = calculateContrast(node.style.color, node.style.backgroundColor)
        if (contrast < 4.5) {
          warnings.push(`Low contrast text at ${path} (ratio: ${contrast.toFixed(2)})`)
        }
      }

      // Check for absolute positioning
      if (node.style.position === 'absolute') {
        warnings.push(`Absolute positioning detected at ${path}, consider using flex/grid`)
      }
    }

    // Recursively validate children
    if (node.children) {
      node.children.forEach((child, index) => {
        validateNode(child, `${path}.children[${index}]`)
      })
    }
  }

  validateNode(schema.root)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Fix common schema issues
export function fixSchemaIssues(schema: UISchema): UISchema {
  const fixedSchema = JSON.parse(JSON.stringify(schema)) // Deep clone

  function fixNode(node: UISchemaNode): void {
    // Ensure children is always an array
    if (!Array.isArray(node.children)) {
      node.children = []
    }

    // Normalize style object: camelCase keys and string values
    if (node.style && typeof node.style === 'object') {
      const normalized: Record<string, any> = {}
      for (const [key, value] of Object.entries(node.style)) {
        const camelKey = key.replace(/-([a-z])/g, (_m, c) => c.toUpperCase())
        normalized[camelKey] = typeof value === 'string' ? value : JSON.stringify(value)
      }
      node.style = normalized
    } else if (!node.style) {
      node.style = {}
    }

    // Fix empty images
    if (node.type === 'image' && (!node.props.src || node.props.src === '')) {
      node.props.src = 'https://via.placeholder.com/400x300'
      node.props.alt = node.props.alt || 'Placeholder image'
    }

    // Fix low contrast text
    if (node.style && node.style.color && node.style.backgroundColor) {
      const contrast = calculateContrast(node.style.color, node.style.backgroundColor)
      if (contrast < 4.5) {
        // Determine if background is light or dark
        const bgLuminance = getLuminance(node.style.backgroundColor)
        node.style.color = bgLuminance > 0.5 ? '#1f2937' : '#ffffff' // text-gray-900 or text-white
      }
    }

    // Fix absolute positioning
    if (node.style && node.style.position === 'absolute') {
      node.style.position = 'relative'
      // Encourage layout via utility classes
      node.props = node.props || {}
      const base = (node.props.className || '') as string
      if (!/\bgrid\b|\bflex\b/.test(base)) {
        node.props.className = (base + ' flex flex-col').trim()
      }
    }

    // Ensure function is defined
    if (!node.function) {
      node.function = getDefaultFunction(node.type)
    }

    // Recursively fix children
    node.children.forEach(fixNode)
  }

  fixNode(fixedSchema.root)
  fixedSchema.metadata.lastModified = Date.now()
  fixedSchema.version += 1

  return fixedSchema
}

// Helper functions
function calculateContrast(color1: string, color2: string): number {
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

function getLuminance(color: string): number {
  // Convert color to RGB
  const rgb = hexToRgb(color)
  if (!rgb) return 0.5 // Default for unknown colors

  // Calculate relative luminance
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function getDefaultFunction(type: string): string {
  const defaults: Record<string, string> = {
    'button': 'Interactive button for user actions',
    'text': 'Text content for information display',
    'image': 'Visual content for illustration',
    'card': 'Container for related content',
    'navigation': 'Navigation menu for site structure',
    'hero': 'Main banner section for key messaging',
    'section': 'Content section for organizing layout',
    'container': 'Layout container for grouping elements'
  }
  return defaults[type] || 'UI component'
}

// Schema to JSX conversion
export function schemaToJSX(schema: UISchema): string {
  function nodeToJSX(node: UISchemaNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    const props = { ...node.props, ...node.style }
    
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
        return `${key}="${value}"`
      })
      .join(' ')

    const tagName = getTagName(node.type)
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
      const childrenJSX = node.children!.map(child => nodeToJSX(child, depth + 1)).join('\n')
      return `${indent}<${tagName} ${jsxProps}>\n${childrenJSX}\n${indent}</${tagName}>`
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

// Create default schema
export function createDefaultSchema(prompt: string): UISchema {
  return {
    id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    version: 1,
    root: {
      id: 'root',
      type: 'container',
      props: {
        className: 'min-h-screen bg-white'
      },
      style: {},
      function: 'Main page container',
      children: [
        {
          id: 'hero',
          type: 'hero',
          props: {
            className: 'py-20 px-4 text-center'
          },
          style: {
            backgroundColor: '#f8fafc'
          },
          function: 'Hero section for main messaging',
          children: [
            {
              id: 'hero-title',
              type: 'text',
              props: {
                className: 'text-4xl font-bold mb-4',
                content: 'Welcome to Our Platform'
              },
              style: {
                color: '#1f2937'
              },
              function: 'Main headline text'
            },
            {
              id: 'hero-button',
              type: 'button',
              props: {
                className: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700',
                text: 'Get Started'
              },
              style: {},
              function: 'Primary call-to-action button'
            }
          ]
        }
      ]
    },
    metadata: {
      title: 'Generated UI',
      description: prompt,
      createdAt: Date.now(),
      lastModified: Date.now()
    }
  }
}
