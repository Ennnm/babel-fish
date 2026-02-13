interface TranslationPreviewProps {
  text: string
  tonedOriginal?: string
  isLoading: boolean
  error?: string
  label: string
}

export function TranslationPreview({
  text,
  tonedOriginal,
  isLoading,
  error,
  label,
}: TranslationPreviewProps) {
  if (!text && !isLoading && !error) return null

  return (
    <div className="mx-4 mt-3 mb-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
      <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
      {isLoading ? (
        <p className="text-sm text-gray-400 italic">Processing...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-700">{text}</p>
          {tonedOriginal && (
            <p className="text-xs text-gray-500 italic mt-1">{tonedOriginal}</p>
          )}
        </>
      )}
    </div>
  )
}
