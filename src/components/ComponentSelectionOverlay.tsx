'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Edit3, Type, Square, Circle, Image, Navigation, MousePointer } from 'lucide-react'

interface ComponentInfo {
  id: string
  type: 'button' | 'navbar-item' | 'card' | 'text-block' | 'image' | 'navigation' | 'hero-section' | 'unknown'
  element: HTMLElement
  bounds: DOMRect
  description?: string
}

interface ComponentSelectionOverlayProps {
  isActive: boolean
  onComponentSelected: (component: ComponentInfo) => void
  onClose: () => void
}

export function ComponentSelectionOverlay({ isActive, onComponentSelected, onClose }: ComponentSelectionOverlayProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [showFunctionModal, setShowFunctionModal] = useState(false)
  const [componentFunction, setComponentFunction] = useState('')
  const [componentDescription, setComponentDescription] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  // Component type detection based on element properties
  const detectComponentType = useCallback((element: HTMLElement): ComponentInfo['type'] => {
    const tagName = element.tagName.toLowerCase()
    const className = element.className.toLowerCase()
    const textContent = element.textContent?.toLowerCase() || ''
    
    // Check for specific component patterns
    if (tagName === 'button' || className.includes('button') || className.includes('btn')) {
      return 'button'
    }
    
    if (tagName === 'nav' || className.includes('nav') || className.includes('menu')) {
      return 'navigation'
    }
    
    if (tagName === 'a' && (className.includes('nav') || className.includes('menu'))) {
      return 'navbar-item'
    }
    
    if (tagName === 'img' || className.includes('image')) {
      return 'image'
    }
    
    if (className.includes('card') || className.includes('product')) {
      return 'card'
    }
    
    if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'p') {
      return 'text-block'
    }
    
    if (className.includes('hero') || className.includes('banner')) {
      return 'hero-section'
    }
    
    return 'unknown'
  }, [])

  // Get component icon based on type
  const getComponentIcon = (type: ComponentInfo['type']) => {
    switch (type) {
      case 'button':
        return <MousePointer className="h-4 w-4" />
      case 'navbar-item':
      case 'navigation':
        return <Navigation className="h-4 w-4" />
      case 'card':
        return <Square className="h-4 w-4" />
      case 'text-block':
        return <Type className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'hero-section':
        return <Circle className="h-4 w-4" />
      default:
        return <Edit3 className="h-4 w-4" />
    }
  }

  // Handle mouse move to highlight hovered elements
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return
    
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    if (!element || element === overlayRef.current) return
    
    // Find the most specific selectable element
    let selectableElement = element
    while (selectableElement && selectableElement !== document.body) {
      if (selectableElement.tagName && 
          !selectableElement.classList.contains('component-selection-overlay') &&
          !selectableElement.closest('.component-selection-overlay')) {
        break
      }
      selectableElement = selectableElement.parentElement as HTMLElement
    }
    
    if (selectableElement && selectableElement !== hoveredElement) {
      setHoveredElement(selectableElement)
    }
  }, [isActive, hoveredElement])

  // Handle click to select component
  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    if (!element || element === overlayRef.current) return
    
    // Find the most specific selectable element
    let selectableElement = element
    while (selectableElement && selectableElement !== document.body) {
      if (selectableElement.tagName && 
          !selectableElement.classList.contains('component-selection-overlay') &&
          !selectableElement.closest('.component-selection-overlay')) {
        break
      }
      selectableElement = selectableElement.parentElement as HTMLElement
    }
    
    if (selectableElement) {
      const bounds = selectableElement.getBoundingClientRect()
      const componentType = detectComponentType(selectableElement)
      
      const componentInfo: ComponentInfo = {
        id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: componentType,
        element: selectableElement,
        bounds,
        description: selectableElement.textContent?.slice(0, 100) || 'Component'
      }
      
      setSelectedComponent(componentInfo)
      setShowFunctionModal(true)
    }
  }, [isActive, detectComponentType])

  // Handle function submission
  const handleFunctionSubmit = () => {
    if (selectedComponent && componentFunction.trim()) {
      const updatedComponent = {
        ...selectedComponent,
        description: componentDescription || componentFunction
      }
      onComponentSelected(updatedComponent)
      setShowFunctionModal(false)
      setComponentFunction('')
      setComponentDescription('')
      setSelectedComponent(null)
    }
  }

  // Add event listeners when active
  useEffect(() => {
    if (isActive) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('click', handleClick)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('click', handleClick)
      }
    }
  }, [isActive, handleMouseMove, handleClick])

  if (!isActive) return null

  return (
    <>
      {/* Selection Overlay */}
      <div
        ref={overlayRef}
        className="component-selection-overlay fixed inset-0 z-50 pointer-events-auto"
        style={{ background: 'rgba(59, 130, 246, 0.1)' }}
      >
        {/* Hover Highlight */}
        {hoveredElement && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none transition-all duration-150"
            style={{
              left: hoveredElement.getBoundingClientRect().left,
              top: hoveredElement.getBoundingClientRect().top,
              width: hoveredElement.getBoundingClientRect().width,
              height: hoveredElement.getBoundingClientRect().height,
            }}
          />
        )}
        
        {/* Selected Component Highlight */}
        {selectedComponent && (
          <div
            className="absolute border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
            style={{
              left: selectedComponent.bounds.left,
              top: selectedComponent.bounds.top,
              width: selectedComponent.bounds.width,
              height: selectedComponent.bounds.height,
            }}
          />
        )}
        
        {/* Instructions */}
        <div className="absolute top-4 left-4 z-10">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Edit Mode</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Click on any component to edit its function
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Exit Edit Mode
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Function Definition Modal */}
      {showFunctionModal && selectedComponent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getComponentIcon(selectedComponent.type)}
                  <h3 className="font-semibold text-gray-900">
                    Define Component Function
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowFunctionModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Type
                  </label>
                  <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                    {getComponentIcon(selectedComponent.type)}
                    <span className="capitalize">{selectedComponent.type.replace('-', ' ')}</span>
                  </Badge>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What is the function of this element?
                  </label>
                  <Input
                    placeholder="e.g., Primary call-to-action button, Navigation menu, Product card..."
                    value={componentFunction}
                    onChange={(e) => setComponentFunction(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe what this component should do or contain..."
                    value={componentDescription}
                    onChange={(e) => setComponentDescription(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowFunctionModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleFunctionSubmit}
                    disabled={!componentFunction.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save & Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
