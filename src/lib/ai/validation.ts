export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
}

export interface ValidationError {
  type: 'syntax' | 'accessibility' | 'responsive' | 'performance'
  message: string
  line?: number
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  type: 'best-practice' | 'accessibility' | 'performance'
  message: string
  suggestion: string
}

export function validateCode(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const suggestions: string[] = []

  // Syntax validation
  validateSyntax(code, errors)
  
  // Accessibility validation
  validateAccessibility(code, errors, warnings)
  
  // Responsive design validation
  validateResponsive(code, warnings)
  
  // Performance validation
  validatePerformance(code, warnings)
  
  // Generate suggestions
  generateSuggestions(code, suggestions)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  }
}

function validateSyntax(code: string, errors: ValidationError[]): void {
  // Check for basic JSX syntax issues
  const openTags = (code.match(/</g) || []).length
  const closeTags = (code.match(/>/g) || []).length
  
  if (openTags !== closeTags) {
    errors.push({
      type: 'syntax',
      message: 'Mismatched JSX tags detected',
      severity: 'error'
    })
  }

  // Check for unclosed tags
  const tagRegex = /<(\w+)[^>]*>/g
  const closingTagRegex = /<\/(\w+)>/g
  const openTagMatches = [...code.matchAll(tagRegex)]
  const closeTagMatches = [...code.matchAll(closingTagRegex)]
  
  if (openTagMatches.length !== closeTagMatches.length) {
    errors.push({
      type: 'syntax',
      message: 'Unclosed JSX tags detected',
      severity: 'error'
    })
  }

  // Check for missing className quotes
  const unquotedClassRegex = /className=\w+/g
  if (unquotedClassRegex.test(code)) {
    errors.push({
      type: 'syntax',
      message: 'Unquoted className attributes detected',
      severity: 'error'
    })
  }
}

function validateAccessibility(code: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
  // Check for missing alt attributes on images
  const imgRegex = /<img[^>]*>/g
  const imgMatches = [...code.matchAll(imgRegex)]
  
  imgMatches.forEach((match, index) => {
    if (!match[0].includes('alt=')) {
      errors.push({
        type: 'accessibility',
        message: `Image at position ${index + 1} missing alt attribute`,
        severity: 'error'
      })
    }
  })

  // Check for proper heading hierarchy
  const headingRegex = /<h([1-6])[^>]*>/g
  const headingMatches = [...code.matchAll(headingRegex)]
  const headingLevels = headingMatches.map(match => parseInt(match[1]))
  
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      warnings.push({
        type: 'accessibility',
        message: `Heading hierarchy jump from h${headingLevels[i - 1]} to h${headingLevels[i]}`,
        suggestion: 'Consider using sequential heading levels for better screen reader navigation'
      })
    }
  }

  // Check for interactive elements without proper roles
  const buttonRegex = /<button[^>]*>/g
  const linkRegex = /<a[^>]*>/g
  
  if (buttonRegex.test(code) && !code.includes('role=')) {
    warnings.push({
      type: 'accessibility',
      message: 'Interactive elements present without explicit roles',
      suggestion: 'Add role attributes to interactive elements for better accessibility'
    })
  }
}

function validateResponsive(code: string, warnings: ValidationWarning[]): void {
  // Check for responsive breakpoints
  const responsiveClasses = ['sm:', 'md:', 'lg:', 'xl:', '2xl:']
  const hasResponsiveClasses = responsiveClasses.some(breakpoint => code.includes(breakpoint))
  
  if (!hasResponsiveClasses) {
    warnings.push({
      type: 'best-practice',
      message: 'No responsive breakpoints detected',
      suggestion: 'Add responsive classes (sm:, md:, lg:) for mobile optimization'
    })
  }

  // Check for fixed widths that might break on mobile
  const fixedWidthRegex = /w-\d+|width:\s*\d+px/g
  if (fixedWidthRegex.test(code)) {
    warnings.push({
      type: 'best-practice',
      message: 'Fixed widths detected that may not work well on mobile',
      suggestion: 'Consider using responsive width classes or max-width instead'
    })
  }
}

function validatePerformance(code: string, warnings: ValidationWarning[]): void {
  // Check for potential performance issues
  const deepNestingRegex = /<div[^>]*><div[^>]*><div[^>]*><div[^>]*><div[^>]*>/g
  if (deepNestingRegex.test(code)) {
    warnings.push({
      type: 'performance',
      message: 'Deeply nested div elements detected',
      suggestion: 'Consider flattening the DOM structure for better performance'
    })
  }

  // Check for inline styles (should use Tailwind classes instead)
  const inlineStyleRegex = /style="[^"]*"/g
  if (inlineStyleRegex.test(code)) {
    warnings.push({
      type: 'best-practice',
      message: 'Inline styles detected',
      suggestion: 'Replace inline styles with Tailwind CSS classes for consistency'
    })
  }
}

function generateSuggestions(code: string, suggestions: string[]): void {
  // Check for hover effects
  if (!code.includes('hover:')) {
    suggestions.push('Add hover effects for better interactivity')
  }

  // Check for focus states
  if (!code.includes('focus:')) {
    suggestions.push('Add focus states for keyboard navigation')
  }

  // Check for animations
  if (!code.includes('animate-') && !code.includes('transition-')) {
    suggestions.push('Consider adding subtle animations for better UX')
  }

  // Check for loading states
  if (code.includes('button') && !code.includes('disabled')) {
    suggestions.push('Add loading states for buttons')
  }

  // Check for proper semantic HTML
  if (code.includes('<div>') && !code.includes('<main>') && !code.includes('<section>')) {
    suggestions.push('Use semantic HTML elements (main, section, article) instead of divs where appropriate')
  }
}

// Helper function to fix common issues
export function fixCommonIssues(code: string): string {
  let fixedCode = code

  // Fix unquoted className attributes
  fixedCode = fixedCode.replace(/className=(\w+)/g, 'className="$1"')

  // Add missing alt attributes to images
  fixedCode = fixedCode.replace(/<img([^>]*?)(?:\s+alt="[^"]*")?([^>]*?)>/g, (match, before, after) => {
    if (!match.includes('alt=')) {
      return `<img${before} alt="Image"${after}>`
    }
    return match
  })

  // Ensure proper button types
  fixedCode = fixedCode.replace(/<button([^>]*?)(?:\s+type="[^"]*")?([^>]*?)>/g, (match, before, after) => {
    if (!match.includes('type=')) {
      return `<button${before} type="button"${after}>`
    }
    return match
  })

  return fixedCode
}

// Linting function for Tailwind classes
export function lintTailwindClasses(code: string): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Extract all className attributes
  const classNameRegex = /className="([^"]*)"/g
  const matches = [...code.matchAll(classNameRegex)]
  
  matches.forEach((match, index) => {
    const classes = match[1].split(' ')
    
    classes.forEach(className => {
      // Check for invalid Tailwind classes (basic validation)
      if (className.includes('undefined') || className.includes('null')) {
        errors.push({
          type: 'syntax',
          message: `Invalid className at position ${index + 1}: ${className}`,
          severity: 'error'
        })
      }
    })
  })

  return errors
}

