export type ExtractionPrompt = { prompt: string; systemPrompt: string };

export type EvaluateInput = {
  formattedContent: string;
  extractionPrompt: ExtractionPrompt;
};

export type FrameworkAdapter = {
  readonly name: string;
  readAndFormat(transcriptPath: string): FormattedTranscript | null;
  evaluate(input: EvaluateInput): Promise<string>;
};

export type FormattedTranscript = {
  content: string;
  messageCount: number;
};
