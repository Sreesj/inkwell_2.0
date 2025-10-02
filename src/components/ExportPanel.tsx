'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Github, 
  Code, 
  FileText, 
  CheckCircle,
  ExternalLink,
  Copy,
  Package
} from 'lucide-react'

export function ExportPanel() {
  const [exportFormat, setExportFormat] = useState<'react' | 'html' | 'github'>('react')
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDownload = async (format: string) => {
    setIsExporting(true)
    setExportStatus('idle')

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock download functionality
      const mockCode = generateMockCode(format)
      const blob = new Blob([mockCode], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inkwell-export.${format === 'react' ? 'tsx' : 'html'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setExportStatus('success')
    } catch (error) {
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleGitHubPush = async () => {
    setIsExporting(true)
    setExportStatus('idle')

    try {
      // Simulate GitHub push
      await new Promise(resolve => setTimeout(resolve, 3000))
      setExportStatus('success')
    } catch (error) {
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  const generateMockCode = (format: string) => {
    if (format === 'react') {
      return `import React from 'react'

export default function GeneratedUI() {
  return (
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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Build amazing things with our tools
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
            Start Building
          </button>
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
  )
}`
    } else {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold text-gray-900">My App</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <button class="text-gray-500 hover:text-gray-700">Features</button>
                        <button class="text-gray-500 hover:text-gray-700">Pricing</button>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </nav>
        
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="text-center">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">
                    Welcome to Our Platform
                </h1>
                <p class="text-xl text-gray-600 mb-8">
                    Build amazing things with our tools
                </p>
                <button class="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700">
                    Start Building
                </button>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8 mt-16">
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold mb-2">Feature 1</h3>
                    <p class="text-gray-600">Description of the first feature</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold mb-2">Feature 2</h3>
                    <p class="text-gray-600">Description of the second feature</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <h3 class="text-lg font-semibold mb-2">Feature 3</h3>
                    <p class="text-gray-600">Description of the third feature</p>
                </div>
            </div>
        </main>
    </div>
</body>
</html>`
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="react" className="flex items-center">
            <Code className="mr-2 h-4 w-4" />
            React/TSX
          </TabsTrigger>
          <TabsTrigger value="html" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="github" className="flex items-center">
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="react" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-5 w-5" />
                React/TypeScript Export
              </CardTitle>
              <CardDescription>
                Download your UI as a React component with TypeScript and Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Generated Component</h4>
                  <p className="text-sm text-gray-600">Ready-to-use React component</p>
                </div>
                <Badge variant="secondary">TypeScript</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Tailwind CSS</h4>
                  <p className="text-sm text-gray-600">All styles included</p>
                </div>
                <Badge variant="secondary">CSS</Badge>
              </div>

              <Button 
                onClick={() => handleDownload('react')}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Package className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download React Component
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                HTML Export
              </CardTitle>
              <CardDescription>
                Download as standalone HTML file with embedded Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">Standalone HTML</h4>
                  <p className="text-sm text-gray-600">No build process required</p>
                </div>
                <Badge variant="secondary">HTML</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">CDN Tailwind</h4>
                  <p className="text-sm text-gray-600">Styles loaded from CDN</p>
                </div>
                <Badge variant="secondary">CDN</Badge>
              </div>

              <Button 
                onClick={() => handleDownload('html')}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Package className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download HTML File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="github" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Github className="mr-2 h-5 w-5" />
                GitHub Repository
              </CardTitle>
              <CardDescription>
                Push your UI to a new GitHub repository for deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Next.js Project</h4>
                    <p className="text-sm text-gray-600">Complete Next.js setup</p>
                  </div>
                  <Badge variant="secondary">Next.js</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">Vercel Ready</h4>
                    <p className="text-sm text-gray-600">One-click deployment</p>
                  </div>
                  <Badge variant="secondary">Deploy</Badge>
                </div>
              </div>

              <Button 
                onClick={handleGitHubPush}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Github className="mr-2 h-4 w-4 animate-spin" />
                    Pushing to GitHub...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Push to GitHub
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Status */}
      {exportStatus === 'success' && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Export completed successfully!
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {exportStatus === 'error' && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Export failed. Please try again.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
