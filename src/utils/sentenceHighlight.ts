export interface SentenceSplit {
  before: string;
  match: string;
  after: string;
}

/**
 * Zerlegt einen Satz an der ersten Fundstelle einer Teilphrase in drei Teile.
 * Wird sowohl für die Cloze-Maskierung (Zielsatz) als auch für die optische
 * Hervorhebung (deutscher Hilfssatz) verwendet. Liefert null, wenn die Phrase
 * nicht wortwörtlich im Satz vorkommt (sollte durch den Generierungs-/
 * Extraktions-Lint verhindert werden, siehe PLAN_V1.5.md Block C3).
 */
export function splitAt(sentence: string, phrase: string): SentenceSplit | null {
  const idx = sentence.indexOf(phrase);
  if (idx === -1) return null;
  return {
    before: sentence.slice(0, idx),
    match: sentence.slice(idx, idx + phrase.length),
    after: sentence.slice(idx + phrase.length),
  };
}
