import type { ChangeEvent } from 'react'
import type { Tone } from '../../types'

interface ToneSelectorProps {
  selectedTone: Tone | null
  customToneText: string
  toneError: string | null
  onToneSelect: (tone: Tone | null) => void
  onCustomToneChange: (value: string) => void
}

const PRESET_TONES: { tone: Tone; emoji: string; label: string }[] = [
  { tone: 'happy', emoji: '😊', label: 'Happy' },
  { tone: 'formal', emoji: '📝', label: 'Formal' },
  { tone: 'casual', emoji: '😎', label: 'Casual' },
  { tone: 'angry', emoji: '😠', label: 'Angry' },
  { tone: 'playful', emoji: '🎉', label: 'Playful' },
  { tone: 'sad', emoji: '😢', label: 'Sad' },
]

export function ToneSelector({
  selectedTone,
  customToneText,
  toneError,
  onToneSelect,
  onCustomToneChange,
}: ToneSelectorProps) {
  const handleChipClick = (tone: Tone) => {
    if (selectedTone === tone) {
      onToneSelect(null) // Deselect
    } else {
      onToneSelect(tone)
    }
  }

  const handleCustomChange = (e: ChangeEvent<HTMLInputElement>) => {
    onCustomToneChange(e.target.value)
  }

  const isCustomSelected = selectedTone === 'custom'
  const showCustomInput = isCustomSelected

  const getChipClasses = (isSelected: boolean) => {
    const base = 'flex items-center gap-1 px-3 py-1.5 border rounded-full text-sm cursor-pointer transition-all'
    if (isSelected) {
      return `${base} border-blue-500 bg-blue-50 text-blue-700`
    }
    return `${base} border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50`
  }

  const inputClasses = toneError
    ? 'w-full px-3 py-2 border border-red-500 rounded-lg text-sm outline-none focus:ring-1 focus:ring-red-500'
    : 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_TONES.map(({ tone, emoji, label }) => (
          <button
            key={tone}
            className={getChipClasses(selectedTone === tone)}
            onClick={() => handleChipClick(tone)}
            title={label}
          >
            {emoji} {label}
          </button>
        ))}
        <button
          className={getChipClasses(isCustomSelected)}
          onClick={() => handleChipClick('custom')}
          title="Custom tone"
        >
          ✏️ Custom
        </button>
      </div>

      {showCustomInput && (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Enter custom tone (e.g., 'professional but friendly')"
            value={customToneText}
            onChange={handleCustomChange}
            className={inputClasses}
            maxLength={100}
          />
          {toneError && (
            <span className="text-xs text-red-600">{toneError}</span>
          )}
        </div>
      )}
    </div>
  )
}
