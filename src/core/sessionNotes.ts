export interface SessionNote {
  url: string;
  text: string;
}

const notes: SessionNote[] = [];
let sessionResetHook: (() => void) | null = null;

export function onNotesSessionReset(hook: () => void): void {
  sessionResetHook = hook;
}

export function rememberSessionNote(url: string, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  notes.push({ url, text: trimmed });
}

export function formatSessionNotesForPrompt(maxChars = 2000): string {
  if (notes.length === 0) return '';

  let combined = notes.map(note => `${note.url}\n${note.text}`).join('\n\n');
  if (combined.length > maxChars) {
    combined = `...(earlier notes truncated)...\n${combined.slice(combined.length - maxChars)}`;
  }
  return combined;
}

export function resetSessionNotes(): void {
  notes.length = 0;
  sessionResetHook?.();
}
