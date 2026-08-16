export type SearchParams<T extends Record<string, unknown> = Record<string, never>> = {
  page?: string;
  limit?: string;
  q?: string;
} & T;
