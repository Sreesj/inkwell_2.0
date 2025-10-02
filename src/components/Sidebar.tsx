'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Wand2,
  FileText,
  Lightbulb
} from 'lucide-react'

interface SidebarProps {
  mode: 'preview' | 'edit'
  onApplyChanges: (changes: any) => void
  sessionId?: string | null
  sketchAnalysis?: any[]
  pendingActions?: any[]
  onActionsGenerated?: (actions: any[]) => void
}

interface AIAction {
  id: string
  type: 'generation' | 'analysis' | 'suggestion' | 'validation'
  message: string
  timestamp: Date
  status: 'pending' | 'completed' | 'error'
}

export function Sidebar({ mode, onApplyChanges, sessionId, sketchAnalysis = [], pendingActions = [], onActionsGenerated }: SidebarProps) {
  const [actions, setActions] = useState<AIAction[]>([
    {
      id: '1',
      type: 'generation',
      message: 'Generated initial UI layout from prompt',
      timestamp: new Date(),
      status: 'completed'
    }
  ])

  const [isProcessing, setIsProcessing] = useState(false)

  const handleApplyChanges = async () => {
    if (!sessionId) return
    
    setIsProcessing(true)
    
    // Add analysis action
    const analysisAction: AIAction = {
      id: Date.now().toString(),
      type: 'analysis',
      message: 'Analyzing sketches and generating action plan...',
      timestamp: new Date(),
      status: 'pending'
    }
    setActions(prev => [...prev, analysisAction])

    try {
      // Import required modules
      const { sketchStore } = await import('@/lib/sketchStore')
      const { analyzeAllSketches, generateActionPlan } = await import('@/lib/ai/sketchAnalysis')
      const { executeActionPlan } = await import('@/lib/ai/actionExecutor')
      
      // Get current session
      const session = sketchStore.getCurrentSession()
      if (!session) {
        throw new Error('No active session found')
      }
      
      // Get unanalyzed sketches
      const unanalyzedSketches = session.sketches.filter(sketch => !sketch.description)
      
      if (unanalyzedSketches.length === 0) {
        setActions(prev => prev.map(action => 
          action.id === analysisAction.id 
            ? { ...action, status: 'completed', message: 'All sketches already analyzed' }
            : action
        ))
        setIsProcessing(false)
        return
      }
      
      // Analyze all sketches
      const analyses = await analyzeAllSketches(unanalyzedSketches, {
        currentCode: session.generatedCode,
        originalPrompt: session.prompt,
        canvasSize: { width: 800, height: 600 },
        existingSketches: session.sketches
      })
      
      // Update sketches with analysis
      analyses.forEach((analysis, index) => {
        if (unanalyzedSketches[index]) {
          sketchStore.updateSketchDescription(
            unanalyzedSketches[index].id, 
            analysis.description, 
            analysis.action
          )
        }
      })
      
      setActions(prev => prev.map(action => 
        action.id === analysisAction.id 
          ? { ...action, status: 'completed', message: `Analyzed ${analyses.length} sketches` }
          : action
      ))

      // Generate action plan
      const actionPlan = await generateActionPlan(analyses, {
        currentCode: session.generatedCode,
        originalPrompt: session.prompt,
        canvasSize: { width: 800, height: 600 },
        existingSketches: session.sketches
      })
      
      // Add actions to store
      const actionIds = actionPlan.map(action => 
        sketchStore.addAction(action)
      )
      
      // Notify parent of generated actions
      if (onActionsGenerated) {
        onActionsGenerated(actionPlan)
      }
      
      // Add execution action
      const execAction: AIAction = {
        id: (Date.now() + 2).toString(),
        type: 'generation',
        message: `Executing ${actionPlan.length} actions...`,
        timestamp: new Date(),
        status: 'pending'
      }
      setActions(prev => [...prev, execAction])

      // Execute the action plan
      const results = await executeActionPlan(actionPlan, {
        currentCode: session.generatedCode,
        originalPrompt: session.prompt
      })
      
      // Update session with final code if successful
      const successfulResults = results.filter(r => r.success)
      if (successfulResults.length > 0) {
        const finalResult = successfulResults[successfulResults.length - 1]
        if (finalResult.updatedCode) {
          sketchStore.updateGeneratedCode(finalResult.updatedCode)
          localStorage.setItem('inkwell-current-code', finalResult.updatedCode)
        }
      }
      
      setActions(prev => prev.map(action => 
        action.id === execAction.id 
          ? { ...action, status: 'completed', message: `Executed ${successfulResults.length}/${results.length} actions successfully` }
          : action
      ))

      // Update action statuses
      actionIds.forEach((actionId, index) => {
        sketchStore.updateActionStatus(actionId, results[index].success ? 'completed' : 'failed')
      })
      
      setIsProcessing(false)
      
      // Notify parent component of changes
      const lastSuccessfulResult = successfulResults[successfulResults.length - 1]
      if (lastSuccessfulResult && lastSuccessfulResult.updatedCode) {
        onApplyChanges({ 
          type: 'regeneration', 
          success: true, 
          newCode: lastSuccessfulResult.updatedCode,
          changes: lastSuccessfulResult.changes,
          newPages: lastSuccessfulResult.newPages
        })
      }
      
    } catch (error) {
      console.error('Error processing changes:', error)
      setActions(prev => prev.map(action => 
        action.id === analysisAction.id 
          ? { ...action, status: 'error', message: 'Failed to process sketches' }
          : action
      ))
      setIsProcessing(false)
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'generation':
        return <Sparkles className="h-4 w-4" />
      case 'analysis':
        return <MessageSquare className="h-4 w-4" />
      case 'suggestion':
        return <Lightbulb className="h-4 w-4" />
      case 'validation':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <p className="text-sm text-gray-600">
          {mode === 'preview' ? 'View your generated UI' : 'Edit mode active - draw to make changes'}
        </p>
      </div>

      {/* Apply Changes Button */}
      {mode === 'edit' && (
        <div className="p-4 border-b">
          <Button 
            onClick={handleApplyChanges}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isProcessing ? (
              <>
                <Wand2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Apply Changes
              </>
            )}
          </Button>
        </div>
      )}

      {/* AI Actions Log */}
      <div className="flex-1 p-4">
        <h4 className="font-semibold mb-3">Activity Log</h4>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {actions.map((action) => (
              <Card key={action.id} className="p-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="secondary" className={getStatusColor(action.status)}>
                        {action.type}
                      </Badge>
                      {getStatusIcon(action.status)}
                    </div>
                    <p className="text-sm text-gray-700">{action.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {action.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold mb-3">Pending Actions</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {pendingActions.map((action, index) => (
                <Card key={index} className="p-3 bg-purple-50 border-purple-200">
                  <div className="flex items-start space-x-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      action.status === 'pending' ? 'bg-yellow-500' :
                      action.status === 'completed' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900">{action.description}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {action.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Sketch Analysis */}
      {sketchAnalysis.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold mb-3">Recent Analysis</h4>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {sketchAnalysis.slice(-3).map((item, index) => (
                <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900">{item.analysis.description}</p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs mt-1 ${
                          item.analysis.action === 'add_component' ? 'bg-green-100 text-green-800' :
                          item.analysis.action === 'modify_component' ? 'bg-blue-100 text-blue-800' :
                          item.analysis.action === 'add_page' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.analysis.action?.replace('_', ' ') || 'note'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* AI Suggestions */}
      <div className="p-4">
        <h4 className="font-semibold mb-3">Suggestions</h4>
        <div className="space-y-2">
          <Card className="p-3 bg-green-50 border-green-200">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Enhanced Drawing Tools</p>
                <p className="text-xs text-green-700">Use rectangles and highlights for better component definition</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Persistent Sketches</p>
                <p className="text-xs text-blue-700">Your sketches are automatically saved and analyzed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
