import type { FileId } from '../data/vocabulary_types';

export const KEY_SCHEMA_VERSION = 'vt:schemaVersion';
export const KEY_ACTIVE_FILE = 'vt:activeFileId';
export const KEY_SETTINGS = 'vt:settings';
export const KEY_FILE_PREFIX = 'vt:file:';

export const fileKey = (fileId: FileId): string =>
  `${KEY_FILE_PREFIX}${fileId}`;

export const LEGACY_KEY_V12 = 'vokabeltrainer_state';
export const LEGACY_KEY_V12_BACKUP = 'vokabeltrainer_state_backup';
export const KEY_BACKUP_V12 = 'vt:backup:v1_2';

export const CURRENT_SCHEMA_VERSION = '3' as const;
