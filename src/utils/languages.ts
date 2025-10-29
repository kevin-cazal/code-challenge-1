type Language = 'python' | 'c' | 'lua';

const LANGUAGE_EXTENSIONS: Record<Language, string> = {
  python: 'py',
  c: 'c',
  lua: 'lua',
};

export function getLanguageExtension(language: Language): string {
  return LANGUAGE_EXTENSIONS[language];
}

export type { Language };