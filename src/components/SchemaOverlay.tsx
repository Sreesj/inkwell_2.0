'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Edit3, Type, Square, Circle, Image, Navigation, MousePointer, Layout } from 'lucide-react'
import { UISchemaNode } from '@/lib/uiSchema'

interface SchemaOverlayProps {
  isActive: boolean
  schema: UISchemaNode
  onComponentSelected: (node: UISchemaNode, bounds: DOMRect) => void
  onClose: () => void
}

export function SchemaOverlay({ isActive, schema, onComponentSelected, onClose }: SchemaOverlayProps) {
  const [selectedNode, setSelectedNode] = useState<UISchemaNode | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Get component icon based on type
  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'button':
        return <MousePointer className="h-4 w-4" />
      case 'navigation':
        return <Navigation className="h-4 w-4" />
      case 'card':
        return <Square className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'hero':
      case 'section':
        return <Layout className="h-4 w-4" />
      case 'container':
        return <Circle className="h-4 w-4" />
      default:
        return <Edit3 className="h-4 w-4" />
    }
  }

  // Find the corresponding DOM element for a schema node
  const findDOMElement = useCallback((node: UISchemaNode): HTMLElement | null => {
    // Try to find element by data-schema-id attribute
    let element = document.querySelector(`[data-schema-id="${node.id}"]`) as HTMLElement
    
    if (!element) {
      // Fallback: try to find by content or other attributes
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        if (el.textContent?.trim() === node.props?.content?.trim() ||
            el.textContent?.trim() === node.props?.text?.trim()) {
          element = el as HTMLElement
          break
        }
      }
    }
    
    return element
  }, [])

  // Handle mouse move to highlight hovered elements
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return
    
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
    if (!element || element === overlayRef.current) return
    
    // Find the most specific selectable element
    let selectableElement = element
    while (selectableElement && selectableElement !== document.body) {
      if (selectableElement.hasAttribute('data-schema-id') ||
          selectableElement.classList.contains('schema-selectable')) {
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
      if (selectableElement.hasAttribute('data-schema-id') ||
          selectableElement.classList.contains('schema-selectable')) {
        break
      }
      selectableElement = selectableElement.parentElement as HTMLElement
    }
    
    if (selectableElement) {
      const schemaId = selectableElement.getAttribute('data-schema-id')
      if (schemaId) {
        // Find the corresponding schema node
        const node = findSchemaNodeById(schema, schemaId)
        if (node) {
          const bounds = selectableElement.getBoundingClientRect()
          setSelectedNode(node)
          onComponentSelected(node, bounds)
        }
      }
    }
  }, [isActive, schema, onComponentSelected])

  // Find schema node by ID
  const findSchemaNodeById = useCallback((node: UISchemaNode, id: string): UISchemaNode | null => {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findSchemaNodeById(child, id)
        if (found) return found
      }
    }
    return null
  }, [])

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
    <div
      ref={overlayRef}
      className="schema-overlay fixed inset-0 z-50 pointer-events-auto"
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
      {selectedNode && (() => {
        const element = findDOMElement(selectedNode)
        if (!element) return null
        
        const bounds = element.getBoundingClientRect()
        return (
          <div
            className="absolute border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
            style={{
              left: bounds.left,
              top: bounds.top,
              width: bounds.width,
              height: bounds.height,
            }}
          />
        )
      })()}
      
      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Schema Edit Mode</h3>
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

      {/* Component Info Panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10">
          <Card className="bg-white/95 backdrop-blur-sm max-w-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getComponentIcon(selectedNode.type)}
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {selectedNode.type}
                  </h4>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">ID</label>
                  <p className="text-sm text-gray-700 font-mono">{selectedNode.id}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500">Function</label>
                  <p className="text-sm text-gray-700">{selectedNode.function}</p>
                </div>
                
                {selectedNode.props?.className && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Classes</label>
                    <p className="text-sm text-gray-700 font-mono">{selectedNode.props.className}</p>
                  </div>
                )}
                
                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Children</label>
                    <p className="text-sm text-gray-700">{selectedNode.children.length} components</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
