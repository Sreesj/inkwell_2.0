'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Type, Square, Circle, Image, Navigation, MousePointer, Layout, Save } from 'lucide-react'
import { UISchemaNode } from '@/lib/uiSchema'

interface SchemaFunctionModalProps {
  isOpen: boolean
  node: UISchemaNode | null
  onClose: () => void
  onSave: (nodeId: string, function_: string, description?: string) => void
}

const COMPONENT_TYPES = [
  { value: 'button', label: 'Button', icon: MousePointer, description: 'Interactive button for user actions' },
  { value: 'text', label: 'Text Block', icon: Type, description: 'Text content for information display' },
  { value: 'image', label: 'Image', icon: Image, description: 'Visual content for illustration' },
  { value: 'card', label: 'Card', icon: Square, description: 'Container for related content' },
  { value: 'navigation', label: 'Navigation', icon: Navigation, description: 'Navigation menu for site structure' },
  { value: 'hero', label: 'Hero Section', icon: Layout, description: 'Main banner section for key messaging' },
  { value: 'section', label: 'Section', icon: Circle, description: 'Content section for organizing layout' },
  { value: 'container', label: 'Container', icon: Circle, description: 'Layout container for grouping elements' }
]

export function SchemaFunctionModal({ isOpen, node, onClose, onSave }: SchemaFunctionModalProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [function_, setFunction] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or node changes
  useEffect(() => {
    if (isOpen && node) {
      setSelectedType(node.type)
      setFunction(node.function || '')
      setDescription('')
    } else {
      setSelectedType('')
      setFunction('')
      setDescription('')
    }
  }, [isOpen, node])

  const handleSave = async () => {
    if (!node || !function_.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSave(node.id, function_.trim(), description.trim() || undefined)
      onClose()
    } catch (error) {
      console.error('Error saving function:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
    }
  }

  if (!isOpen || !node) return null

  const selectedTypeInfo = COMPONENT_TYPES.find(t => t.value === selectedType)

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl mx-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {selectedTypeInfo && (
                <>
                  <div className="bg-blue-100 rounded-full p-2">
                    <selectedTypeInfo.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Define Component Function
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedTypeInfo.label} • ID: {node.id}
                    </p>
                  </div>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Component Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Component Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMPONENT_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = selectedType === type.value
                  
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Function Definition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What is the function of this element?
              </label>
              <Input
                placeholder="e.g., Primary call-to-action button, Navigation menu, Product showcase card..."
                value={function_}
                onChange={(e) => setFunction(e.target.value)}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe what this component does and how users should interact with it
              </p>
            </div>
            
            {/* Additional Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <Textarea
                placeholder="Add any specific requirements, styling notes, or behavior details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Press Ctrl+Enter to save
              </p>
            </div>
            
            {/* Current Component Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Component</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div><span className="font-medium">Type:</span> {node.type}</div>
                <div><span className="font-medium">ID:</span> {node.id}</div>
                {node.props?.className && (
                  <div><span className="font-medium">Classes:</span> {node.props.className}</div>
                )}
                {node.props?.content && (
                  <div><span className="font-medium">Content:</span> {node.props.content}</div>
                )}
                {node.props?.text && (
                  <div><span className="font-medium">Text:</span> {node.props.text}</div>
                )}
                {node.children && node.children.length > 0 && (
                  <div><span className="font-medium">Children:</span> {node.children.length} components</div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!function_.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
