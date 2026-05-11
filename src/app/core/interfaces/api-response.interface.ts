export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  status: number;
}

/** Matches the actual API paged result structure */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages?: number;
}

/** Standard pagination params sent as query parameters */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** @deprecated Use PagedResult instead */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}
