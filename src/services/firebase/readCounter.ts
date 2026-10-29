type Listener = () => void;

let documentReads = 0;
const listeners = new Set<Listener>();

/** Counts documents this session asked Firestore to return. Billing is confirmed in Firebase Console. */
export function recordDocumentReads(count: number): void {
  if (!Number.isFinite(count) || count <= 0) {
    return;
  }
  documentReads += count;
  listeners.forEach((listener) => listener());
}

export function getDocumentReadCount(): number {
  return documentReads;
}

export function resetDocumentReadCount(): void {
  documentReads = 0;
  listeners.forEach((listener) => listener());
}

export function subscribeDocumentReads(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
