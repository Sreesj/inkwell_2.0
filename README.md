# Inkwell - AI-Powered Sketch-to-UI Builder

Inkwell is a Next.js application that transforms text prompts into beautiful UIs using AI, and allows users to edit those UIs by drawing directly on the preview.

## Features

- **AI-Powered UI Generation**: Convert text descriptions into complete React/Tailwind UIs using Google Gemini
- **Sketch-to-Edit**: Draw directly on the UI preview to make changes
- **Real-time AI Analysis**: AI interprets your drawings and applies changes intelligently
- **Export Options**: Download as React/TSX, HTML, or push to GitHub
- **Modern Design**: Beautiful, playful UI with rounded corners and soft shadows

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **AI**: Google Gemini 2.0 Flash Experimental
- **Drawing**: HTML5 Canvas with React Konva
- **State Management**: React hooks with localStorage persistence

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_GOOGLE_GENAI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_GENAI_MODEL=gemini-2.0-flash-exp
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Generate UI**: Enter a description of the UI you want to create
2. **Preview**: View your generated UI in preview mode
3. **Edit**: Switch to edit mode and draw on the UI to make changes
4. **Apply Changes**: Click "Apply Changes" to let AI interpret your drawings
5. **Export**: Download your final UI or push to GitHub

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with prompt input
│   ├── preview/           # Preview and edit interface
│   └── export/            # Export options
├── components/            # React components
│   ├── UIBuilder.tsx     # Main UI builder container
│   ├── PreviewCanvas.tsx # UI preview with drawing overlay
│   ├── PenOverlay.tsx    # Drawing tools and canvas
│   ├── Sidebar.tsx       # AI assistant and logs
│   └── ExportPanel.tsx   # Export functionality
└── lib/
    ├── ai/               # AI agent implementations
    │   ├── generation.ts # UI generation with Gemini
    │   ├── editAnalysis.ts # Drawing analysis
    │   ├── regeneration.ts # UI regeneration
    │   └── validation.ts # Code validation
    └── utils.ts          # Utility functions
```

## AI Agents

- **UI Generation Agent**: Converts text prompts to React/Tailwind components
- **Edit Analysis Agent**: Interprets drawings and converts to structured instructions
- **Regeneration Agent**: Applies changes incrementally to existing UI
- **Validation Agent**: Checks code quality, accessibility, and responsiveness

## Drawing Tools

- **Pen**: Freehand drawing
- **Circle**: Circle elements for highlighting
- **Arrow**: Point to elements or indicate movement
- **Text**: Add text notes
- **Eraser**: Remove drawings

## Export Options

- **React/TSX**: Download as a React component
- **HTML**: Standalone HTML file with Tailwind CSS
- **GitHub**: Push to a new repository for deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details