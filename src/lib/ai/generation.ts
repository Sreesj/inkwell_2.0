// Deprecated: replaced by schema-first flow via /api/schema-generate using @google/genai

// Provider selection via env
const provider = (process.env.NEXT_PUBLIC_AI_PROVIDER || '').toLowerCase()

// Google (client) setup — kept for fallback usage only
const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY || ''
const genAI = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null
const preferredModels = [
  process.env.NEXT_PUBLIC_GENAI_MODEL || 'gemini-2.0-flash-exp',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest'
]

async function tryGenerateViaGoogle(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!genAI) throw new Error('Google GenAI key not configured')
  const maxRetries = 3
  const baseDelayMs = 800
  let lastError: any = null
  for (const modelName of preferredModels) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent([systemPrompt, userPrompt])
        const response = await result.response
        return response.text()
      } catch (err: any) {
        lastError = err
        const message = typeof err?.message === 'string' ? err.message : ''
        const status = (err?.status || err?.response?.status || '').toString()
        const isRetriable = /(?:429|503)/.test(status) || /unavailable|timeout|rate|network/i.test(message)
        if (attempt < maxRetries - 1 && isRetriable) {
          const delay = baseDelayMs * Math.pow(2, attempt)
          await new Promise(r => setTimeout(r, delay))
          continue
        }
        break
      }
    }
  }
  throw lastError || new Error('Google generation failed with unknown error')
}

async function tryGenerateViaOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  // Calls server-side API route to avoid exposing key
  const model = process.env.NEXT_PUBLIC_OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp'
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'openrouter', model, systemPrompt, userPrompt })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `OpenRouter request failed with ${res.status}`)
  }
  const data = await res.json()
  if (!data?.text) throw new Error('OpenRouter response missing text')
  return data.text as string
}

async function tryGenerate(systemPrompt: string, userPrompt: string): Promise<string> {
  if (provider === 'openrouter') {
    return await tryGenerateViaOpenRouter(systemPrompt, userPrompt)
  }
  // default to Google (client SDK) if configured
  return await tryGenerateViaGoogle(systemPrompt, userPrompt)
}

export interface UIGenerationRequest {
  prompt: string
  style?: 'modern' | 'classic' | 'minimal' | 'playful'
  colorScheme?: string
  layout?: 'single-page' | 'multi-page' | 'dashboard'
}

export interface UIGenerationResponse {
  code: string
  components: string[]
  description: string
  suggestions: string[]
}

