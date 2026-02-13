import { Mic } from 'lucide-react'

interface RecordButtonProps {
  isRecording: boolean
  duration: number
  disabled?: boolean
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RecordButton({
  isRecording,
  duration,
  disabled,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: RecordButtonProps) {
  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseDown}
      onTouchEnd={onMouseUp}
      disabled={disabled}
      className={`p-2 rounded-full transition-all flex items-center gap-1 ${
        isRecording
          ? 'bg-red-500 text-white animate-pulse min-w-[72px] justify-center'
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isRecording ? `Recording ${formatDuration(duration)}` : 'Hold to record'}
    >
      <Mic className="w-5 h-5" />
      {isRecording && <span className="text-xs font-mono">{formatDuration(duration)}</span>}
    </button>
  )
}
