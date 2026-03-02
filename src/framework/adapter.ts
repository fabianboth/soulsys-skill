export type FrameworkAdapter = {
  readonly name: string;
  readAndFormat(transcriptPath: string): FormattedTranscript | null;
  evaluate(formattedContent: string): Promise<string>;
};

export type FormattedTranscript = {
  content: string;
  messageCount: number;
};
