import { useEffect, useMemo, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { groupFilesByLanguage, LANGUAGE_LABELS } from '../config/file_config';
import type { FileId } from '../data/vocabulary_types';

interface Props {
  onClose: () => void;
}

export function FileSelectorModal({ onClose }: Props) {
  const { activeFileId, fileStates, selectFile, isSessionActive } = useLearning();
  const groups = useMemo(() => groupFilesByLanguage(), []);
  const [pendingFileId, setPendingFileId] = useState<FileId | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handlePick = async (fileId: FileId) => {
    if (fileId === activeFileId) { onClose(); return; }
    if (isSessionActive) { setPendingFileId(fileId); return; }
    await selectFile(fileId);
    onClose();
  };

  const handleConfirmSwitch = async () => {
    if (!pendingFileId) return;
    await selectFile(pendingFileId);
    setPendingFileId(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vt-selector-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--vt-surface, #fff)', width: '100%', maxWidth: '480px', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem', padding: '1.25rem', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 id="vt-selector-title" style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>
          Vokabeldatei wählen
        </h2>

        {groups.map(({ language, files }) => (
          <section key={language} style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--vt-muted, #6b7280)', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {LANGUAGE_LABELS[language]}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {files.map((file) => {
                const state = fileStates[file.id];
                const isActive = file.id === activeFileId;
                const progressCount = state ? Object.keys(state.progress).length : 0;
                const phase6Count = state ? Object.values(state.progress).filter((p) => p.box >= 6).length : 0;

                return (
                  <li key={file.id} style={{ marginBottom: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handlePick(file.id)}
                      disabled={isActive}
                      style={{
                        width: '100%', textAlign: 'left', padding: '0.75rem', borderRadius: '0.5rem',
                        border: isActive ? '2px solid var(--vt-accent, #2563eb)' : '1px solid var(--vt-border, #d1d5db)',
                        background: isActive ? 'var(--vt-accent-bg, #eff6ff)' : 'var(--vt-surface, #fff)',
                        cursor: isActive ? 'default' : 'pointer', font: 'inherit',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {file.displayName}
                        {isActive && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--vt-accent, #2563eb)' }}>· aktiv</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--vt-muted, #6b7280)', marginTop: '0.25rem' }}>
                        {progressCount > 0
                          ? `${progressCount} Vokabeln in Bearbeitung · ${phase6Count} gemeistert`
                          : 'Noch kein Fortschritt'}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--vt-border, #d1d5db)', background: 'transparent', cursor: 'pointer', font: 'inherit' }}>
            Abbrechen
          </button>
        </div>
      </div>

      {pendingFileId && <ConfirmSwitchDialog onConfirm={handleConfirmSwitch} onCancel={() => setPendingFileId(null)} />}
    </div>
  );
}

function ConfirmSwitchDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div role="alertdialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
      <div style={{ background: 'var(--vt-surface, #fff)', padding: '1.25rem', borderRadius: '0.75rem', maxWidth: '380px', width: '90%' }}>
        <p style={{ margin: '0 0 1rem' }}>
          Eine Lernsession läuft gerade. Beim Wechsel der Vokabeldatei wird die aktuelle Session beendet. Dein Lernfortschritt bleibt erhalten.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--vt-border, #d1d5db)', background: 'transparent', cursor: 'pointer', font: 'inherit' }}>
            Abbrechen
          </button>
          <button type="button" onClick={onConfirm} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: 'var(--vt-accent, #2563eb)', color: 'white', cursor: 'pointer', font: 'inherit' }}>
            Wechseln
          </button>
        </div>
      </div>
    </div>
  );
}
