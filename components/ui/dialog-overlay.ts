// Shared modal overlay: full-viewport flex container that anchors to the
// dynamic (visual) viewport via h-dvh, so mobile browser chrome can never
// cover the bottom sheet. Extra bottom padding keeps sheets off the screen
// edge; sm:p-6 restores an even margin once dialogs are centered.
const DIALOG_OVERLAY_BASE =
  "fixed inset-0 flex h-dvh items-end justify-center p-4 pb-6 sm:items-center sm:p-6";

export const DIALOG_OVERLAY_CLASSES = `${DIALOG_OVERLAY_BASE} z-50`;

// For dialogs that open on top of another dialog (confirm-discard).
export const DIALOG_OVERLAY_NESTED_CLASSES = `${DIALOG_OVERLAY_BASE} z-[60]`;
