import { useState, useEffect, useCallback, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { TranslationPreview } from './TranslationPreview'
import { VoiceInputPreview } from './VoiceInputPreview'
import { RecordButton } from './RecordButton'
import {
  translateWithRetry,
  applyToneWithRetry,
  cleanupTranscriptWithFallback,
} from '../../services/llm'
import { transcribeAudio } from '../../services/stt'
import { useTTS } from '../../hooks/useTTS'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { isTTSSupported } from '../../services/tts'

interface ChatInputProps {
  onSend: (text: string, translatedText?: string) => void
  customerLanguage: string
  disabled?: boolean
  isTranslationOn: boolean
  tone?: string
}

const DEBOUNCE_MS = 500

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

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

  // TTS hook
  const { speak, isPlaying: isTTSPlaying } = useTTS()

  // Voice recording state
  const {
    isRecording,
    duration,
    error: recordingError,
    startRecording,
    stopRecording,
    clearError: clearRecordingError,
  } = useVoiceRecorder()

  // Voice input state
  const [voiceRawText, setVoiceRawText] = useState('')
  const [voiceCleanedText, setVoiceCleanedText] = useState('')
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null)

  const hasTone = !!tone
  const needsProcessing = isTranslationOn || hasTone

  // Clear voice preview when user types manually
  const handleTextChange = (newText: string) => {
    setText(newText)
    // Clear voice preview if user is typing
    if (voiceCleanedText || voiceRawText) {
      setVoiceCleanedText('')
      setVoiceRawText('')
      setVoiceWarning(null)
    }
  }

  // Handle voice recording
  const handleRecordStart = useCallback(() => {
    if (disabled || isProcessing || isVoiceProcessing) return
    clearRecordingError()
    setVoiceError(null)
    startRecording()
  }, [disabled, isProcessing, isVoiceProcessing, clearRecordingError, startRecording])

  const handleRecordStop = useCallback(async () => {
    const audioBlob = await stopRecording()
    if (!audioBlob) return

    setIsVoiceProcessing(true)
    setVoiceError(null)
    setVoiceWarning(null)

    try {
      // Step 1: Transcribe audio
      const rawTranscript = await transcribeAudio(audioBlob)
      setVoiceRawText(rawTranscript)

      // Step 2: Cleanup transcript (with fallback)
      const result = await cleanupTranscriptWithFallback(rawTranscript)
      setVoiceCleanedText(result.cleaned)

      if (result.usedFallback) {
        setVoiceWarning('Cleanup failed, using raw transcript')
      }

      // Set the cleaned text in the input box
      setText(result.cleaned)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice processing failed'
      setVoiceError(message)
      setVoiceRawText('')
      setVoiceCleanedText('')
    } finally {
      setIsVoiceProcessing(false)
    }
  }, [stopRecording])

  const handleRecordLeave = useCallback(() => {
    // Stop recording if user drags away from button
    if (isRecording) {
      handleRecordStop()
    }
  }, [isRecording, handleRecordStop])

  const dismissVoicePreview = useCallback(() => {
    setVoiceCleanedText('')
    setVoiceRawText('')
    setVoiceWarning(null)
    setVoiceError(null)
  }, [])

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

    // Clear voice preview on send
    dismissVoicePreview()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Can send when:
  // - Have text and not disabled
  // - Not recording or processing voice
  // - If processing needed, must not be actively processing
  const canSend =
    text.trim() &&
    !disabled &&
    !isRecording &&
    !isVoiceProcessing &&
    (!needsProcessing || !isProcessing)

  // Can record when:
  // - Not disabled
  // - Not currently processing anything
  const canRecord = !disabled && !isProcessing && !isVoiceProcessing

  const handlePlayTTS = () => {
    if (translationPreview && customerLanguage) {
      speak(translationPreview, customerLanguage)
    }
  }

  // Determine preview text and label
  const showTranslationPreview = needsProcessing && text.trim()
  const previewText = isTranslationOn ? translationPreview : tonedOriginal
  const previewLabel = isTranslationOn ? 'Translation Preview' : 'Toned Message Preview'

  // Show voice preview if we have voice data or are processing
  const showVoicePreview =
    isVoiceProcessing || voiceCleanedText || voiceRawText || voiceError || recordingError

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Voice Input Preview */}
      {showVoicePreview && (
        <VoiceInputPreview
          cleanedText={voiceCleanedText}
          rawText={voiceRawText}
          isProcessing={isVoiceProcessing}
          error={voiceError || recordingError || undefined}
          warning={voiceWarning || undefined}
          onDismiss={dismissVoicePreview}
        />
      )}

      {/* Translation/Tone Preview - show when processing is needed */}
      {showTranslationPreview && (
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
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording ? `Recording... ${formatDuration(duration)}` : 'Type a message in English...'
          }
          disabled={disabled || isRecording}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />

        {/* Record Button */}
        <RecordButton
          isRecording={isRecording}
          duration={duration}
          disabled={!canRecord}
          onMouseDown={handleRecordStart}
          onMouseUp={handleRecordStop}
          onMouseLeave={handleRecordLeave}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing || isVoiceProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  )
}
