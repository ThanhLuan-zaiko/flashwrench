// Lets any screen open the floating chat panel on a given thread without
// prop-drilling: ChatFab registers itself as the launcher while mounted.
type OpenHandler = (threadId?: string) => void;

let handler: OpenHandler | null = null;

export function registerChatLauncher(fn: OpenHandler): () => void {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export function openChatPanel(threadId?: string): void {
  handler?.(threadId);
}
