'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pen, Circle, ArrowRight, Type, Eraser, Save, Square, Highlighter, Eye, EyeOff } from 'lucide-react'
import { sketchStore, SketchElement } from '@/lib/sketchStore'

interface Drawing {
  id: string
  type: 'pen' | 'circle' | 'arrow' | 'text' | 'rectangle' | 'highlight'
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  text?: string
  position?: { x: number; y: number }
  timestamp?: number
  sessionId?: string
  description?: string
  action?: 'add_component' | 'modify_component' | 'add_page' | 'highlight' | 'note'
}

interface PenOverlayProps {
  onDrawingComplete: (drawing: Drawing) => void
  drawings: Drawing[]
  isDrawing: boolean
  onDrawingChange: (isDrawing: boolean) => void
  sessionId?: string
  onSketchAnalyzed?: (sketchId: string, analysis: any) => void
}

export function PenOverlay({ onDrawingComplete, drawings, isDrawing, onDrawingChange, sessionId, onSketchAnalyzed }: PenOverlayProps) {
  const [currentTool, setCurrentTool] = useState<'pen' | 'circle' | 'arrow' | 'text' | 'eraser' | 'rectangle' | 'highlight'>('pen')
  const [currentColor, setCurrentColor] = useState('#3b82f6')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [analyzedSketches, setAnalyzedSketches] = useState<Set<string>>(new Set())
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const exportCanvasToPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    try {
      return canvas.toDataURL('image/png')
    } catch (e) {
      return null
    }
  }, [])

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#fbbf24', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ]

  // Load existing sketches from store on mount
  useEffect(() => {
    if (sessionId) {
      const session = sketchStore.getCurrentSession()
      if (session) {
        // Convert SketchElements to Drawings for compatibility
        const existingDrawings = session.sketches.map((sketch: SketchElement) => ({
          id: sketch.id,
          type: sketch.type,
          points: sketch.points,
          color: sketch.color,
          strokeWidth: sketch.strokeWidth,
          text: sketch.text,
          position: sketch.position,
          timestamp: sketch.timestamp,
          sessionId: sketch.sessionId,
          description: sketch.description,
          action: sketch.action
        }))
        
        // Update drawings state with existing sketches
        existingDrawings.forEach(drawing => {
          onDrawingComplete(drawing)
        })
      }
    }
  }, [sessionId, onDrawingComplete])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw all drawings
    drawings.forEach(drawing => {
      drawShape(ctx, drawing)
    })

    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = currentColor
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(currentPath[0].x, currentPath[0].y)
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y)
      }
      ctx.stroke()
    }
  }, [drawings, currentPath, currentColor, strokeWidth])

  const drawShape = (ctx: CanvasRenderingContext2D, drawing: Drawing) => {
    ctx.strokeStyle = drawing.color
    ctx.lineWidth = drawing.strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (drawing.type === 'pen') {
      ctx.beginPath()
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      ctx.stroke()
    } else if (drawing.type === 'circle') {
      const center = drawing.points[0]
      const radius = Math.sqrt(
        Math.pow(drawing.points[1].x - center.x, 2) + 
        Math.pow(drawing.points[1].y - center.y, 2)
      )
      ctx.beginPath()
      ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (drawing.type === 'arrow') {
      const start = drawing.points[0]
      const end = drawing.points[1]
      
      // Draw line
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
      
      // Draw arrowhead
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const arrowLength = 15
      const arrowAngle = Math.PI / 6
      
      ctx.beginPath()
      ctx.moveTo(end.x, end.y)
      ctx.lineTo(
        end.x - arrowLength * Math.cos(angle - arrowAngle),
        end.y - arrowLength * Math.sin(angle - arrowAngle)
      )
      ctx.moveTo(end.x, end.y)
      ctx.lineTo(
        end.x - arrowLength * Math.cos(angle + arrowAngle),
        end.y - arrowLength * Math.sin(angle + arrowAngle)
      )
      ctx.stroke()
    } else if (drawing.type === 'text' && drawing.text && drawing.position) {
      ctx.fillStyle = drawing.color
      ctx.font = `${drawing.strokeWidth * 4}px Arial`
      ctx.fillText(drawing.text, drawing.position.x, drawing.position.y)
    }
  }

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'text') {
      const pos = getMousePos(e)
      setTextPosition(pos)
      setShowTextInput(true)
      return
    }

    if (currentTool === 'eraser') {
      // Handle eraser logic
      return
    }

    const pos = getMousePos(e)
    setIsDrawingActive(true)
    setCurrentPath([pos])
    onDrawingChange(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingActive || currentTool === 'text' || currentTool === 'eraser') return

    const pos = getMousePos(e)
    setCurrentPath(prev => [...prev, pos])
  }

  const handleMouseUp = () => {
    if (!isDrawingActive) return

    setIsDrawingActive(false)
    onDrawingChange(false)

    if (currentPath.length > 1) {
      const drawing: Drawing = {
        id: Date.now().toString(),
        type: currentTool as 'pen' | 'circle' | 'arrow' | 'rectangle' | 'highlight',
        points: [...currentPath],
        color: currentColor,
        strokeWidth: strokeWidth,
        timestamp: Date.now(),
        sessionId: sessionId
      }
      
      // Save to persistent store
      if (sessionId) {
        sketchStore.addSketch(drawing)
      }
      
      onDrawingComplete(drawing)
      
      // Auto-analyze sketch if not already analyzed
      if (!analyzedSketches.has(drawing.id)) {
        setTimeout(() => {
          analyzeSketch(drawing)
        }, 1000)
      }
    }

    setCurrentPath([])
  }

  const analyzeSketch = async (drawing: Drawing) => {
    if (!sessionId || analyzedSketches.has(drawing.id)) return

    try {
      const session = sketchStore.getCurrentSession()
      if (!session) return

      // Import analysis function
      const { analyzeSketch: analyzeSketchFn } = await import('@/lib/ai/sketchAnalysis')
      
      const analysis = await analyzeSketchFn(drawing as SketchElement, {
        currentCode: session.generatedCode,
        originalPrompt: session.prompt,
        canvasSize: { width: 800, height: 600 },
        existingSketches: session.sketches
      })

      // Update sketch with analysis
      sketchStore.updateSketchDescription(drawing.id, analysis.description, analysis.action)
      
      // Mark as analyzed
      setAnalyzedSketches(prev => new Set([...prev, drawing.id]))
      
      // Notify parent component
      if (onSketchAnalyzed) {
        onSketchAnalyzed(drawing.id, analysis)
      }
    } catch (error) {
      console.error('Error analyzing sketch:', error)
    }
  }

  const handleTextSubmit = () => {
    if (textInput.trim() && textPosition) {
      const drawing: Drawing = {
        id: Date.now().toString(),
        type: 'text',
        points: [],
        color: currentColor,
        strokeWidth: strokeWidth,
        text: textInput,
        position: textPosition
      }
      onDrawingComplete(drawing)
    }
    setTextInput('')
    setShowTextInput(false)
    setTextPosition(null)
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-2 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Button
              variant={currentTool === 'pen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('pen')}
              className={currentTool === 'pen' ? 'bg-blue-600 text-white' : ''}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('circle')}
              className={currentTool === 'circle' ? 'bg-blue-600 text-white' : ''}
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('rectangle')}
              className={currentTool === 'rectangle' ? 'bg-blue-600 text-white' : ''}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'arrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('arrow')}
              className={currentTool === 'arrow' ? 'bg-blue-600 text-white' : ''}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'highlight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('highlight')}
              className={currentTool === 'highlight' ? 'bg-blue-600 text-white' : ''}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('text')}
              className={currentTool === 'text' ? 'bg-blue-600 text-white' : ''}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={currentTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentTool('eraser')}
              className={currentTool === 'eraser' ? 'bg-blue-600 text-white' : ''}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataUrl = exportCanvasToPng()
                if (dataUrl) {
                  const event = new CustomEvent('inkwell-penoverlay-export', { detail: { dataUrl } })
                  window.dispatchEvent(event)
                }
              }}
            >
              Export Sketch
            </Button>
          </div>
        </Card>
      </div>

      {/* Color Palette */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-2 bg-white/90 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            {colors.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                  currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Sketch Analysis Panel */}
      {showAnalysis && drawings.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm">
          <Card className="p-3 bg-white/95 backdrop-blur-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">AI Analysis</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnalysis(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {drawings
                .filter(drawing => drawing.description)
                .slice(-3)
                .map((drawing) => (
                  <div key={drawing.id} className="text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${
                          drawing.action === 'add_component' ? 'bg-green-100 text-green-800' :
                          drawing.action === 'modify_component' ? 'bg-blue-100 text-blue-800' :
                          drawing.action === 'add_page' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {drawing.action?.replace('_', ' ') || 'note'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {drawing.description}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Show Analysis Toggle */}
      {!showAnalysis && drawings.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(true)}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show Analysis ({drawings.filter(d => d.description).length})
          </Button>
        </div>
      )}

      {/* Stroke Width */}
      {!showAnalysis && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="p-2 bg-white/90 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Width:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-6 font-mono">{strokeWidth}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <Card className="p-4 w-80">
            <div className="space-y-4">
              <h3 className="font-semibold">Add Text Note</h3>
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter your note..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit()
                  } else if (e.key === 'Escape') {
                    setShowTextInput(false)
                    setTextInput('')
                    setTextPosition(null)
                  }
                }}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowTextInput(false)
                  setTextInput('')
                  setTextPosition(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleTextSubmit}>Add</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
