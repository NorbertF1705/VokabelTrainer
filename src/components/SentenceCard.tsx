import { Colors } from '../constants/theme';
import { splitAt } from '../utils/sentenceHighlight';
import type { ExampleSentence } from '../data/vocabulary_types';

interface SentenceCardProps {
  example: ExampleSentence;
  langLabel: string;
}

/**
 * Reine Anzeige-Komponente für den Satzmodus (v1.5) — kein eigener Screen, kein
 * Exit-Button, keine Fortschrittsleiste. Ersetzt im Eingabe-Modus (Learn.tsx) nur
 * die "Frage"-Karte; Eingabefeld und Auswertung bleiben dort unverändert.
 *
 * Zeigt den Zielsatz mit maskierter Vokabel (Lücke statt answer) und darunter den
 * deutschen Hilfssatz mit optisch hervorgehobenem nativeAnswer, damit sofort
 * erkennbar ist, welches Wort gesucht ist.
 */
export default function SentenceCard({ example, langLabel }: SentenceCardProps) {
  const targetSplit = splitAt(example.target, example.answer);
  const nativeSplit = splitAt(example.native, example.nativeAnswer);

  return (
    <div style={{ background: Colors.card, borderRadius: 16, padding: '24px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(45,27,105,0.08)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {langLabel} · Satz ergänzen
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: Colors.text, lineHeight: 1.4 }}>
        {targetSplit ? (
          <>
            {targetSplit.before}
            <span style={{
              display: 'inline-block', minWidth: 64, borderBottom: `3px solid ${Colors.purple}`,
              color: 'transparent', userSelect: 'none',
            }}>
              {targetSplit.match}
            </span>
            {targetSplit.after}
          </>
        ) : (
          example.target
        )}
      </div>

      <div style={{ width: 32, height: 2, backgroundColor: Colors.border, margin: '14px auto' }} />

      <div style={{ fontSize: 15, color: Colors.textMuted, fontWeight: 500, lineHeight: 1.4 }}>
        {nativeSplit ? (
          <>
            {nativeSplit.before}
            <strong style={{ color: Colors.purple, fontWeight: 800 }}>{nativeSplit.match}</strong>
            {nativeSplit.after}
          </>
        ) : (
          example.native
        )}
      </div>
    </div>
  );
}
