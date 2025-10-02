// Schema-based editing system
import { UISchema, UISchemaNode, validateSchema, fixSchemaIssues } from './uiSchema'

export interface SchemaEditOperation {
  type: 'update_function' | 'update_props' | 'update_style' | 'add_component' | 'remove_component' | 'move_component'
  nodeId: string
  data: any
}

export interface SchemaEditResult {
  success: boolean
  updatedSchema: UISchema
  changes: string[]
  warnings: string[]
}

export class SchemaEditor {
  private schema: UISchema

  constructor(schema: UISchema) {
    this.schema = JSON.parse(JSON.stringify(schema)) // Deep clone
  }

  // Update component function
  updateFunction(nodeId: string, function_: string): SchemaEditResult {
    const node = this.findNode(nodeId)
    if (!node) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found`]
      }
    }

    const oldFunction = node.function
    node.function = function_
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    return {
      success: true,
      updatedSchema: this.schema,
      changes: [`Updated function for ${nodeId}: "${oldFunction}" → "${function_}"`],
      warnings: []
    }
  }

  // Update component properties
  updateProps(nodeId: string, props: Record<string, any>): SchemaEditResult {
    const node = this.findNode(nodeId)
    if (!node) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found`]
      }
    }

    const oldProps = { ...node.props }
    node.props = { ...node.props, ...props }
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    const changes = Object.keys(props).map(key => 
      `Updated ${key} for ${nodeId}: "${oldProps[key]}" → "${props[key]}"`
    )

    return {
      success: true,
      updatedSchema: this.schema,
      changes,
      warnings: []
    }
  }

  // Update component styles
  updateStyle(nodeId: string, style: Record<string, any>): SchemaEditResult {
    const node = this.findNode(nodeId)
    if (!node) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found`]
      }
    }

    const oldStyle = { ...node.style }
    node.style = { ...node.style, ...style }
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    const changes = Object.keys(style).map(key => 
      `Updated style ${key} for ${nodeId}: "${oldStyle[key]}" → "${style[key]}"`
    )

    return {
      success: true,
      updatedSchema: this.schema,
      changes,
      warnings: []
    }
  }

  // Add a new component
  addComponent(parentId: string, component: Omit<UISchemaNode, 'id'>): SchemaEditResult {
    const parent = this.findNode(parentId)
    if (!parent) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Parent node ${parentId} not found`]
      }
    }

    const newComponent: UISchemaNode = {
      ...component,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    if (!parent.children) {
      parent.children = []
    }
    parent.children.push(newComponent)
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    return {
      success: true,
      updatedSchema: this.schema,
      changes: [`Added ${newComponent.type} component to ${parentId}`],
      warnings: []
    }
  }

  // Remove a component
  removeComponent(nodeId: string): SchemaEditResult {
    if (nodeId === 'root') {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: ['Cannot remove root node']
      }
    }

    const parent = this.findParent(nodeId)
    if (!parent || !parent.children) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found or has no parent`]
      }
    }

    const index = parent.children.findIndex(child => child.id === nodeId)
    if (index === -1) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found in parent children`]
      }
    }

    const removedNode = parent.children[index]
    parent.children.splice(index, 1)
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    return {
      success: true,
      updatedSchema: this.schema,
      changes: [`Removed ${removedNode.type} component ${nodeId}`],
      warnings: []
    }
  }

  // Move a component to a new parent
  moveComponent(nodeId: string, newParentId: string, index?: number): SchemaEditResult {
    const node = this.findNode(nodeId)
    const newParent = this.findNode(newParentId)
    
    if (!node) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`Node ${nodeId} not found`]
      }
    }

    if (!newParent) {
      return {
        success: false,
        updatedSchema: this.schema,
        changes: [],
        warnings: [`New parent ${newParentId} not found`]
      }
    }

    // Remove from current parent
    const currentParent = this.findParent(nodeId)
    if (currentParent && currentParent.children) {
      const currentIndex = currentParent.children.findIndex(child => child.id === nodeId)
      if (currentIndex !== -1) {
        currentParent.children.splice(currentIndex, 1)
      }
    }

    // Add to new parent
    if (!newParent.children) {
      newParent.children = []
    }
    
    const insertIndex = index !== undefined ? index : newParent.children.length
    newParent.children.splice(insertIndex, 0, node)
    
    this.schema.metadata.lastModified = Date.now()
    this.schema.version += 1

    return {
      success: true,
      updatedSchema: this.schema,
      changes: [`Moved ${node.type} component ${nodeId} to ${newParentId}`],
      warnings: []
    }
  }

  // Apply multiple operations
  applyOperations(operations: SchemaEditOperation[]): SchemaEditResult {
    const allChanges: string[] = []
    const allWarnings: string[] = []
    let success = true

    for (const operation of operations) {
      let result: SchemaEditResult

      switch (operation.type) {
        case 'update_function':
          result = this.updateFunction(operation.nodeId, operation.data)
          break
        case 'update_props':
          result = this.updateProps(operation.nodeId, operation.data)
          break
        case 'update_style':
          result = this.updateStyle(operation.nodeId, operation.data)
          break
        case 'add_component':
          result = this.addComponent(operation.nodeId, operation.data)
          break
        case 'remove_component':
          result = this.removeComponent(operation.nodeId)
          break
        case 'move_component':
          result = this.moveComponent(operation.nodeId, operation.data.parentId, operation.data.index)
          break
        default:
          result = {
            success: false,
            updatedSchema: this.schema,
            changes: [],
            warnings: [`Unknown operation type: ${(operation as any).type}`]
          }
      }

      allChanges.push(...result.changes)
      allWarnings.push(...result.warnings)
      if (!result.success) {
        success = false
      }
    }

    // Validate and fix the final schema
    const validation = validateSchema(this.schema)
    if (!validation.isValid) {
      allWarnings.push(...validation.errors)
      success = false
    }
    allWarnings.push(...validation.warnings)

    // Fix common issues
    this.schema = fixSchemaIssues(this.schema)

    return {
      success,
      updatedSchema: this.schema,
      changes: allChanges,
      warnings: allWarnings
    }
  }

  // Get current schema
  getSchema(): UISchema {
    return this.schema
  }

  // Find a node by ID
  private findNode(nodeId: string): UISchemaNode | null {
    function searchNode(node: UISchemaNode): UISchemaNode | null {
      if (node.id === nodeId) return node
      if (node.children) {
        for (const child of node.children) {
          const found = searchNode(child)
          if (found) return found
        }
      }
      return null
    }

    return searchNode(this.schema.root)
  }

  // Find parent of a node
  private findParent(nodeId: string): UISchemaNode | null {
    function searchParent(node: UISchemaNode, targetId: string): UISchemaNode | null {
      if (node.children) {
        for (const child of node.children) {
          if (child.id === targetId) return node
          const found = searchParent(child, targetId)
          if (found) return found
        }
      }
      return null
    }

    return searchParent(this.schema.root, nodeId)
  }

  // Get all nodes as a flat array
  getAllNodes(): UISchemaNode[] {
    const nodes: UISchemaNode[] = []
    
    function collectNodes(node: UISchemaNode) {
      nodes.push(node)
      if (node.children) {
        node.children.forEach(collectNodes)
      }
    }

    collectNodes(this.schema.root)
    return nodes
  }

  // Get nodes by type
  getNodesByType(type: string): UISchemaNode[] {
    return this.getAllNodes().filter(node => node.type === type)
  }

  // Get component hierarchy for display
  getHierarchy(): Array<{ node: UISchemaNode; depth: number; path: string }> {
    const hierarchy: Array<{ node: UISchemaNode; depth: number; path: string }> = []
    
    function buildHierarchy(node: UISchemaNode, depth: number = 0, path: string = '') {
      const currentPath = path ? `${path}.${node.id}` : node.id
      hierarchy.push({ node, depth, path: currentPath })
      
      if (node.children) {
        node.children.forEach(child => buildHierarchy(child, depth + 1, currentPath))
      }
    }

    buildHierarchy(this.schema.root)
    return hierarchy
  }
}
