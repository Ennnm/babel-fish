import { useState, useEffect, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { TranslationPreview } from './TranslationPreview'
import { translateWithRetry, applyToneWithRetry } from '../../services/llm'
import { useTTS } from '../../hooks/useTTS'
import { isTTSSupported } from '../../services/tts'

interface ChatInputProps {
  onSend: (text: string, translatedText?: string) => void
  customerLanguage: string
  disabled?: boolean
  isTranslationOn: boolean
  tone?: string
}

const DEBOUNCE_MS = 500

export function ChatInput({
  onSend,
  customerLanguage,
  disabled,
  isTranslationOn,
  tone,
}: ChatInputProps) {
  const [text, setText] = useState('')
  const [translationPreview, setTranslationPreview] = useState('')
  const [tonedOriginal, setTonedOriginal] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { speak, isPlaying: isTTSPlaying } = useTTS()

  const hasTone = !!tone
  const needsProcessing = isTranslationOn || hasTone

  // Debounced processing: tone-only, translation-only, or both
  useEffect(() => {
    if (!needsProcessing || !text.trim()) {
      setTranslationPreview('')
      setTonedOriginal('')
      setError(null)
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        if (isTranslationOn) {
          // Fish ON: translate (with or without tone)
          const result = await translateWithRetry(text, customerLanguage, tone)
          setTranslationPreview(result.translation)
          setTonedOriginal(result.tonedOriginal || '')
        } else if (hasTone) {
          // Fish OFF + Tone: just apply tone, no translation
          const toned = await applyToneWithRetry(text, tone!)
          setTonedOriginal(toned)
          setTranslationPreview('')
        }
        setError(null)
      } catch (err) {
        setError('Processing failed. You can still send the message.')
        setTranslationPreview('')
        setTonedOriginal('')
      } finally {
        setIsProcessing(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [text, customerLanguage, isTranslationOn, tone, hasTone, needsProcessing])

  const handleSend = () => {
    if (!canSend) return

    // Use toned message if available, otherwise original
    const messageText = tonedOriginal || text.trim()

    if (isTranslationOn) {
      // Fish ON: send with translation
      onSend(messageText, translationPreview || undefined)
    } else {
      // Fish OFF: send without translation
      onSend(messageText)
    }

    setText('')
    setTranslationPreview('')
    setTonedOriginal('')
    setError(null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Can send when:
  // - Have text and not disabled
  // - If processing needed, must not be actively processing
  const canSend = text.trim() && !disabled && (!needsProcessing || !isProcessing)

  const handlePlayTTS = () => {
    if (translationPreview && customerLanguage) {
      speak(translationPreview, customerLanguage)
    }
  }

  // Determine preview text and label
  const showPreview = needsProcessing && text.trim()
  const previewText = isTranslationOn ? translationPreview : tonedOriginal
  const previewLabel = isTranslationOn ? 'Translation Preview' : 'Toned Message Preview'

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Preview - show when processing is needed */}
      {showPreview && (
        <TranslationPreview
          text={previewText}
          tonedOriginal={isTranslationOn ? tonedOriginal : undefined}
          isLoading={isProcessing}
          error={error || undefined}
          label={previewLabel}
          showTTS={isTranslationOn && isTTSSupported(customerLanguage)}
          onPlayTTS={handlePlayTTS}
          isTTSPlaying={isTTSPlaying}
        />
      )}

      {/* Input Row */}
      <div className="p-4 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message in English..."
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
