import { useLearning } from '../context/LearningContext';
import { groupFilesByLanguage, LANGUAGE_LABELS } from '../config/file_config';

export function FirstRun() {
  const { selectFile } = useLearning();
  const groups = groupFilesByLanguage();

  return (
    <main style={{ maxWidth: '480px', margin: '0 auto', padding: '2rem 1.25rem' }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem' }}>🎓</div>
        <h1 style={{ margin: '0.5rem 0 0.25rem' }}>Willkommen bei VokabelTrainer</h1>
        <p style={{ color: 'var(--vt-muted, #6b7280)', margin: 0 }}>
          Wähle ein Lernpaket, mit dem du starten möchtest. Du kannst später jederzeit wechseln.
        </p>
      </header>

      {groups.map(({ language, files }) => (
        <section key={language} style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '0.85rem', color: 'var(--vt-muted, #6b7280)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem' }}>
            {LANGUAGE_LABELS[language]}
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {files.map((file) => (
              <li key={file.id} style={{ marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => selectFile(file.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--vt-border, #d1d5db)', background: 'var(--vt-surface, #fff)', cursor: 'pointer', font: 'inherit' }}
                >
                  <div style={{ fontWeight: 600 }}>{file.displayName}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
