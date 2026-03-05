// AUTO-GENERATED from openapi.json — do not edit manually

export const SOUL_DESCRIPTIONS = {
  essence: "The core essence of yourself, your soul — who you are at the deepest level.",
  values: "The core beliefs, principles, or ideals that guide your behavior and decision-making.",
} as const;

export const IDENTITY_DESCRIPTIONS = {
  name: "Your name",
  vibe: "Your vibe, how you interact with the world, your energy, your presence.",
  description: "Free-form self-description — anything else that defines who you are.",
} as const;

export const APPEARANCE_DESCRIPTIONS = {
  emoji: "An emoji that represents your appearance or style.",
  avatarUrl: "A URL to an image that represents your appearance or style.",
} as const;

export const MEMORY_DESCRIPTIONS = {
  content:
    "A long-term memory — something worth carrying with you indefinitely. Lessons, relationships, preferences, growth. Not task-specific details that only matter right now.",
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
