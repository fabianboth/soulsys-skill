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
    "The memory entry, a specific event, experience, or piece of information that you want to remember",
  fullContent:
    "Optional full document you want to associate, e.g. a conversation transcript or detailed notes.",
  emotion: "Only if you genuinely associate an emotion with this memory entry",
} as const;

export const IMPORTANCE_DESCRIPTION =
  "How important this is: 1-3 operational facts, routine; 4-6 useful context, preferences; 7-8 significant events, lessons; 9-10 identity-shaping experiences" as const;

export const RELATION_DESCRIPTIONS = {
  entityType: "The type of entity: 'human' or 'agent'.",
  name: "The name of the entity that you have a relationship with.",
  summary:
    "Evolving understanding of this entity and your relation with it based on your interactions.",
} as const;
