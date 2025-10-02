'use client'

import React, { useState, useEffect } from 'react'
import { UISchema, UISchemaNode } from '@/lib/uiSchema'

interface SchemaRendererProps {
  schema: UISchema
  isEditing?: boolean
}

export function SchemaRenderer({ schema, isEditing = false }: SchemaRendererProps) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const renderSchema = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Convert schema to JSX
        const jsx = schemaToJSX(schema)
        console.log('Rendering schema JSX:', jsx.substring(0, 200) + '...')

        // Create dynamic component
        const dynamicComponent = await createDynamicComponent(jsx)
        setComponent(() => dynamicComponent)
      } catch (err) {
        console.error('Error rendering schema:', err)
        setError(err instanceof Error ? err.message : 'Failed to render schema')
      } finally {
        setIsLoading(false)
      }
    }

    renderSchema()
  }, [schema])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Rendering UI...</h2>
          <p className="text-gray-500">Building from schema</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Rendering UI</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!Component) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No UI Schema</h2>
          <p className="text-gray-500">Generate a schema to render the UI</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isEditing ? 'editing-freeze' : undefined}>
      <Component />
    </div>
  )
}

// Convert schema to JSX with data attributes for selection
function schemaToJSX(schema: UISchema): string {
  function nodeToJSX(node: UISchemaNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    
    // Build props object
    const props: Record<string, any> = { ...node.props }
    
    // Add data-schema-id for component selection
    props['data-schema-id'] = node.id
    
    // Add schema-selectable class for overlay detection
    if (!props.className) {
      props.className = 'schema-selectable'
    } else {
      props.className += ' schema-selectable'
    }
    
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

// Create dynamic component from JSX
async function createDynamicComponent(jsx: string): Promise<React.ComponentType> {
  try {
    // Clean the code and ensure it's properly formatted
    let cleanCode = jsx.trim()
    
    // Remove any existing function wrapper if present
    cleanCode = cleanCode.replace(/^const\s+\w+\s*=\s*\(\)\s*=>\s*{?\s*return\s*\(/, '')
    cleanCode = cleanCode.replace(/\)\s*;?\s*}?\s*$/, '')
    
    // Remove HTML script tags and CDATA sections that are not valid in JSX
    cleanCode = cleanCode.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    cleanCode = cleanCode.replace(/\/\/<!\[CDATA\[[\s\S]*?\/\/\]\]>/g, '')
    cleanCode = cleanCode.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    
    // Remove HTML comments that might cause issues
    cleanCode = cleanCode.replace(/<!--[\s\S]*?-->/g, '')

    // Strip stray language markers that sometimes leak from markdown blocks
    cleanCode = cleanCode.replace(/^\s*(jsx|tsx|javascript|html)\s*$/gim, '')
    
    // Remove any remaining HTML-only elements that aren't valid in JSX
    cleanCode = cleanCode.replace(/<html[^>]*>/gi, '')
    cleanCode = cleanCode.replace(/<\/html>/gi, '')
    cleanCode = cleanCode.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    cleanCode = cleanCode.replace(/<body[^>]*>/gi, '')
    cleanCode = cleanCode.replace(/<\/body>/gi, '')

    // Normalize problematic anchor tags which often cause unbalanced JSX
    cleanCode = cleanCode
      .replace(/<a(\s|>)/gi, (m) => m.replace(/<a/i, '<span'))
      .replace(/<\/a>/gi, '</span>')

    // Normalize void elements to canonical self-closing JSX
    const normalizeVoid = (tag: string) => {
      const re = new RegExp(`<${tag}([^>]*)>`, 'gi')
      cleanCode = cleanCode.replace(re, (_m, attrs) => {
        const cleanedAttrs = String(attrs || '')
          .replace(/\s*\/\s*$/g, '')
        return `<${tag}${cleanedAttrs} />`
      })
    }

    ;['img', 'br', 'hr', 'input', 'source', 'link', 'meta'].forEach(normalizeVoid)
    
    // Remove any leading/trailing whitespace and ensure proper JSX structure
    cleanCode = cleanCode.trim()
    
    // If the code doesn't start with JSX, wrap it
    if (!cleanCode.startsWith('<')) {
      cleanCode = '<div>' + cleanCode + '</div>'
    }

    // Heuristic: detect dark backgrounds and adapt text color
    const looksDark = /\b(bg|from|via|to)-(black|slate|gray|zinc|neutral|stone|blue|indigo|purple|fuchsia|pink|rose|violet)-(700|800|900)\b/i.test(cleanCode)
      || /\bbg-(black|#[0-1a-f]{3,6})\b/i.test(cleanCode)
    const wrapperText = looksDark ? 'text-white' : 'text-gray-900'

    // Enforce a readable wrapper to avoid low-contrast outputs
    cleanCode = `
      <div className="antialiased tracking-tight selection:bg-blue-200/60 selection:text-gray-900 ${wrapperText} text-shadow">
        ${cleanCode}
      </div>
    `
    
    console.log('Cleaned schema JSX:', cleanCode.substring(0, 200) + '...')
    
    // Create a complete React component with proper structure
    const componentCode = `
      const GeneratedComponent = () => {
        return (
          ${cleanCode}
        );
      };
    `

    console.log('Component code:', componentCode.substring(0, 300) + '...')

    // Ensure Babel is available (load on-demand in the browser)
    if (!(window as any).Babel) {
      try {
        const Babel = (await import('@babel/standalone')).default
        ;(window as any).Babel = Babel
      } catch (e) {
        console.error('Failed to load Babel at runtime:', e)
        throw new Error('Babel is not loaded. Please refresh the page.')
      }
    }

    // Additional sanitation for JSX correctness
    cleanCode = cleanCode.replace(/\sclass="/g, ' className="')

    // Use Babel to transform JSX to JavaScript
    let transformedCode
    try {
      const result = (window as any).Babel.transform(componentCode, {
        presets: ['react']
      })
      transformedCode = result.code
    } catch (babelError) {
      console.error('Babel transformation failed:', babelError)
      throw new Error(`JSX syntax error: ${babelError.message}`)
    }

    console.log('Transformed code:', transformedCode.substring(0, 300) + '...')

    // Create the component function with proper React import
    const componentFunction = new Function(
      'React',
      `
      ${transformedCode}
      return GeneratedComponent;
      `
    )

    // Check if React is available
    if (!React) {
      throw new Error('React is not available in the current scope')
    }

    // Pass React to the function
    const component = componentFunction(React)
    console.log('Schema component created successfully:', component)
    return component
  } catch (error) {
    console.error('Error creating dynamic component from schema:', error)
    
    // Enhanced fallback: create a component that safely renders the JSX as HTML
    return () => {
      try {
        console.log('Using fallback HTML rendering for schema')
        
        // Convert JSX to HTML
        let htmlCode = jsx
          .replace(/className=/g, 'class=')
          .replace(/<(\w+)([^>]*?)>/g, (match, tag, attrs) => {
            // Convert JSX attributes to HTML attributes
            const htmlAttrs = attrs
              .replace(/className="([^"]*)"/g, 'class="$1"')
              .replace(/style="([^"]*)"/g, 'style="$1"')
              .replace(/onClick="([^"]*)"/g, 'onclick="$1"')
            return `<${tag}${htmlAttrs}>`
          })
          .replace(/{\/\*.*?\*\/}/g, '') // Remove JSX comments
          .replace(/\{new Date\(\)\.getFullYear\(\)\}/g, new Date().getFullYear().toString()) // Replace JS expressions
        
        // Ensure proper HTML structure
        if (!htmlCode.includes('<html>')) {
          htmlCode = `<div class="min-h-screen bg-white">${htmlCode}</div>`
        }
        
        console.log('HTML code:', htmlCode.substring(0, 200) + '...')
        
        return (
          <div 
            className="min-h-screen bg-white"
            dangerouslySetInnerHTML={{ __html: htmlCode }}
          />
        )
      } catch (fallbackError) {
        console.error('Fallback rendering failed:', fallbackError)
        return (
          <div className="min-h-screen bg-red-50 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Rendering Schema</h2>
              <p className="text-red-500 mb-4">Unable to render the schema</p>
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm font-mono max-h-40 overflow-auto mb-4">
                <pre>{jsx.substring(0, 500)}...</pre>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )
      }
    }
  }
}