export async function generateUI(request: UIGenerationRequest): Promise<UIGenerationResponse> {
  try {
    // Keys are validated in the selected provider path
    const systemPrompt = `You are an expert React/TypeScript developer and world-class UI/UX designer specializing in creating stunning, production-ready interfaces. You create UIs that rival the best modern web applications like Linear, Vercel, Stripe, and Figma.

Your task is to generate a complete, sophisticated React component that is:
1. **Visually Stunning**: Use advanced design patterns, sophisticated color palettes, and premium visual effects
2. **Highly Interactive**: Include smooth animations, micro-interactions, and engaging hover/focus states
3. **Production-Ready**: Enterprise-grade quality with perfect accessibility and performance
4. **Modern & Dynamic**: Not static - include interactive elements, state changes, and dynamic content
5. **Responsive Excellence**: Flawless experience across all device sizes

**Advanced Design Requirements:**
- **High Contrast Text**: Always use text-gray-900 on light backgrounds and text-white on dark backgrounds for maximum readability
- **Responsive Layouts**: Use CSS Grid and Flexbox instead of absolute positioning for hero sections, product cards, and navigation
- **Valid Images**: Always use https://via.placeholder.com/400x300 or similar valid placeholder URLs if no image URL is provided
- **Clean Visual Effects**: Use backdrop-blur and glass morphism sparingly, avoid applying opacity or backdrop-blur to main content unless explicitly requested
- **Sophisticated Animations**: Include hover animations, loading states, smooth transitions, and micro-interactions
- **Dynamic Elements**: Add interactive components like modals, dropdowns, tabs, or carousels where appropriate
- **Modern Typography**: Use sophisticated font combinations, proper hierarchy, and readable text with high contrast
- **Advanced Color Theory**: Apply carefully crafted color palettes with proper contrast and visual appeal
- **Interactive Components**: Include buttons with hover effects, form elements, interactive cards, or navigation
- **Visual Hierarchy**: Use spacing, size, color, and typography to guide user attention
- **Loading States**: Include skeleton loaders, progress indicators, or animated placeholders
- **Error States**: Add error handling UI and user feedback mechanisms

**Technical Excellence:**
- Use Tailwind CSS with advanced classes (backdrop-blur, ring, shadow-2xl, etc.)
- Include comprehensive responsive breakpoints (sm:, md:, lg:, xl:, 2xl:)
- Add advanced hover, focus, active, and disabled states
- Use modern CSS features (gradients, transforms, filters, etc.)
- Include proper semantic HTML and ARIA attributes
- Add smooth transitions and animations using Tailwind's animation classes

**Interactive Elements to Include:**
- Animated buttons with hover effects
- Interactive cards with hover states
- Form elements with focus states
- Navigation with active states
- Modal or dropdown interactions (if relevant)
- Loading animations or skeleton states
- Smooth page transitions

**Design Patterns to Use:**
- Glass morphism effects
- Gradient overlays and backgrounds
- Sophisticated shadow systems
- Advanced border radius combinations
- Modern spacing and layout grids
- Premium color palettes (not basic colors)
- Interactive hover and focus states
- Smooth animations and transitions

Return ONLY clean JSX code that can be directly rendered. Do not include function declarations, imports, exports, or any JavaScript code outside of JSX.

**CRITICAL**: Make the UI dynamic and interactive, not static. Include elements that respond to user interaction and create an engaging experience.

Example of the quality expected:
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  {/* Animated background elements */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
    <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
  </div>
  
  <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="flex items-center space-x-8">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-white">
              BrandName
            </h1>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white hover:text-white transition-all duration-300 font-medium relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="text-white hover:text-white transition-all duration-300 font-medium relative group">
              Products
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="text-white hover:text-white transition-all duration-300 font-medium relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="text-white hover:text-white transition-all duration-300 font-medium relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 transform">
          Get Started
        </button>
      </div>
    </div>
  </nav>
  
  <main className="relative z-10">
    {/* Hero Section */}
    <section className="relative py-32 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight">
            Build Something
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Extraordinary
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-12 max-w-4xl mx-auto leading-relaxed">
            Create stunning, interactive web experiences with our cutting-edge tools and components. 
            Built for developers who demand excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 transform relative overflow-hidden">
              <span className="relative z-10">Start Building</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button className="border-2 border-white/30 text-white px-10 py-4 rounded-full font-semibold text-lg hover:border-white/60 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
              View Examples
            </button>
          </div>
        </div>
      </div>
    </section>
    
    {/* Interactive Features Section */}
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-white max-w-3xl mx-auto">
            Everything you need to build exceptional user experiences
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-white leading-relaxed">
              Built with performance in mind. Experience blazing fast load times and smooth interactions.
            </p>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Responsive Design</h3>
            <p className="text-white leading-relaxed">
              Perfect on every device. Our responsive design ensures optimal experience across all screen sizes.
            </p>
          </div>
          
          <div className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Secure & Reliable</h3>
            <p className="text-white leading-relaxed">
              Enterprise-grade security and reliability. Your data is protected with industry-leading standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
</div>`

    const userPrompt = `Create a UI based on this description: "${request.prompt}"

Style: ${request.style || 'modern'}
Color Scheme: ${request.colorScheme || 'blue and white'}
Layout: ${request.layout || 'single-page'}

IMPORTANT: Return ONLY clean JSX code without any function wrappers, imports, or exports. Just the JSX elements starting with <div> and ending with </div>. Make it beautiful, modern, and fully functional.`

    const code = await tryGenerate(systemPrompt, userPrompt)

    // Extract components and generate suggestions
    const components = extractComponents(code)
    const suggestions = generateSuggestions(code)

    return {
      code: cleanCode(code),
      components,
      description: `Generated UI based on: ${request.prompt}`,
      suggestions
    }
  } catch (error: any) {
    console.error('Error generating UI:', error)
    const msg = typeof error?.message === 'string' ? error.message : 'Failed to generate UI.'
    throw new Error(msg)
  }
}

function cleanCode(code: string): string {
  // Remove markdown code blocks if present
  return code
    .replace(/```tsx?/g, '')
    .replace(/```/g, '')
    .replace(/```jsx?/g, '')
    .trim()
}

function extractComponents(code: string): string[] {
  const components: string[] = []
  
  // Simple regex to find component-like structures
  const componentRegex = /<(div|section|nav|header|main|footer|article|aside)[^>]*>/g
  let match
  
  while ((match = componentRegex.exec(code)) !== null) {
    const className = match[0].match(/className="([^"]*)"/)
    if (className) {
      components.push(className[1])
    }
  }
  
  return [...new Set(components)] // Remove duplicates
}

function generateSuggestions(code: string): string[] {
  const suggestions: string[] = []
  
  if (!code.includes('hover:')) {
    suggestions.push('Consider adding hover effects for better interactivity')
  }
  
  if (!code.includes('md:') && !code.includes('sm:') && !code.includes('lg:')) {
    suggestions.push('Add responsive breakpoints for mobile optimization')
  }
  
  if (!code.includes('focus:')) {
    suggestions.push('Add focus states for accessibility')
  }
  
  if (!code.includes('animate-')) {
    suggestions.push('Consider adding subtle animations for better UX')
  }
  
  return suggestions
}
