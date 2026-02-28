import createClient, { type Middleware } from "openapi-fetch";

import { ApiError, NetworkError } from "./errors.ts";
import type { paths } from "./generated/api.d.ts";

export type ApiClient = {
  client: ReturnType<typeof createClient<paths>>;
};

const errorMiddleware: Middleware = {
  async onResponse({ response }) {
    if (!response.ok) {
      const body: { error?: string; message?: string; details?: unknown } = await response
        .clone()
        .json()
        .catch(() => ({}));
      throw new ApiError(
        response.status,
        body.message || body.error || response.statusText,
        body.details,
      );
    }
  },
  async onError({ request }) {
    const url = request.url;
    throw new NetworkError({ message: `Could not connect to API at ${url}`, url });
  },
};

export function requireData<T>(result: { data?: T; error?: unknown }): T {
  if (result.data !== undefined) return result.data;
  if (result.error !== undefined) throw result.error;
  throw new Error("Unexpected empty response from API");
}

export function createApiClient(config: { apiUrl: string; apiKey: string }): ApiClient {
  const client = createClient<paths>({
    baseUrl: config.apiUrl,
    headers: { Authorization: `Bearer ${config.apiKey}` },
  });
  client.use(errorMiddleware);
  return { client };
}
