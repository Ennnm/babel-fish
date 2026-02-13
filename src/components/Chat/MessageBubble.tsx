import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
  isTranslationOn: boolean
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageBubble({ message, isTranslationOn }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent'

  // When translation is ON and we have translated text:
  // - Customer messages: show original (customer lang) on top, translation (English) below
  // - Agent messages: show translation (customer lang) on top, original (English) below
  const showTranslation = isTranslationOn && message.translatedText

  const topText = showTranslation
    ? isAgent
      ? message.translatedText
      : message.text
    : message.text

  const bottomText = showTranslation
    ? isAgent
      ? message.text
      : message.translatedText
    : null

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isAgent
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Primary text */}
        <p className="text-sm">{topText}</p>

        {/* Translation (secondary) */}
        {bottomText && (
          <p
            className={`text-xs mt-1 italic ${
              isAgent ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            {bottomText}
          </p>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isAgent ? 'text-blue-300' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
