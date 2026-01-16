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
  smartCollection?: string;
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

// Smart collection definitions - Extended
export const SMART_COLLECTIONS = {
  // Trending
  trending: { id: 'trending', name: '🔥 Tendances du moment', color: 'hsl(0, 80%, 50%)' },
  nowPlaying: { id: 'now_playing', name: '🎬 Actuellement au cinéma', color: 'hsl(200, 80%, 50%)' },
  upcoming: { id: 'upcoming', name: '📅 Prochaines sorties', color: 'hsl(280, 80%, 50%)' },
  topRated: { id: 'top_rated', name: '⭐ Les mieux notés', color: 'hsl(45, 80%, 50%)' },
  
  // Box Office by Year
  boxOffice2025: { id: 'box_office_2025', name: '💰 Box Office 2025', color: 'hsl(120, 70%, 45%)' },
  boxOffice2024: { id: 'box_office_2024', name: '💰 Box Office 2024', color: 'hsl(120, 65%, 42%)' },
  boxOffice2023: { id: 'box_office_2023', name: '💰 Box Office 2023', color: 'hsl(120, 60%, 40%)' },
  boxOffice2022: { id: 'box_office_2022', name: '💰 Box Office 2022', color: 'hsl(120, 55%, 38%)' },
  boxOffice2021: { id: 'box_office_2021', name: '💰 Box Office 2021', color: 'hsl(120, 50%, 36%)' },
  boxOffice2020: { id: 'box_office_2020', name: '💰 Box Office 2020', color: 'hsl(120, 45%, 34%)' },
  boxOffice2019: { id: 'box_office_2019', name: '💰 Box Office 2019', color: 'hsl(120, 40%, 32%)' },
  boxOffice2018: { id: 'box_office_2018', name: '💰 Box Office 2018', color: 'hsl(120, 35%, 30%)' },
  boxOffice2017: { id: 'box_office_2017', name: '💰 Box Office 2017', color: 'hsl(120, 30%, 28%)' },
  boxOffice2016: { id: 'box_office_2016', name: '💰 Box Office 2016', color: 'hsl(120, 25%, 26%)' },
  boxOffice2015: { id: 'box_office_2015', name: '💰 Box Office 2015', color: 'hsl(120, 20%, 24%)' },
  boxOffice2010s: { id: 'box_office_2010s', name: '💰 Box Office 2010-2014', color: 'hsl(120, 15%, 22%)' },
  boxOffice2000s: { id: 'box_office_2000s', name: '💰 Box Office 2000-2009', color: 'hsl(120, 10%, 20%)' },
  boxOffice90s: { id: 'box_office_90s', name: '💰 Box Office 90s', color: 'hsl(120, 8%, 18%)' },
  
  // Studios & Universes
  marvelUniverse: { id: 'marvel', name: '🦸 Marvel Universe', color: 'hsl(0, 80%, 45%)' },
  dcUniverse: { id: 'dc', name: '🦇 DC Universe', color: 'hsl(220, 70%, 35%)' },
  disneyMagic: { id: 'disney', name: '✨ Disney Magic', color: 'hsl(200, 90%, 45%)' },
  pixarGems: { id: 'pixar', name: '🎨 Pixar Gems', color: 'hsl(35, 90%, 50%)' },
  ghibliStudio: { id: 'ghibli', name: '🌸 Studio Ghibli', color: 'hsl(150, 60%, 45%)' },
  dreamworks: { id: 'dreamworks', name: '🌙 DreamWorks', color: 'hsl(240, 60%, 50%)' },
  starWars: { id: 'starwars', name: '⚔️ Star Wars', color: 'hsl(45, 100%, 40%)' },
  harryPotter: { id: 'harrypotter', name: '⚡ Harry Potter', color: 'hsl(280, 70%, 40%)' },
  lordOfTheRings: { id: 'lotr', name: '💍 Seigneur des Anneaux', color: 'hsl(30, 60%, 35%)' },
  jamesBond: { id: 'bond', name: '🔫 James Bond', color: 'hsl(0, 0%, 20%)' },
  fastFurious: { id: 'fast', name: '🏎️ Fast & Furious', color: 'hsl(200, 90%, 40%)' },
  jurassicPark: { id: 'jurassic', name: '🦖 Jurassic Park', color: 'hsl(100, 60%, 35%)' },
  transformers: { id: 'transformers', name: '🤖 Transformers', color: 'hsl(210, 80%, 45%)' },
  missionImpossible: { id: 'mission', name: '💣 Mission Impossible', color: 'hsl(0, 70%, 45%)' },
  
  // Genres
  classics: { id: 'classics', name: '🎞️ Classiques intemporels', color: 'hsl(30, 60%, 40%)' },
  familyFavorites: { id: 'family', name: '👨‍👩‍👧‍👦 Films en famille', color: 'hsl(340, 70%, 50%)' },
  actionBlockbusters: { id: 'action', name: '💥 Blockbusters Action', color: 'hsl(15, 90%, 50%)' },
  sciFiEpics: { id: 'scifi', name: '🚀 Épopées Sci-Fi', color: 'hsl(220, 80%, 50%)' },
  horrorNights: { id: 'horror', name: '👻 Soirées Horreur', color: 'hsl(270, 50%, 30%)' },
  romanticFilms: { id: 'romance', name: '💕 Films Romantiques', color: 'hsl(330, 70%, 60%)' },
  comedyHits: { id: 'comedy', name: '😂 Comédies cultes', color: 'hsl(50, 90%, 50%)' },
  thrillerSuspense: { id: 'thriller', name: '🔪 Thriller & Suspense', color: 'hsl(0, 50%, 35%)' },
  warFilms: { id: 'war', name: '⚔️ Films de Guerre', color: 'hsl(30, 40%, 30%)' },
  musicals: { id: 'musicals', name: '🎵 Comédies Musicales', color: 'hsl(300, 70%, 55%)' },
  
  // Awards
  oscarWinners: { id: 'oscar', name: '🏆 Oscarisés', color: 'hsl(45, 100%, 50%)' },
  palmeOr: { id: 'palme', name: '🌴 Palme d\'Or Cannes', color: 'hsl(45, 90%, 45%)' },
  
  // International Cinema
  frenchCinema: { id: 'french', name: '🇫🇷 Cinéma Français', color: 'hsl(240, 70%, 50%)' },
  koreanWave: { id: 'korean', name: '🇰🇷 Cinéma Coréen', color: 'hsl(350, 70%, 50%)' },
  kDrama: { id: 'kdrama', name: '📺 K-Drama', color: 'hsl(340, 80%, 55%)' },
  japaneseFilms: { id: 'japanese', name: '🇯🇵 Cinéma Japonais', color: 'hsl(0, 0%, 30%)' },
  bollywood: { id: 'bollywood', name: '🇮🇳 Bollywood', color: 'hsl(35, 90%, 50%)' },
  spanishCinema: { id: 'spanish', name: '🇪🇸 Cinéma Espagnol', color: 'hsl(0, 80%, 50%)' },
  latinoSeries: { id: 'latino', name: '🌴 Séries Latino', color: 'hsl(40, 90%, 50%)' },
  turkishDrama: { id: 'turkish', name: '🇹🇷 Séries Turques', color: 'hsl(0, 80%, 45%)' },
  chineseCinema: { id: 'chinese', name: '🇨🇳 Cinéma Chinois', color: 'hsl(0, 80%, 40%)' },
  britishDrama: { id: 'british', name: '🇬🇧 British Drama', color: 'hsl(220, 60%, 40%)' },
  
  // TV Categories
  netflixOriginals: { id: 'netflix', name: '📺 Netflix Originals', color: 'hsl(0, 80%, 45%)' },
  disneyPlus: { id: 'disneyplus', name: '➕ Disney+', color: 'hsl(220, 80%, 50%)' },
  hboMax: { id: 'hbo', name: '📺 HBO', color: 'hsl(270, 60%, 45%)' },
  amazonPrime: { id: 'prime', name: '📦 Prime Video', color: 'hsl(195, 100%, 40%)' },
  appleTv: { id: 'appletv', name: '🍎 Apple TV+', color: 'hsl(0, 0%, 20%)' },
  
  // Special
  christmasMovies: { id: 'christmas', name: '🎄 Films de Noël', color: 'hsl(0, 70%, 45%)' },
  halloweenMovies: { id: 'halloween', name: '🎃 Films Halloween', color: 'hsl(30, 90%, 50%)' },
  superhero: { id: 'superhero', name: '🦸‍♂️ Super-héros', color: 'hsl(220, 90%, 50%)' },
} as const;