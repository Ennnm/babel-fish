import { Loader2, AlertTriangle, X } from 'lucide-react'

interface VoiceInputPreviewProps {
  cleanedText: string
  rawText: string
  isProcessing: boolean
  error?: string
  warning?: string // For "cleanup failed, using raw" message
  onDismiss?: () => void
}

export function VoiceInputPreview({
  cleanedText,
  rawText,
  isProcessing,
  error,
  warning,
  onDismiss,
}: VoiceInputPreviewProps) {
  if (!cleanedText && !rawText && !isProcessing && !error) return null

  return (
    <div className="mx-4 mt-3 mb-2 p-3 border border-purple-300 rounded-lg bg-purple-50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-purple-600 mb-1 font-medium flex items-center gap-1">
            Voice Input
            {warning && (
              <span className="text-amber-600 flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs">(cleanup failed)</span>
              </span>
            )}
          </p>
          {isProcessing ? (
            <div className="flex items-center gap-2 text-sm text-purple-400 italic">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing voice input...
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <>
              <p className="text-sm text-gray-700">{cleanedText}</p>
              {rawText && rawText !== cleanedText && (
                <p className="text-xs text-gray-400 italic mt-1">Raw: {rawText}</p>
              )}
            </>
          )}
        </div>
        {onDismiss && !isProcessing && (
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-purple-100 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
