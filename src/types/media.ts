export interface MediaItem {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: 'movie' | 'series' | 'anime' | 'documentary';
  description?: string;
  popularity?: number;
  genres?: string[];
}

export type Category = 'films' | 'series';

export type SortOption = 'title' | 'year' | 'popularity';
export type SortDirection = 'asc' | 'desc';

export interface FilterOptions {
  yearRange?: [number, number];
  types: ('movie' | 'series' | 'anime' | 'documentary')[];
  sortBy: SortOption;
  sortDirection: SortDirection;
}
