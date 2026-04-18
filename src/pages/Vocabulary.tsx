import { useState, useMemo } from 'react';
import { useLearning } from '../context/LearningContext';
import { Language } from '../context/LearningContext';
import { ALL_CATEGORIES, Category, VocabularyItem } from '../data/vocabulary';
import { Colors } from '../constants/theme';

export default function Vocabulary() {
  const { allVocabulary, selectedLanguage, getCardProgress, addCustomVocabulary, deleteCustomVocabulary } = useLearning();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Alle'>('Alle');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formLang, setFormLang] = useState<Language>(selectedLanguage);
  const [form, setForm] = useState({ german: '', translation: '', emoji: '📝', category: 'Diverses' as Category, inflections: '' });

  const filtered = useMemo(() => allVocabulary.filter(v => {
    const matchesSearch = !search || [v.german, v.translation].some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'Alle' || v.category === selectedCategory;
    return matchesSearch && matchesCat;
  }), [allVocabulary, search, selectedCategory]);

  const foreignLabel = formLang === 'english' ? 'Englisch *' : 'Spanisch *';
  const foreignPlaceholder = formLang === 'english' ? 'English word' : 'Palabra en español';

  const openAddModal = () => {
    setFormLang(selectedLanguage);
    setForm({ german: '', translation: '', emoji: '📝', category: 'Diverses', inflections: '' });
    setShowAddModal(true);
  };

  const handleAdd = () => {
    if (!form.german.trim() || !form.translation.trim()) {
      alert(`Bitte Deutsch und ${formLang === 'english' ? 'Englisch' : 'Spanisch'} ausfüllen.`);
      return;
    }
    addCustomVocabulary({ german: form.german.trim(), translation: form.translation.trim(), emoji: form.emoji.trim() || '📝', category: form.category, inflections: form.inflections.trim() || undefined }, formLang);
    setForm({ german: '', translation: '', emoji: '📝', category: 'Diverses', inflections: '' });
    setShowAddModal(false);
  };

  const handleDelete = (item: VocabularyItem) => {
    if (window.confirm(`"${item.german}" wirklich löschen?`)) {
      deleteCustomVocabulary(item.id);
    }
  };

  const categories: (Category | 'Alle')[] = ['Alle', ...ALL_CATEGORIES];

  return (
    <div style={{ background: Colors.background, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #2D1B69, #5B2D8E)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>📚 Vokabeln</span>
        <button
          onClick={openAddModal}
          style={{ background: Colors.accent, border: 'none', borderRadius: 999, padding: '7px 16px', fontSize: 14, fontWeight: 800, color: Colors.text, cursor: 'pointer' }}
        >
          + Neu
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Suchen..."
          style={{ flex: 1, background: Colors.card, border: '1.5px solid ' + Colors.border, borderRadius: 10, padding: '9px 14px', fontSize: 15, color: Colors.text, boxShadow: '0 2px 6px rgba(45,27,105,0.06)' }}
        />
        <span style={{ fontSize: 12, color: Colors.textMuted, fontWeight: 600, minWidth: 70 }}>{filtered.length} Vokabeln</span>
      </div>

      {/* Category Filter */}
      <div style={{ overflowX: 'auto', paddingBottom: 6, flexShrink: 0, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ display: 'flex', gap: 8, padding: '0 20px', width: 'max-content' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                background: selectedCategory === cat ? '#EDE8FF' : Colors.card,
                borderColor: selectedCategory === cat ? Colors.purple : 'transparent',
                color: selectedCategory === cat ? Colors.purple : Colors.textMuted,
              }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
        {filtered.map(item => {
          const prog = getCardProgress(item.id, selectedLanguage);
          const boxColor = Colors.boxColors[Math.min(prog.box - 1, 5)];
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: Colors.card, borderRadius: 12, padding: '12px 14px', marginBottom: 8, gap: 12, boxShadow: '0 2px 6px rgba(45,27,105,0.06)' }}>
              <span style={{ fontSize: 28, width: 36, textAlign: 'center' }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: Colors.text }}>{item.german}</div>
                <div style={{ fontSize: 14, color: Colors.secondary, fontWeight: 600 }}>
                  {item.translation}
                  {item.inflections && <span style={{ fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', fontWeight: 400 }}> {item.inflections}</span>}
                </div>
                <div style={{ fontSize: 11, color: Colors.textMuted, fontWeight: 500, marginTop: 2 }}>{item.category}</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: boxColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>{prog.box}</span>
              </div>
              {item.isCustom && (
                <button onClick={() => handleDelete(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, flexShrink: 0 }}>🗑️</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 20px 40px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: Colors.border, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 900, color: Colors.text, marginBottom: 12 }}>Neue Vokabel</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Sprache *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['english', 'spanish'] as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setFormLang(lang)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                      background: formLang === lang ? '#EDE8FF' : Colors.background,
                      borderColor: formLang === lang ? Colors.purple : Colors.border,
                      color: formLang === lang ? Colors.purple : Colors.textMuted,
                    }}
                  >
                    {lang === 'english' ? '🇬🇧 Englisch' : '🇪🇸 Spanisch'}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Emoji', key: 'emoji', placeholder: '📝' },
              { label: 'Deutsch *', key: 'german', placeholder: 'Deutsches Wort' },
              { label: foreignLabel, key: 'translation', placeholder: foreignPlaceholder },
              { label: 'Beugungsformen (optional)', key: 'inflections', placeholder: 'z.B. [dogs] oder [lief, gelaufen]' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', background: Colors.background, border: '1.5px solid ' + Colors.border, borderRadius: 10, padding: '10px 14px', fontSize: 15, color: Colors.text }}
                />
              </div>
            ))}

            <label style={{ fontSize: 12, fontWeight: 700, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Kategorie</label>
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                {ALL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: form.category === cat ? '#EDE8FF' : Colors.card, borderColor: form.category === cat ? Colors.purple : 'transparent', color: form.category === cat ? Colors.purple : Colors.textMuted }}
                  >{cat}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '13px 0', background: Colors.background, border: '1.5px solid ' + Colors.border, borderRadius: 12, fontSize: 15, fontWeight: 700, color: Colors.textMuted, cursor: 'pointer' }}>
                Abbrechen
              </button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '13px 0', background: 'linear-gradient(90deg, #A78BFA, #7C3AED)', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer' }}>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
