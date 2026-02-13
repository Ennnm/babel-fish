import { FishToggle } from './FishToggle'
import { ToneSelector } from './ToneSelector'
import type { Tone } from '../../types'

interface ControlsRowProps {
  // Fish toggle
  isTranslationOn: boolean
  isBatchTranslating: boolean
  batchError: string | null
  failedCount: number
  retryCountdown: number
  onToggle: () => void
  onRetry: () => void
  // Tone
  selectedTone: Tone | null
  customToneText: string
  toneError: string | null
  onToneSelect: (tone: Tone | null) => void
  onCustomToneChange: (value: string) => void
}

export function ControlsRow({
  isTranslationOn,
  isBatchTranslating,
  batchError,
  failedCount,
  retryCountdown,
  onToggle,
  onRetry,
  selectedTone,
  customToneText,
  toneError,
  onToneSelect,
  onCustomToneChange,
}: ControlsRowProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-gray-50 border-t border-b border-gray-200">
      <FishToggle
        isOn={isTranslationOn}
        isLoading={isBatchTranslating}
        error={batchError}
        failedCount={failedCount}
        retryCountdown={retryCountdown}
        onToggle={onToggle}
        onRetry={onRetry}
      />

      <ToneSelector
        selectedTone={selectedTone}
        customToneText={customToneText}
        toneError={toneError}
        onToneSelect={onToneSelect}
        onCustomToneChange={onCustomToneChange}
      />
    </div>
  )
}
