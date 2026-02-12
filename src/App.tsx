import { Fish } from 'lucide-react'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Fish className="w-10 h-10 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800">Babel Fish</h1>
        </div>
        <p className="text-gray-600 mt-2">Project setup complete!</p>
        <div className="mt-6 space-y-2 text-sm text-left">
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Vite + React + TypeScript</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Tailwind CSS v4</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Lucide React Icons</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Gemini API configured</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
