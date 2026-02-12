interface TranslationPreviewProps {
  text: string
  isLoading: boolean
  error?: string
}

export function TranslationPreview({ text, isLoading, error }: TranslationPreviewProps) {
  if (!text && !isLoading && !error) return null

  return (
    <div className="mx-4 mb-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
      <p className="text-xs text-gray-500 mb-1 font-medium">Translation Preview</p>
      {isLoading ? (
        <p className="text-sm text-gray-400 italic">Translating...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <p className="text-sm text-gray-700">{text}</p>
      )}
    </div>
  )
}
