import { HttpParams } from '@angular/common/http';

/**
 * Builds HttpParams from a filters object.
 * - Automatically adds `page`, `pageSize`, and `page_size` with defaults.
 * - Skips null, undefined, and empty string values.
 */
export function buildHttpParams(
  filters: Record<string, string | number | boolean | null | undefined>,
  defaults: { page?: number; pageSize?: number } = {}
): HttpParams {
  const page = filters['page'] ?? defaults.page ?? 1;
  const pageSize = filters['pageSize'] ?? filters['page_size'] ?? defaults.pageSize ?? 10;

  let params = new HttpParams()
    .set('page', page.toString())
    .set('pageSize', pageSize.toString())
    .set('page_size', pageSize.toString());

  for (const [key, value] of Object.entries(filters)) {
    // Skip pagination keys (already handled) and empty values
    if (['page', 'pageSize', 'page_size'].includes(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, value.toString());
  }

  return params;
}
