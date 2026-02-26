export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  public readonly url: string;

  constructor({ message, url }: { message: string; url: string }) {
    super(message);
    this.url = url;
    this.name = "NetworkError";
  }
}
