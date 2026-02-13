const LANGUAGES = [
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
]

interface LanguageSelectorProps {
  value: string
  onChange: (code: string) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-blue-600 text-white text-sm rounded px-2 py-1 border-none cursor-pointer"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.code.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
