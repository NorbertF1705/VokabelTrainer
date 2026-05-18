import { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { getFile } from '../config/file_config';
import { FileSelectorModal } from './FileSelectorModal';

export function FileSelectorButton() {
  const { activeFileId } = useLearning();
  const [open, setOpen] = useState(false);
  const file = getFile(activeFileId);

  if (!file) return null;

  return (
    <>
      <button
        type="button"
        className="vt-file-selector-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Vokabeldatei wechseln (aktuell: ${file.displayName})`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--vt-border, #d1d5db)',
          background: 'var(--vt-surface, #fff)',
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        <span>{file.shortLabel}</span>
        <span aria-hidden="true" style={{ opacity: 0.6 }}>▾</span>
      </button>

      {open && <FileSelectorModal onClose={() => setOpen(false)} />}
    </>
  );
}
