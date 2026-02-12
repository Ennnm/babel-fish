import { Fish } from 'lucide-react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { LanguageSelector } from './LanguageSelector'
import { ControlsRow } from './ControlsRow'
import { useChat } from '../../hooks/useChat'

const SAMPLE_CUSTOMER_MESSAGES: Record<string, string[]> = {
  zh: [
    '你好，请问GST怎么申报？',
    '我需要帮助处理公司注册',
    '发票的要求是什么？',
    '年度报告什么时候提交？',
  ],
  th: [
    'สวัสดีครับ ช่วยเรื่อง GST ได้ไหม',
    'ต้องการความช่วยเหลือเรื่องจดทะเบียนบริษัท',
    'ข้อกำหนดของใบแจ้งหนี้คืออะไร',
  ],
  vi: [
    'Xin chào, làm thế nào để khai GST?',
    'Tôi cần trợ giúp về đăng ký công ty',
    'Yêu cầu hóa đơn là gì?',
  ],
  ja: [
    'こんにちは、GSTの申告方法を教えてください',
    '会社登録について助けが必要です',
    '請求書の要件は何ですか？',
  ],
  ko: [
    '안녕하세요, GST 신고는 어떻게 하나요?',
    '회사 등록에 도움이 필요합니다',
    '청구서 요구 사항은 무엇인가요?',
  ],
}

export function ChatContainer() {
  const {
    messages,
    isLoading,
    customerLanguage,
    setCustomerLanguage,
    addMessage,
    // Fish mode
    isTranslationOn,
    isBatchTranslating,
    batchError,
    failedCount,
    retryCountdown,
    toggleTranslation,
    retryBatchTranslation,
    // Tone
    selectedTone,
    customToneText,
    toneError,
    setTone,
    setCustomTone,
    getEffectiveTone,
  } = useChat()

  const handleSendMessage = (text: string, translatedText?: string) => {
    const tone = isTranslationOn ? selectedTone : undefined
    addMessage(text, 'agent', translatedText, tone ?? undefined)
  }

  const handleSimulateCustomer = () => {
    const langMessages = SAMPLE_CUSTOMER_MESSAGES[customerLanguage] || SAMPLE_CUSTOMER_MESSAGES.zh
    const randomMsg = langMessages[Math.floor(Math.random() * langMessages.length)]
    addMessage(randomMsg, 'customer')
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-500 text-white">
        <div className="flex items-center gap-2">
          <Fish className="w-6 h-6" />
          <h1 className="text-lg font-semibold">Babel Fish</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector
            value={customerLanguage}
            onChange={setCustomerLanguage}
          />
          <button
            onClick={handleSimulateCustomer}
            disabled={isLoading || isBatchTranslating}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            + Simulate
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isTranslationOn={isTranslationOn} />

      {/* Controls Row (Fish Toggle + Tone Selector) */}
      <ControlsRow
        isTranslationOn={isTranslationOn}
        isBatchTranslating={isBatchTranslating}
        batchError={batchError}
        failedCount={failedCount}
        retryCountdown={retryCountdown}
        onToggle={toggleTranslation}
        onRetry={retryBatchTranslation}
        selectedTone={selectedTone}
        customToneText={customToneText}
        toneError={toneError}
        onToneSelect={setTone}
        onCustomToneChange={setCustomTone}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        customerLanguage={customerLanguage}
        disabled={isLoading || isBatchTranslating}
        isTranslationOn={isTranslationOn}
        tone={getEffectiveTone()}
      />
    </div>
  )
}
