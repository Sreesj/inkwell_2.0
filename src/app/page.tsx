'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Palette, Code, Download } from 'lucide-react'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    // Store the prompt in localStorage for the preview page
    localStorage.setItem('inkwell-prompt', prompt)
    
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false)
      router.push('/preview')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold ml-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inkwell
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your ideas into beautiful UIs with AI. Sketch, edit, and export your designs in minutes.
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="max-w-4xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-gray-800">Describe Your UI</CardTitle>
            <CardDescription className="text-lg">
              Tell us what you want to build and we'll create it for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              placeholder="e.g., Create a modern landing page for a SaaS product with a hero section, features grid, pricing table, and footer. Use a blue and white color scheme with rounded corners and soft shadows."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] text-lg resize-none border-2 border-gray-200 focus:border-purple-400 rounded-xl"
            />
            <div className="flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating UI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate UI
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Design</h3>
            <p className="text-gray-600">
              Generate complete UI layouts from simple text descriptions using advanced AI
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sketch & Edit</h3>
            <p className="text-gray-600">
              Draw over your UI to make changes. AI understands your sketches and updates the design
            </p>
          </Card>

          <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full w-fit mx-auto mb-4">
              <Download className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export & Deploy</h3>
            <p className="text-gray-600">
              Download clean React/Tailwind code or push directly to GitHub for deployment
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
