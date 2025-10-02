'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PenOverlay } from './PenOverlay'
import { SchemaOverlay } from './SchemaOverlay'
import { SchemaFunctionModal } from './SchemaFunctionModal'
import { SchemaRenderer } from './SchemaRenderer'
import { HelpDialog } from './HelpDialog'
import { Eye, Edit3 } from 'lucide-react'
import { UISchema, UISchemaNode } from '@/lib/uiSchema'
import { SchemaEditor } from '@/lib/schemaEditor'

// Production-ready function to create dynamic React components from AI-generated code
async function createDynamicComponent(code: string): Promise<React.ComponentType> {
  try {
    // Clean the code and ensure it's properly formatted
    let cleanCode = code.trim()
    
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
    // Convert all <a> tags to <span> to avoid routing/href issues in generated snippets
    // and to prevent unclosed <a> errors during Babel transform
    cleanCode = cleanCode
      .replace(/<a(\s|>)/gi, (m) => m.replace(/<a/i, '<span'))
      .replace(/<\/a>/gi, '</span>')

    // Normalize void elements to canonical self-closing JSX, handling cases where a stray
    // slash already exists before the > (e.g., " / >"), which would otherwise produce " / />"
    const normalizeVoid = (tag: string) => {
      const re = new RegExp(`<${tag}([^>]*)>`, 'gi')
      cleanCode = cleanCode.replace(re, (_m, attrs) => {
        const cleanedAttrs = String(attrs || '')
          // remove any trailing slash before the '>'
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
    
    console.log('Cleaned code:', cleanCode.substring(0, 200) + '...')
    
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
    // Convert any accidental class="..." to className="..."
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
    console.log('Component created successfully:', component)
    return component
  } catch (error) {
    console.error('Error creating dynamic component:', error)
    
    // Enhanced fallback: create a component that safely renders the JSX as HTML
    return () => {
      try {
        console.log('Using fallback HTML rendering')
        
        // Convert JSX to HTML
        let htmlCode = code
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
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Rendering UI</h2>
              <p className="text-red-500 mb-4">Unable to render the generated code</p>
              <div className="bg-gray-100 p-4 rounded-lg text-left text-sm font-mono max-h-40 overflow-auto mb-4">
                <pre>{code.substring(0, 500)}...</pre>
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


// Production-ready component to render AI-generated UI code
function UIRenderer({ code, isEditing }: { code: string, isEditing?: boolean }) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const renderComponent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Clean the code
        const cleanCode = code
          .replace(/```tsx?/g, '')
          .replace(/```/g, '')
          .replace(/```jsx?/g, '')
          .trim()

        if (!cleanCode || cleanCode.length < 50) {
          setIsLoading(false)
          return
        }

        console.log('Rendering code:', cleanCode.substring(0, 200) + '...')

        // Test if Babel is working with a simple component first
        if ((window as any).Babel) {
          try {
            const testCode = '<div className="test">Hello World</div>'
            const testComponent = `
              const TestComponent = () => {
                return (${testCode});
              };
            `
            const testTransformed = (window as any).Babel.transform(testComponent, {
              presets: ['react']
            }).code
            console.log('Babel test successful:', testTransformed.substring(0, 100))
          } catch (testError) {
            console.error('Babel test failed:', testError)
          }
        }

        // Create a dynamic component from the AI-generated code
        const dynamicComponent = await createDynamicComponent(cleanCode)
        setComponent(() => dynamicComponent)
      } catch (err) {
        console.error('Error rendering UI:', err)
        setError(err instanceof Error ? err.message : 'Failed to render component')
      } finally {
        setIsLoading(false)
      }
    }

    renderComponent()
  }, [code])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Generating UI...</h2>
          <p className="text-gray-500">AI is creating your design</p>
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
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No UI Generated</h2>
          <p className="text-gray-500">Enter a prompt to generate your UI</p>
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


interface PreviewCanvasProps {
  schema: UISchema | null
  mode: 'preview' | 'edit'
  onSchemaUpdate: (schema: UISchema) => void
  sessionId?: string | null
  onSketchAnalyzed?: (sketchId: string, analysis: any) => void
}

export default function PreviewCanvas({ schema, mode, onSchemaUpdate, sessionId, onSketchAnalyzed }: PreviewCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawings, setDrawings] = useState<any[]>([])
  const [showSchemaOverlay, setShowSchemaOverlay] = useState(false)
  const [showFunctionModal, setShowFunctionModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<UISchemaNode | null>(null)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [helpContext, setHelpContext] = useState('')
  const [schemaEditor, setSchemaEditor] = useState<SchemaEditor | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [exportedSketch, setExportedSketch] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: any) => {
      setExportedSketch(e.detail?.dataUrl || null)
    }
    window.addEventListener('inkwell-penoverlay-export' as any, handler)
    return () => window.removeEventListener('inkwell-penoverlay-export' as any, handler)
  }, [])

  const handleDrawingComplete = (drawingData: any) => {
    const newDrawings = [...drawings, drawingData]
    setDrawings(newDrawings)
    // Store drawings in localStorage for backward compatibility
    localStorage.setItem('inkwell-drawings', JSON.stringify(newDrawings))
  }

  const handleSketchAnalyzed = (sketchId: string, analysis: any) => {
    if (onSketchAnalyzed) {
      onSketchAnalyzed(sketchId, analysis)
    }
  }

  const clearDrawings = () => {
    setDrawings([])
    // Also clear from sketch store if session exists
    if (sessionId) {
      const { sketchStore } = require('@/lib/sketchStore')
      sketchStore.clearSketches()
    }
  }

  // Initialize schema editor when schema changes
  useEffect(() => {
    if (schema) {
      const editor = new SchemaEditor(schema)
      setSchemaEditor(editor)
    }
  }, [schema])

  const handleComponentSelected = async (node: UISchemaNode, bounds: DOMRect) => {
    try {
      setSelectedNode(node)
      setShowFunctionModal(true)
    } catch (error) {
      console.error('Error handling component selection:', error)
      setHelpContext(`I couldn't process the ${node.type} component. ${node.function}`)
      setShowHelpDialog(true)
    }
  }

  const handleFunctionSave = async (nodeId: string, function_: string, description?: string) => {
    try {
      if (!schemaEditor) {
        throw new Error('Schema editor not initialized')
      }

      // Update the function in the schema
      const result = schemaEditor.updateFunction(nodeId, function_)
      
      if (result.success) {
        // Update the schema
        const updatedSchema = result.updatedSchema
        setSchema(updatedSchema)
        onSchemaUpdate(updatedSchema)
        
        // Store in sketch store if session exists
        if (sessionId) {
          const { sketchStore } = require('@/lib/sketchStore')
          sketchStore.updateGeneratedCode(JSON.stringify(updatedSchema))
        }
        
        console.log('Function updated successfully:', result.changes)
      } else {
        throw new Error(result.warnings.join(', '))
      }
    } catch (error) {
      console.error('Error updating function:', error)
      setHelpContext(`I couldn't update the function for ${nodeId}. ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowHelpDialog(true)
    }
  }

  const handleHelpProvided = async (helpText: string) => {
    try {
      // Attempt schema edit via API with user clarification
      if (!schema) return
      const res = await fetch('/api/schema-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, instruction: helpText })
      })
      const data = await res.json()
      if (res.ok && data.schema) {
        onSchemaUpdate(data.schema)
        setShowHelpDialog(false)
      }
    } catch (error) {
      console.error('Error processing help:', error)
    }
  }

  // Toggle schema overlay when edit mode changes
  useEffect(() => {
    setShowSchemaOverlay(mode === 'edit')
  }, [mode])

  // If we have an exported sketch, send it to Gemini with current schema as multimodal edit
  useEffect(() => {
    const run = async () => {
      if (!exportedSketch || !schema) return
      try {
        const res = await fetch('/api/schema-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema, instruction: 'Update schema per sketch overlay.', sketchBase64: exportedSketch })
        })
        const data = await res.json()
        if (res.ok && data.schema) {
          onSchemaUpdate(data.schema)
          setExportedSketch(null)
        } else if (data?.needsHelp) {
          setHelpContext("I couldn’t process this. Please describe what this element should do.")
          setShowHelpDialog(true)
        }
      } catch (err) {
        setHelpContext("I couldn’t process this. Please describe what this element should do.")
        setShowHelpDialog(true)
      }
    }
    run()
  }, [exportedSketch, schema, onSchemaUpdate])

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          {mode === 'preview' ? (
            <Eye className="h-5 w-5 text-blue-600" />
          ) : (
            <Edit3 className="h-5 w-5 text-purple-600" />
          )}
          <h2 className="text-lg font-semibold">
            {mode === 'preview' ? 'Preview Mode' : 'Edit Mode'}
          </h2>
        </div>
        
        {mode === 'edit' && (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={clearDrawings}>
              Clear Drawings
            </Button>
          </div>
        )}
      </div>

      {/* Canvas Container */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full relative">
          <div 
            ref={canvasRef}
            className="w-full h-full overflow-auto bg-white"
          >
            {/* Rendered UI */}
            <div className="w-full min-h-full">
              {schema ? (
                <SchemaRenderer schema={schema} isEditing={mode === 'edit'} />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No UI Schema</h2>
                    <p className="text-gray-500">Generate a schema to render the UI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Drawing Overlay */}
          {mode === 'edit' && (
            <div 
              ref={overlayRef}
              className="absolute inset-0 pointer-events-auto"
            >
              <PenOverlay
                onDrawingComplete={handleDrawingComplete}
                drawings={drawings}
                isDrawing={isDrawing}
                onDrawingChange={setIsDrawing}
                sessionId={sessionId || undefined}
                onSketchAnalyzed={handleSketchAnalyzed}
              />
            </div>
          )}
          
          {/* Schema Overlay */}
          {schema && (
            <SchemaOverlay
              isActive={showSchemaOverlay}
              schema={schema.root}
              onComponentSelected={handleComponentSelected}
              onClose={() => setShowSchemaOverlay(false)}
            />
          )}
          
          {/* Function Definition Modal */}
          <SchemaFunctionModal
            isOpen={showFunctionModal}
            node={selectedNode}
            onClose={() => {
              setShowFunctionModal(false)
              setSelectedNode(null)
            }}
            onSave={handleFunctionSave}
          />
          
          {/* Help Dialog */}
          <HelpDialog
            isOpen={showHelpDialog}
            onClose={() => setShowHelpDialog(false)}
            onHelpProvided={handleHelpProvided}
            context={helpContext}
          />
        </CardContent>
      </Card>
    </div>
  )
}
