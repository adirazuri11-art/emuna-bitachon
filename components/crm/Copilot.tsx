'use client';

import { useChat } from 'ai/react';
import { Sparkles, Send, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'תן לי סיכום קצר של מצב העסק',
  'כמה חברי מועדון הצטרפו החודש?',
  'מה הפעולה הכי חשובה שכדאי לי לעשות היום?',
  'מה קורה במאתר המתנה?',
];

export function Copilot() {
  const { messages, input, handleInputChange, handleSubmit, append, isLoading } = useChat({
    api: '/api/crm/copilot',
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gold/20 bg-white/5">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15">
          <Sparkles className="h-4 w-4 text-gold" />
        </span>
        <div>
          <div className="font-display font-bold text-cream">Copilot עסקי</div>
          <div className="text-[11px] text-cream/40">שואל בעברית — עונה מהנתונים האמיתיים בלבד</div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ maxHeight: 340 }}>
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-cream/50">נסו לשאול:</p>
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => append({ role: 'user', content: q })}
                className="block w-full rounded-xl border border-gold/15 bg-white/5 px-4 py-2.5 text-start text-sm text-cream/80 transition-colors hover:border-gold/50 hover:text-gold"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={m.role === 'user' ? 'flex justify-start' : 'flex justify-end'}
            >
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-tr-sm bg-navy px-4 py-2.5 text-sm text-cream'
                    : 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm leading-relaxed text-cream/90'
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-cream/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> חושב…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="שאלו על העסק…"
            className="flex-1 rounded-full border border-gold/20 bg-white/10 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-l from-gold to-gold-soft text-navy transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
