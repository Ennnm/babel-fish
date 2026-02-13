import { Volume2, Loader2 } from 'lucide-react'

interface TranslationPreviewProps {
  text: string
  tonedOriginal?: string
  isLoading: boolean
  error?: string
  label: string
  showTTS?: boolean
  onPlayTTS?: () => void
  isTTSPlaying?: boolean
}

export function TranslationPreview({
  text,
  tonedOriginal,
  isLoading,
  error,
  label,
  showTTS = false,
  onPlayTTS,
  isTTSPlaying = false,
}: TranslationPreviewProps) {
  if (!text && !isLoading && !error) return null

  const canPlayTTS = showTTS && text && !isLoading && !error

  return (
    <div className="mx-4 mt-3 mb-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
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
        {canPlayTTS && (
          <button
            onClick={onPlayTTS}
            disabled={isTTSPlaying}
            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Play audio"
          >
            {isTTSPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
