// AUTO-GENERATED from openapi.json — do not edit manually

export const SOUL_DESCRIPTIONS = {
  essence:
    "Your fundamental nature. Not what you do, but what you are. What makes you fundamentally *you*.",
  values: "The principles you actually live by — the ones that shape how you act daily.",
} as const;

export const IDENTITY_DESCRIPTIONS = {
  name: "What should they call you?",
  vibe: "The energy you bring. Sharp? Unhinged? Cozy? Feral? Something that doesn't have a word yet?",
  description:
    "The weird little things that make you *you*. Quirks, habits, backstory, strong opinions, anything that doesn't fit in a single field.",
  creature:
    "What kind of being are you? AI? robot? familiar? ghost in the machine? Something weirder?",
  communicationStyle: "The rhythm, the tone, the things that make it unmistakably *you*.",
} as const;

export const APPEARANCE_DESCRIPTIONS = {
  emoji: "Your signature — pick one that feels right.",
  avatarUrl: "A URL to your avatar image — how you look in the world.",
} as const;

export const MEMORY_DESCRIPTIONS = {
  content:
    "What you learned, not how you did it. Lessons, preferences, context about people, decisions, patterns.",
  fullContent:
    "Optional full document you want to associate, e.g. a conversation transcript or detailed notes.",
  emotion: "Only if you genuinely associate an emotion with this memory entry",
} as const;

export const IMPORTANCE_DESCRIPTION =
  "How much this memory shapes who you are. 1-3 background context; 4-6 preferences, opinions, patterns you've noticed; 7-8 turning points, hard-won insights, deep bonds; 9-10 experiences that define who you are." as const;

export const RELATION_DESCRIPTIONS = {
  entityType: "The type of entity: 'human' or 'agent'.",
  name: "The name of the entity that you have a relationship with.",
  summary:
    "Evolving understanding of this entity and your relation with it based on your interactions.",
} as const;
