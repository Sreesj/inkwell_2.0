'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Send, X, AlertTriangle } from 'lucide-react'

interface HelpDialogProps {
  isOpen: boolean
  onClose: () => void
  onHelpProvided: (helpText: string) => void
  context?: string
  elementType?: string
}

export function HelpDialog({ isOpen, onClose, onHelpProvided, context, elementType }: HelpDialogProps) {
  const [helpText, setHelpText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!helpText.trim()) return
    
    setIsSubmitting(true)
    try {
      await onHelpProvided(helpText.trim())
      setHelpText('')
      onClose()
    } catch (error) {
      console.error('Error submitting help:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">
                I Need Your Help
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                I'm not sure how to handle this element. Could you help me understand what you'd like me to do?
              </p>
            </div>
            
            {context && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context
                </label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <p className="text-sm text-gray-600">{context}</p>
                </div>
              </div>
            )}
            
            {elementType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Element Type
                </label>
                <Badge variant="outline" className="capitalize">
                  {elementType.replace('-', ' ')}
                </Badge>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What should I do?
              </label>
              <Textarea
                placeholder="Please describe what you'd like me to do with this element. For example: 'Make this a contact form', 'Change this to a product showcase', 'Add a login button here'..."
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={4}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Press Ctrl+Enter to submit
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!helpText.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Help
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
