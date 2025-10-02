# Inkwell Setup Guide

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_GOOGLE_GENAI_API_KEY=AIzaSyBC3JWht6Y2SNf2t2UuOSVc-u6xGPnAxTM
   NEXT_PUBLIC_GENAI_MODEL=gemini-2.0-flash-exp
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## What's Included

✅ **All shadcn/ui components installed**:
- Button, Card, Textarea, Input
- Tabs, ScrollArea, Separator, Badge

✅ **AI Integration ready**:
- Google Gemini API configured
- All AI agents implemented

✅ **Full feature set**:
- Text-to-UI generation
- Drawing tools for editing
- Real-time AI analysis
- Export functionality

## Testing the Application

1. **Home Page**: Enter a UI description like "Create a modern landing page for a SaaS product"
2. **Preview**: See your generated UI
3. **Edit Mode**: Switch to edit mode and draw on the UI
4. **Apply Changes**: Click "Apply Changes" to see AI interpret your drawings
5. **Export**: Try downloading your UI or pushing to GitHub

## Troubleshooting

- **Module not found errors**: All shadcn/ui components are now installed
- **API errors**: Make sure your Gemini API key is valid
- **Drawing not working**: Check browser console for canvas-related errors

The application is now fully functional! 🎉





