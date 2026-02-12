import { useCallback, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { translateWithRetry } from '../services/gemini'
import type { Message, Tone } from '../types'

const STORAGE_KEY = 'babel-fish-messages'

export function useChat() {
  const [messages, setMessages] = useLocalStorage<Message[]>(STORAGE_KEY, [])
  const [isLoading, setIsLoading] = useState(false)
  const [customerLanguage, setCustomerLanguage] = useState('zh')
  const agentLanguage = 'en'

  const generateId = () => crypto.randomUUID()

  const addMessage = useCallback(
    async (
      text: string,
      sender: 'agent' | 'customer',
      translatedText?: string,
      tone?: Tone
    ) => {
      const language = sender === 'agent' ? agentLanguage : customerLanguage
      const translatedLanguage = sender === 'agent' ? customerLanguage : agentLanguage

      const newMessage: Message = {
        id: generateId(),
        text,
        translatedText,
        sender,
        timestamp: Date.now(),
        language,
        translatedLanguage,
        tone,
      }

      // Add message immediately
      setMessages((prev) => [...prev, newMessage])

      // For customer messages without translation: translate to English
      if (sender === 'customer' && !translatedText) {
        setIsLoading(true)
        try {
          const translated = await translateWithRetry(text, agentLanguage)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newMessage.id ? { ...msg, translatedText: translated } : msg
            )
          )
        } catch (error) {
          console.error('Translation failed:', error)
        } finally {
          setIsLoading(false)
        }
      }
    },
    [customerLanguage, agentLanguage, setMessages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [setMessages])

  return {
    messages,
    isLoading,
    customerLanguage,
    agentLanguage,
    setCustomerLanguage,
    addMessage,
    clearMessages,
  }
}
