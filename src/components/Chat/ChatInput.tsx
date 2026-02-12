import { useState, useEffect, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { TranslationPreview } from './TranslationPreview'
import { translateWithRetry } from '../../services/gemini'

interface ChatInputProps {
  onSend: (text: string, translatedText: string) => void
  customerLanguage: string
  disabled?: boolean
}

const DEBOUNCE_MS = 500

export function ChatInput({ onSend, customerLanguage, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [translationPreview, setTranslationPreview] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced translation with retry
  useEffect(() => {
    if (!text.trim()) {
      setTranslationPreview('')
      setError(null)
      setIsTranslating(false)
      return
    }

    setIsTranslating(true)
    setError(null)

    const timer = setTimeout(async () => {
      try {
        const translated = await translateWithRetry(text, customerLanguage)
        setTranslationPreview(translated)
        setError(null)
      } catch (err) {
        setError('Translation failed. You can still send the message.')
        setTranslationPreview('')
      } finally {
        setIsTranslating(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [text, customerLanguage])

  const handleSend = () => {
    if (!canSend) return
    onSend(text.trim(), translationPreview)
    setText('')
    setTranslationPreview('')
    setError(null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Can send when: has text, not translating, not disabled
  const canSend = text.trim() && !isTranslating && !disabled

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Translation Preview */}
      <TranslationPreview
        text={translationPreview}
        isLoading={isTranslating}
        error={error || undefined}
      />

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
          {isTranslating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
