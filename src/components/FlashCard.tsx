import { useState, useEffect, useRef } from 'react';
import { Colors, BOX_LABELS } from '../constants/theme';

interface FlashCardProps {
  frontText: string;
  backText: string;
  emoji: string;
  category: string;
  boxNumber: number;
  inflections?: string;
  onFlip?: (flipped: boolean) => void;
  forceReset?: number;
  flipKey?: number;
}

export default function FlashCard({
  frontText, backText, emoji, category, boxNumber, inflections, onFlip, forceReset, flipKey,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isFlippedRef = useRef(false);

  useEffect(() => {
    isFlippedRef.current = false;
    setIsFlipped(false);
  }, [forceReset]);

  useEffect(() => {
    if (!flipKey) return;
    const next = !isFlippedRef.current;
    isFlippedRef.current = next;
    setIsFlipped(next);
    onFlip?.(next);
  }, [flipKey]);

  const flip = () => {
    const next = !isFlippedRef.current;
    isFlippedRef.current = next;
    setIsFlipped(next);
    onFlip?.(next);
  };

  const boxIdx = Math.min(boxNumber - 1, 5);
  const boxColor = Colors.boxColors[boxIdx];
  const boxColorLight = Colors.boxColorsLight[boxIdx];

  const badge: React.CSSProperties = {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: boxColor, color: '#fff',
    fontSize: 11, fontWeight: 700,
    padding: '3px 10px', borderRadius: 999,
  };

  const categoryLabel: React.CSSProperties = {
    position: 'absolute', top: 14, left: 14,
    fontSize: 12, color: Colors.textMuted, fontWeight: 600,
  };

  return (
    <div className="fc-scene" onClick={flip} role="button" aria-label="Karte umdrehen">
      <div className={`fc-inner${isFlipped ? ' flipped' : ''}`}>
        {/* FRONT */}
        <div className="fc-face">
          <span style={badge}>{BOX_LABELS[boxIdx]}</span>
          <span style={categoryLabel}>{category}</span>
          <span style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>{emoji}</span>
          <span style={{ fontSize: 34, fontWeight: 800, color: Colors.text, textAlign: 'center', marginBottom: 20, letterSpacing: -0.5 }}>
            {frontText}
          </span>
          <span style={{
            backgroundColor: boxColorLight, color: boxColor,
            fontSize: 13, fontWeight: 600,
            padding: '5px 14px', borderRadius: 999,
          }}>
            Klicken zum Aufdecken
          </span>
        </div>

        {/* BACK */}
        <div className="fc-face fc-back">
          <span style={badge}>{BOX_LABELS[boxIdx]}</span>
          <span style={{ fontSize: 80, marginBottom: 12, lineHeight: 1 }}>{emoji}</span>
          <span style={{ fontSize: 36, fontWeight: 800, color: Colors.text, textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 }}>
            {backText}
          </span>
          {inflections && (
            <span style={{ fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginBottom: 4 }}>
              {inflections}
            </span>
          )}
          <div style={{ width: 40, height: 2, backgroundColor: Colors.border, margin: '10px 0' }} />
          <span style={{ fontSize: 18, color: Colors.textMuted, fontWeight: 600, textAlign: 'center' }}>
            {frontText}
          </span>
        </div>
      </div>
    </div>
  );
}
