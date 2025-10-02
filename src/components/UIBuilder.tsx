'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Edit3, Download, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import PreviewCanvas from './PreviewCanvas'
import { Sidebar } from './Sidebar'
import { UISchema } from '@/lib/uiSchema'
import { SchemaEditor } from '@/lib/schemaEditor'

export function UIBuilder() {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [schema, setSchema] = useState<UISchema | null>(null)
  const [schemaEditor, setSchemaEditor] = useState<SchemaEditor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sketchAnalysis, setSketchAnalysis] = useState<any[]>([])
  const [pendingActions, setPendingActions] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    // Get the prompt from localStorage and generate initial UI
    const prompt = localStorage.getItem('inkwell-prompt')
    if (prompt) {
      generateInitialUI(prompt)
    } else {
      // If no prompt, redirect back to home
      router.push('/')
    }
  }, [router])

  const generateInitialUI = async (prompt: string) => {
    setIsLoading(true)
    try {
      // Use schema-first generation
      const { generateUISchema } = await import('@/lib/ai/schemaGeneration')
      const result = await generateUISchema({
        prompt,
        style: 'modern',
        colorScheme: 'blue and white',
        layout: 'single-page'
      })
      
      setSchema(result.schema)
      setErrorMsg(null)
      
      // Create schema editor
      const editor = new SchemaEditor(result.schema)
      setSchemaEditor(editor)
      
      // Create a new sketch session
      const { sketchStore } = await import('@/lib/sketchStore')
      const newSessionId = sketchStore.createSession(prompt, result.jsx)
      setSessionId(newSessionId)
      
      // Store the generated schema in localStorage
      localStorage.setItem('inkwell-current-schema', JSON.stringify(result.schema))
    } catch (error) {
      console.error('Error generating UI schema:', error)
      const message = error instanceof Error ? error.message : 'Failed to generate UI schema.'
      setErrorMsg(message)
      setSchema(null)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockUI = (prompt: string) => {
    // Generate a mock UI based on the prompt
    return `
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">My App</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700">Features</button>
                <button className="text-gray-500 hover:text-gray-700">Pricing</button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Get Started</button>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Our Platform</h1>
            <p className="text-xl text-gray-600 mb-8">Build amazing things with our tools</p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">Start Building</button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Feature 1</h3>
              <p className="text-gray-600">Description of the first feature</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Feature 2</h3>
              <p className="text-gray-600">Description of the second feature</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Feature 3</h3>
              <p className="text-gray-600">Description of the third feature</p>
            </div>
          </div>
        </main>
      </div>
    `
  }

  const handleExport = () => {
    router.push('/export')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Generating Your UI</h2>
            <p className="text-gray-600">AI is creating your design...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 max-w-lg">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-700">Generation failed</h2>
            <p className="text-gray-700 break-words">{errorMsg}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => generateInitialUI(localStorage.getItem('inkwell-prompt') || '')}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>Change Prompt</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Inkwell Builder</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Tabs value={mode} onValueChange={(value) => setMode(value as 'preview' | 'edit')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview" className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="edit" className="flex items-center">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Preview Canvas */}
        <div className="flex-1 p-6">
          <PreviewCanvas 
            schema={schema}
            mode={mode}
            onSchemaUpdate={setSchema}
            sessionId={sessionId}
            onSketchAnalyzed={(sketchId, analysis) => {
              setSketchAnalysis(prev => [...prev, { sketchId, analysis }])
            }}
          />
        </div>
        
        {/* Sidebar */}
        <div className="w-80 border-l bg-white/50 backdrop-blur-sm">
          <Sidebar 
            mode={mode}
            sessionId={sessionId}
            sketchAnalysis={sketchAnalysis}
            pendingActions={pendingActions}
            onApplyChanges={(changes) => {
              // Handle applying changes from edit mode
              if (changes.type === 'regeneration' && changes.success && changes.newCode) {
                setGeneratedCode(changes.newCode)
                // Update the session with new code
                if (sessionId) {
                  const { sketchStore } = require('@/lib/sketchStore')
                  sketchStore.updateGeneratedCode(changes.newCode)
                }
              }
            }}
            onActionsGenerated={(actions) => {
              setPendingActions(actions)
            }}
          />
        </div>
      </div>
    </div>
  )
}
