interface FishToggleProps {
  isOn: boolean
  isLoading: boolean
  error: string | null
  failedCount: number
  retryCountdown: number
  onToggle: () => void
  onRetry: () => void
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function FishToggle({
  isOn,
  isLoading,
  error,
  failedCount,
  retryCountdown,
  onToggle,
  onRetry,
}: FishToggleProps) {
  const showRetry = error && failedCount > 0 && !isLoading
  const isCountingDown = retryCountdown > 0

  const toggleClasses = isOn
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${toggleClasses}`}
      >
        <span className="text-base">🐟</span>
        {isOn ? 'ON' : 'OFF'}
      </button>

      {isLoading && (
        <>
          <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Translating...</span>
        </>
      )}

      {showRetry && (
        <button
          onClick={onRetry}
          disabled={isCountingDown}
          className="flex items-center gap-1 px-3 py-1.5 border border-amber-500 rounded-full bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          🔄 Retry{isCountingDown ? ` (${formatCountdown(retryCountdown)})` : ''}
        </button>
      )}

      {error && !isLoading && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  )
}
