import type { ThreadCategory } from "@/lib/threads-store";

export interface ThreadConfig {
  /** localStorage key for the id→token map of posts you own. */
  storageKey: string;
  /** Whether to show the Lost / Found toggle. */
  showKind: boolean;
  newButton: string;
  cancelButton: string;
  formTitle: string;
  formIntro: string;
  titleLabel: string;
  titlePlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  submitLabel: string;
  /** Whether the contact fields appear on the post form. */
  showContact: boolean;
  /** Whether a photo can be attached to the post. */
  showImage: boolean;
  emptyEmoji: string;
  emptyTitle: string;
  emptyText: string;
  emptyCta: string;
  /** Count-label parts: noun (singular), noun (plural), and the zero-state phrase. */
  countOne: string;
  countMany: string;
  countZero: string;
  /** Confirmation shown after a successful post. */
  successNote: string;
}

export const THREAD_CONFIG: Record<ThreadCategory, ThreadConfig> = {
  "lost-found": {
    storageKey: "od_my_lostfound",
    showKind: true,
    showContact: true,
    showImage: true,
    newButton: "+ Post an item",
    cancelButton: "✕ Cancel",
    formTitle: "Lost or found something?",
    formIntro:
      "Post it here so it can find its way home. Neighbours can reply with tips.",
    titleLabel: "What is it?",
    titlePlaceholder: "e.g. Set of keys, grey scarf, black umbrella…",
    bodyLabel: "Details",
    bodyPlaceholder: "Where, when, any distinguishing marks…",
    submitLabel: "Post",
    emptyEmoji: "🧦",
    emptyTitle: "Nothing lost or found yet",
    emptyText:
      "Dropped your keys or found a stray glove in the lobby? Post it here.",
    emptyCta: "Post the first item",
    countOne: "item",
    countMany: "items",
    countZero: "Nothing lost or found yet",
    successNote: "Posted — neighbours can see it now",
  },
  recommendations: {
    storageKey: "od_my_recommendations",
    showKind: false,
    showContact: false,
    showImage: false,
    newButton: "+ Ask neighbours",
    cancelButton: "✕ Cancel",
    formTitle: "Ask the neighbourhood",
    formIntro:
      "Looking for a good plumber, dentist, or the best nearby coffee? Ask and let neighbours chime in.",
    titleLabel: "Your question",
    titlePlaceholder: "e.g. Best nearby coffee? A reliable handyman?",
    bodyLabel: "Anything to add?",
    bodyPlaceholder: "Extra context (optional)",
    submitLabel: "Ask",
    emptyEmoji: "💡",
    emptyTitle: "No questions yet",
    emptyText:
      "Need a recommendation? Ask the neighbourhood — someone always knows a guy.",
    emptyCta: "Ask the first question",
    countOne: "question",
    countMany: "questions",
    countZero: "No questions yet",
    successNote: "Your question is live — neighbours can chime in",
  },
};
