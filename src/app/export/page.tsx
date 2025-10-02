import { ExportPanel } from '@/components/ExportPanel'

export default function ExportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Export Your UI
        </h1>
        <ExportPanel />
      </div>
    </div>
  )
}
