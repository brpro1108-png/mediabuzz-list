export interface MediaItem {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: 'movie' | 'series' | 'anime' | 'documentary';
  description?: string;
  popularity?: number;
  genres?: number[];
  genreNames?: string[];
  releaseDate?: string;
  collectionId?: number;
  collectionName?: string;
  smartCollection?: string; // For dynamic collections like "Box Office 2024", "Trending"
}

export interface MediaCollection {
  id: number;
  name: string;
  poster?: string;
  items: MediaItem[];
  isFullyUploaded: boolean;
}

export interface SmartCollection {
  id: string;
  name: string;
  icon: string;
  items: MediaItem[];
  color: string;
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

export interface Genre {
  id: number;
  name: string;
}

export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Aventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentaire' },
  { id: 18, name: 'Drame' },
  { id: 10751, name: 'Famille' },
  { id: 14, name: 'Fantastique' },
  { id: 36, name: 'Histoire' },
  { id: 27, name: 'Horreur' },
  { id: 10402, name: 'Musique' },
  { id: 9648, name: 'Mystère' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science-Fiction' },
  { id: 10770, name: 'Téléfilm' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Guerre' },
  { id: 37, name: 'Western' },
];

export const SERIES_GENRES: Genre[] = [
  { id: 10759, name: 'Action & Aventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentaire' },
  { id: 18, name: 'Drame' },
  { id: 10751, name: 'Famille' },
  { id: 10762, name: 'Enfants' },
  { id: 9648, name: 'Mystère' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Réalité' },
  { id: 10765, name: 'Sci-Fi & Fantastique' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'Guerre & Politique' },
  { id: 37, name: 'Western' },
];

// Smart collection definitions
export const SMART_COLLECTIONS = {
  trending: { id: 'trending', name: '🔥 Tendances du moment', color: 'hsl(0, 80%, 50%)' },
  nowPlaying: { id: 'now_playing', name: '🎬 Actuellement au cinéma', color: 'hsl(200, 80%, 50%)' },
  upcoming: { id: 'upcoming', name: '📅 Prochaines sorties', color: 'hsl(280, 80%, 50%)' },
  topRated: { id: 'top_rated', name: '⭐ Les mieux notés', color: 'hsl(45, 80%, 50%)' },
  boxOffice2024: { id: 'box_office_2024', name: '💰 Box Office 2024', color: 'hsl(120, 60%, 40%)' },
  boxOffice2023: { id: 'box_office_2023', name: '💰 Box Office 2023', color: 'hsl(120, 50%, 35%)' },
  boxOffice2022: { id: 'box_office_2022', name: '💰 Box Office 2022', color: 'hsl(120, 40%, 30%)' },
  classics: { id: 'classics', name: '🎞️ Classiques intemporels', color: 'hsl(30, 60%, 40%)' },
  familyFavorites: { id: 'family', name: '👨‍👩‍👧‍👦 Films en famille', color: 'hsl(340, 70%, 50%)' },
  actionBlockbusters: { id: 'action', name: '💥 Blockbusters Action', color: 'hsl(15, 90%, 50%)' },
  sciFiEpics: { id: 'scifi', name: '🚀 Épopées Sci-Fi', color: 'hsl(220, 80%, 50%)' },
  horrorNights: { id: 'horror', name: '👻 Soirées Horreur', color: 'hsl(270, 50%, 30%)' },
  romanticFilms: { id: 'romance', name: '💕 Films Romantiques', color: 'hsl(330, 70%, 60%)' },
  comedyHits: { id: 'comedy', name: '😂 Comédies cultes', color: 'hsl(50, 90%, 50%)' },
  oscarWinners: { id: 'oscar', name: '🏆 Oscarisés', color: 'hsl(45, 100%, 50%)' },
  marvelUniverse: { id: 'marvel', name: '🦸 Marvel Universe', color: 'hsl(0, 80%, 45%)' },
  dcUniverse: { id: 'dc', name: '🦇 DC Universe', color: 'hsl(220, 70%, 35%)' },
  disneyMagic: { id: 'disney', name: '✨ Disney Magic', color: 'hsl(200, 90%, 45%)' },
  pixarGems: { id: 'pixar', name: '🎨 Pixar Gems', color: 'hsl(35, 90%, 50%)' },
  ghibliStudio: { id: 'ghibli', name: '🌸 Studio Ghibli', color: 'hsl(150, 60%, 45%)' },
  frenchCinema: { id: 'french', name: '🇫🇷 Cinéma Français', color: 'hsl(240, 70%, 50%)' },
  koreanWave: { id: 'korean', name: '🇰🇷 Vague Coréenne', color: 'hsl(350, 70%, 50%)' },
  japaneseFilms: { id: 'japanese', name: '🇯🇵 Cinéma Japonais', color: 'hsl(0, 0%, 30%)' },
} as const;