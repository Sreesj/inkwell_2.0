// Persistent sketch storage and management system
export interface SketchElement {
  id: string
  type: 'pen' | 'circle' | 'arrow' | 'text' | 'rectangle' | 'highlight'
  points: { x: number; y: number }[]
  color: string
  strokeWidth: number
  text?: string
  position?: { x: number; y: number }
  timestamp: number
  sessionId: string
  description?: string // AI-generated description of what this sketch represents
  action?: 'add_component' | 'modify_component' | 'add_page' | 'highlight' | 'note'
}

export interface ComponentInfo {
  id: string
  type: 'button' | 'navbar-item' | 'card' | 'text-block' | 'image' | 'navigation' | 'hero-section' | 'unknown'
  element: {
    tagName: string
    className: string
    textContent?: string
    bounds: {
      x: number
      y: number
      width: number
      height: number
    }
  }
  function: string
  description?: string
  timestamp: number
  sessionId: string
}

export interface SketchSession {
  id: string
  prompt: string
  generatedCode: string
  sketches: SketchElement[]
  components: ComponentInfo[]
  createdAt: number
  lastModified: number
  version: number
}

export interface SketchAction {
  id: string
  type: 'create_page' | 'add_component' | 'modify_component' | 'add_feature'
  description: string
  targetElement?: string
  parameters: Record<string, any>
  status: 'pending' | 'completed' | 'failed'
  createdAt: number
}

class SketchStore {
  private sessions: Map<string, SketchSession> = new Map()
  private currentSessionId: string | null = null
  private actions: SketchAction[] = []

  // Initialize store with localStorage
  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  // Create a new sketch session
  createSession(prompt: string, generatedCode: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: SketchSession = {
      id: sessionId,
      prompt,
      generatedCode,
      sketches: [],
      components: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      version: 1
    }
    
    this.sessions.set(sessionId, session)
    this.currentSessionId = sessionId
    this.saveToStorage()
    return sessionId
  }

  // Get current session
  getCurrentSession(): SketchSession | null {
    if (!this.currentSessionId) return null
    return this.sessions.get(this.currentSessionId) || null
  }

  // Add sketch to current session
  addSketch(sketch: Omit<SketchElement, 'id' | 'timestamp' | 'sessionId'>): string {
    if (!this.currentSessionId) {
      throw new Error('No active session')
    }

    const session = this.sessions.get(this.currentSessionId)
    if (!session) {
      throw new Error('Current session not found')
    }

    const sketchElement: SketchElement = {
      ...sketch,
      id: `sketch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.currentSessionId
    }

    session.sketches.push(sketchElement)
    session.lastModified = Date.now()
    session.version += 1

    this.saveToStorage()
    return sketchElement.id
  }

  // Update sketch with AI analysis
  updateSketchDescription(sketchId: string, description: string, action?: SketchElement['action']) {
    if (!this.currentSessionId) return

    const session = this.sessions.get(this.currentSessionId)
    if (!session) return

    const sketch = session.sketches.find(s => s.id === sketchId)
    if (sketch) {
      sketch.description = description
      if (action) {
        sketch.action = action
      }
      session.lastModified = Date.now()
      session.version += 1
      this.saveToStorage()
    }
  }

  // Get all sketches for current session
  getSketches(): SketchElement[] {
    const session = this.getCurrentSession()
    return session ? session.sketches : []
  }

  // Clear sketches for current session
  clearSketches() {
    if (!this.currentSessionId) return

    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.sketches = []
      session.lastModified = Date.now()
      session.version += 1
      this.saveToStorage()
    }
  }

  // Add component to current session
  addComponent(component: Omit<ComponentInfo, 'id' | 'timestamp' | 'sessionId'>): string {
    if (!this.currentSessionId) {
      throw new Error('No active session')
    }

    const session = this.sessions.get(this.currentSessionId)
    if (!session) {
      throw new Error('Current session not found')
    }

    const componentInfo: ComponentInfo = {
      ...component,
      id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: this.currentSessionId
    }

    session.components.push(componentInfo)
    session.lastModified = Date.now()
    session.version += 1

    this.saveToStorage()
    return componentInfo.id
  }

  // Get all components for current session
  getComponents(): ComponentInfo[] {
    const session = this.getCurrentSession()
    return session ? session.components : []
  }

  // Update component function
  updateComponentFunction(componentId: string, function_: string, description?: string) {
    if (!this.currentSessionId) return

    const session = this.sessions.get(this.currentSessionId)
    if (!session) return

    const component = session.components.find(c => c.id === componentId)
    if (component) {
      component.function = function_
      if (description) {
        component.description = description
      }
      session.lastModified = Date.now()
      session.version += 1
      this.saveToStorage()
    }
  }

  // Clear components for current session
  clearComponents() {
    if (!this.currentSessionId) return

    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.components = []
      session.lastModified = Date.now()
      session.version += 1
      this.saveToStorage()
    }
  }

  // Update generated code for current session
  updateGeneratedCode(newCode: string) {
    if (!this.currentSessionId) return

    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.generatedCode = newCode
      session.lastModified = Date.now()
      session.version += 1
      this.saveToStorage()
    }
  }

  // Add action
  addAction(action: Omit<SketchAction, 'id' | 'createdAt'>): string {
    const actionElement: SketchAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    }

    this.actions.push(actionElement)
    this.saveToStorage()
    return actionElement.id
  }

  // Get actions for current session
  getActions(): SketchAction[] {
    return this.actions.filter(action => action.status === 'pending')
  }

  // Update action status
  updateActionStatus(actionId: string, status: SketchAction['status']) {
    const action = this.actions.find(a => a.id === actionId)
    if (action) {
      action.status = status
      this.saveToStorage()
    }
  }

  // Get session history
  getSessionHistory(): SketchSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.lastModified - a.lastModified)
  }

  // Load from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('inkwell-sketch-store')
      if (stored) {
        const data = JSON.parse(stored)
        this.sessions = new Map(data.sessions || [])
        this.currentSessionId = data.currentSessionId || null
        this.actions = data.actions || []
      }
    } catch (error) {
      console.error('Error loading sketch store:', error)
    }
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        currentSessionId: this.currentSessionId,
        actions: this.actions
      }
      localStorage.setItem('inkwell-sketch-store', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving sketch store:', error)
    }
  }

  // Export session data
  exportSession(sessionId?: string): string {
    const targetSessionId = sessionId || this.currentSessionId
    if (!targetSessionId) return ''

    const session = this.sessions.get(targetSessionId)
    if (!session) return ''

    return JSON.stringify(session, null, 2)
  }

  // Import session data
  importSession(sessionData: string): boolean {
    try {
      const session: SketchSession = JSON.parse(sessionData)
      this.sessions.set(session.id, session)
      this.currentSessionId = session.id
      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Error importing session:', error)
      return false
    }
  }
}

// Singleton instance
export const sketchStore = new SketchStore()
