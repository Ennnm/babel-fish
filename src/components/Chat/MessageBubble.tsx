import type { Message } from '../../types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAgent = message.sender === 'agent'

  // Always show customer language on top, English on bottom
  const topText = isAgent ? message.translatedText : message.text
  const bottomText = isAgent ? message.text : message.translatedText

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isAgent
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Customer language (top) */}
        {topText && <p className="text-sm">{topText}</p>}

        {/* Agent language / English (bottom) */}
        {bottomText && (
          <p
            className={`text-xs mt-1 italic ${
              isAgent ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            {bottomText}
          </p>
        )}

        {/* Fallback if no translation yet */}
        {!topText && !bottomText && <p className="text-sm">{message.text}</p>}

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
