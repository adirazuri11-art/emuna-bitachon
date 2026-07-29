'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChat } from 'ai/react';
import { Send, Sparkles, X } from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';

const QUICK_PROMPTS = [
  'מזוזות לדירה חדשה — מה הגדלים הנכונים?',
  'מתנה לבר מצווה עד 500 ₪',
  'טלית לחתן, נוסח ספרד',
  'מה ההבדל בקשירת ציצית בין אשכנז לחב"ד?',
];

const GREETING =
  'שלום וברכה! אני היועץ החכם של "אמונה וביטחון". אשמח להתאים לך מוצר לפי הנוסח שלך (אשכנז / ספרד / חב"ד), האירוע והתקציב. במה אוכל לעזור?';

export function AIJudaicaAssistant() {
  const { isAssistantOpen, closeAssistant, assistantPrefill } = useUIStore();
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, append, isLoading } =
    useChat({
      api: '/api/ai/assistant',
      initialMessages: [{ id: 'greeting', role: 'assistant', content: GREETING }],
      onError: () => setApiUnavailable(true),
    });

  // שאילתה שהגיעה מסרגל החיפוש נשלחת אוטומטית ליועץ
  useEffect(() => {
    if (isAssistantOpen && assistantPrefill) {
      append({ role: 'user', content: assistantPrefill });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssistantOpen, assistantPrefill]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <>
      {/* כפתור צף */}
      <AnimatePresence>
        {!isAssistantOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => useUIStore.getState().openAssistant()}
            className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 bg-navy shadow-gold transition-transform hover:scale-110"
            aria-label="פתיחת היועץ ההלכתי"
          >
            <Sparkles className="h-6 w-6 text-gold" />
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-gold/25" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* פאנל הצ'אט */}
      <AnimatePresence>
        {isAssistantOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAssistant}
              className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl"
            >
              <header className="border-b border-gold/20 bg-navy p-4 text-cream">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                    <Sparkles className="h-5 w-5 text-gold" />
                    היועץ ההלכתי והאופנתי
                  </h2>
                  <button
                    onClick={closeAssistant}
                    className="rounded-full p-1.5 hover:bg-white/10"
                    aria-label="סגירה"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-cream/60">
                  התאמה אישית לפי נוסח, אירוע ותקציב · מבוסס Claude
                </p>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      m.role === 'user'
                        ? 'ms-auto rounded-tl-md bg-navy text-cream'
                        : 'me-auto rounded-tr-md border border-gold/20 bg-white text-navy shadow-card'
                    )}
                  >
                    {m.content}
                  </div>
                ))}

                {isLoading && (
                  <div className="me-auto flex gap-1.5 rounded-2xl border border-gold/20 bg-white px-4 py-3 shadow-card">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-gold"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                )}

                {apiUnavailable && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    היועץ עדיין לא מחובר — יש להגדיר <code dir="ltr">ANTHROPIC_API_KEY</code> בקובץ{' '}
                    <code dir="ltr">.env</code> כדי להפעיל אותו.
                  </div>
                )}

                {messages.length <= 1 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => append({ role: 'user', content: p })}
                        className="rounded-full border border-gold/30 bg-white px-3 py-1.5 text-xs text-navy transition-colors hover:border-gold hover:bg-gold/10"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-gold/20 bg-white p-3">
                <div className="gold-ring flex items-center gap-2 rounded-full bg-white px-2 py-1.5">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="שאלו על נוסח, גדלים, תקציב..."
                    className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-navy/40"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-gold transition-colors hover:bg-gold hover:text-navy disabled:opacity-40"
                    aria-label="שליחה"
                  >
                    <Send className="h-4 w-4 -scale-x-100" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[11px] text-navy/40">
                  ההמלצות אינן פסק הלכה — לשאלות מעשיות יש להיוועץ ברב מוסמך.
                </p>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
