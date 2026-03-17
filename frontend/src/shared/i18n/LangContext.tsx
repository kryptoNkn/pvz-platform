import { createContext, useContext, useEffect, useState } from 'react'
import type { Lang, Translations } from './translations'
import { translations } from './translations'

interface LangContextValue {
    lang: Lang
    t: Translations
    setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue>({
    lang: 'ru',
    t: translations.ru,
    setLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>(
        () => (localStorage.getItem('lang') as Lang) || 'ru'
    )

    useEffect(() => {
        const handler = (e: Event) => {
            setLangState((e as CustomEvent<Lang>).detail)
        }
        window.addEventListener('langChanged', handler)
        return () => window.removeEventListener('langChanged', handler)
    }, [])

    const setLang = (next: Lang) => {
        setLangState(next)
        localStorage.setItem('lang', next)
        document.documentElement.setAttribute('lang', next)
        window.dispatchEvent(new CustomEvent('langChanged', { detail: next }))
    }

    return (
        <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
            {children}
        </LangContext.Provider>
    )
}

export const useLang = () => useContext(LangContext)
