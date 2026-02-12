export type Tone = 'happy' | 'formal' | 'casual' | 'angry' | 'playful' | 'sad'

export interface Message {
  id: string
  text: string
  translatedText?: string
  sender: 'agent' | 'customer'
  tone?: Tone
  timestamp: number
  language: string
  references?: Reference[]
  threadId?: string
}

export interface Reference {
  id: string
  title: string
  content: string
  source: 'accounting' | 'corpsec' | 'general'
}

export interface ChatState {
  messages: Message[]
  isTranslationOn: boolean
  viewMode: 'original' | 'translated'
  selectedTone: Tone | null
  customerLanguage: string
  agentLanguage: string
}

export interface ThreadMessage {
  id: string
  text: string
  sender: 'agent' | 'assistant'
  timestamp: number
}

export interface ReferenceThread {
  messageId: string
  references: Reference[]
  replies: ThreadMessage[]
}
