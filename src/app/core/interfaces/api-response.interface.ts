export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}
