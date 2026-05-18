import { useLearning } from '../context/LearningContext';
import { getFile } from '../config/file_config';
import type { FileManifestEntry, FileState, VocabularyItem } from '../data/vocabulary_types';

export interface ActiveFileView {
  manifest: FileManifestEntry;
  state: FileState;
  builtIn: VocabularyItem[];
  allVocabulary: VocabularyItem[];
}

/**
 * Liefert die aktive Vokabeldatei oder null im First-Run-Zustand.
 */
export function useActiveFile(): ActiveFileView | null {
  const { activeFileId, fileStates, vocabularyByFile } = useLearning();
  if (!activeFileId) return null;

  const manifest = getFile(activeFileId);
  const state = fileStates[activeFileId];
  const builtIn = vocabularyByFile[activeFileId];

  if (!manifest || !state || !builtIn) return null;

  return {
    manifest,
    state,
    builtIn,
    allVocabulary: [...builtIn, ...state.customVocabulary],
  };
}
