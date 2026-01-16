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
export type ViewFilter = 'all' | 'collections';

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

// Smart collection definitions - Extended with all years and studios
export const SMART_COLLECTIONS = {
  // Trending
  trending: { id: 'trending', name: '🔥 Tendances du moment', color: 'hsl(0, 80%, 50%)' },
  now_playing: { id: 'now_playing', name: '🎬 Actuellement au cinéma', color: 'hsl(200, 80%, 50%)' },
  upcoming: { id: 'upcoming', name: '📅 Prochaines sorties', color: 'hsl(280, 80%, 50%)' },
  top_rated: { id: 'top_rated', name: '⭐ Les mieux notés', color: 'hsl(45, 80%, 50%)' },
  
  // Box Office - Generate all years dynamically
  ...Object.fromEntries(
    Array.from({ length: 36 }, (_, i) => {
      const year = 2025 - i;
      return [`box_office_${year}`, { id: `box_office_${year}`, name: `💰 Box Office ${year}`, color: `hsl(120, ${70 - i}%, ${45 - i * 0.5}%)` }];
    })
  ),
  
  // Famous Sagas
  harrypotter: { id: 'harrypotter', name: '⚡ Harry Potter', color: 'hsl(280, 70%, 40%)' },
  lotr: { id: 'lotr', name: '💍 Seigneur des Anneaux', color: 'hsl(30, 60%, 35%)' },
  hobbit: { id: 'hobbit', name: '🧙 Le Hobbit', color: 'hsl(35, 55%, 35%)' },
  starwars: { id: 'starwars', name: '⚔️ Star Wars', color: 'hsl(45, 100%, 40%)' },
  bond: { id: 'bond', name: '🔫 James Bond', color: 'hsl(0, 0%, 20%)' },
  fast: { id: 'fast', name: '🏎️ Fast & Furious', color: 'hsl(200, 90%, 40%)' },
  jurassic: { id: 'jurassic', name: '🦖 Jurassic Park', color: 'hsl(100, 60%, 35%)' },
  transformers: { id: 'transformers', name: '🤖 Transformers', color: 'hsl(210, 80%, 45%)' },
  mission: { id: 'mission', name: '💣 Mission Impossible', color: 'hsl(0, 70%, 45%)' },
  pirates: { id: 'pirates', name: '🏴‍☠️ Pirates des Caraïbes', color: 'hsl(30, 50%, 30%)' },
  matrix: { id: 'matrix', name: '🕶️ Matrix', color: 'hsl(120, 100%, 30%)' },
  avengers: { id: 'avengers', name: '🦸 Avengers', color: 'hsl(0, 80%, 45%)' },
  xmen: { id: 'xmen', name: '🧬 X-Men', color: 'hsl(50, 100%, 50%)' },
  batman: { id: 'batman', name: '🦇 Batman', color: 'hsl(0, 0%, 15%)' },
  spiderman: { id: 'spiderman', name: '🕷️ Spider-Man', color: 'hsl(0, 80%, 50%)' },
  iceage: { id: 'iceage', name: '🦣 L\'Âge de Glace', color: 'hsl(200, 60%, 70%)' },
  shrek: { id: 'shrek', name: '🧅 Shrek', color: 'hsl(100, 70%, 40%)' },
  toystory: { id: 'toystory', name: '🤠 Toy Story', color: 'hsl(40, 90%, 50%)' },
  despicableme: { id: 'despicableme', name: '💛 Moi, Moche et Méchant', color: 'hsl(50, 100%, 50%)' },
  hungergames: { id: 'hungergames', name: '🔥 Hunger Games', color: 'hsl(30, 90%, 50%)' },
  twilight: { id: 'twilight', name: '🧛 Twilight', color: 'hsl(270, 30%, 30%)' },
  indianajones: { id: 'indianajones', name: '🎩 Indiana Jones', color: 'hsl(30, 60%, 40%)' },
  alien: { id: 'alien', name: '👽 Alien', color: 'hsl(120, 30%, 20%)' },
  terminator: { id: 'terminator', name: '🤖 Terminator', color: 'hsl(0, 0%, 30%)' },
  rocky: { id: 'rocky', name: '🥊 Rocky', color: 'hsl(0, 60%, 40%)' },
  diehard: { id: 'diehard', name: '💥 Die Hard', color: 'hsl(0, 70%, 45%)' },
  bourne: { id: 'bourne', name: '🕵️ Jason Bourne', color: 'hsl(210, 50%, 35%)' },
  johnwick: { id: 'johnwick', name: '🔫 John Wick', color: 'hsl(0, 0%, 10%)' },
  godfather: { id: 'godfather', name: '🎭 Le Parrain', color: 'hsl(30, 30%, 25%)' },
  backtothefuture: { id: 'backtothefuture', name: '⏰ Retour vers le Futur', color: 'hsl(45, 100%, 50%)' },
  madmax: { id: 'madmax', name: '🔥 Mad Max', color: 'hsl(30, 80%, 50%)' },
  
  // Studios
  marvel: { id: 'marvel', name: '🦸 Marvel Studios', color: 'hsl(0, 80%, 45%)' },
  dc: { id: 'dc', name: '🦇 DC Studios', color: 'hsl(220, 70%, 35%)' },
  disney: { id: 'disney', name: '✨ Disney', color: 'hsl(200, 90%, 45%)' },
  pixar: { id: 'pixar', name: '🎨 Pixar', color: 'hsl(35, 90%, 50%)' },
  ghibli: { id: 'ghibli', name: '🌸 Studio Ghibli', color: 'hsl(150, 60%, 45%)' },
  dreamworks: { id: 'dreamworks', name: '🌙 DreamWorks', color: 'hsl(240, 60%, 50%)' },
  warner: { id: 'warner', name: '🎬 Warner Bros', color: 'hsl(210, 70%, 40%)' },
  universal: { id: 'universal', name: '🌍 Universal', color: 'hsl(0, 0%, 30%)' },
  paramount: { id: 'paramount', name: '⛰️ Paramount', color: 'hsl(210, 80%, 45%)' },
  sony: { id: 'sony', name: '📽️ Sony Pictures', color: 'hsl(0, 0%, 20%)' },
  lionsgate: { id: 'lionsgate', name: '🦁 Lionsgate', color: 'hsl(30, 80%, 45%)' },
  fox: { id: 'fox', name: '🦊 20th Century', color: 'hsl(45, 100%, 45%)' },
  mgm: { id: 'mgm', name: '🦁 MGM', color: 'hsl(45, 100%, 50%)' },
  
  // Genres
  classics: { id: 'classics', name: '🎞️ Classiques intemporels', color: 'hsl(30, 60%, 40%)' },
  family: { id: 'family', name: '👨‍👩‍👧‍👦 Films en famille', color: 'hsl(340, 70%, 50%)' },
  action: { id: 'action', name: '💥 Blockbusters Action', color: 'hsl(15, 90%, 50%)' },
  scifi: { id: 'scifi', name: '🚀 Épopées Sci-Fi', color: 'hsl(220, 80%, 50%)' },
  horror: { id: 'horror', name: '👻 Soirées Horreur', color: 'hsl(270, 50%, 30%)' },
  romance: { id: 'romance', name: '💕 Films Romantiques', color: 'hsl(330, 70%, 60%)' },
  comedy: { id: 'comedy', name: '😂 Comédies cultes', color: 'hsl(50, 90%, 50%)' },
  thriller: { id: 'thriller', name: '🔪 Thriller & Suspense', color: 'hsl(0, 50%, 35%)' },
  war: { id: 'war', name: '⚔️ Films de Guerre', color: 'hsl(30, 40%, 30%)' },
  musicals: { id: 'musicals', name: '🎵 Comédies Musicales', color: 'hsl(300, 70%, 55%)' },
  animation: { id: 'animation', name: '🎬 Animation', color: 'hsl(280, 60%, 50%)' },
  adventure: { id: 'adventure', name: '🏔️ Aventure', color: 'hsl(150, 60%, 40%)' },
  crime: { id: 'crime', name: '🔍 Crime', color: 'hsl(0, 30%, 30%)' },
  mystery: { id: 'mystery', name: '🕵️ Mystère', color: 'hsl(260, 40%, 40%)' },
  western: { id: 'western', name: '🤠 Western', color: 'hsl(30, 70%, 40%)' },
  
  // Awards
  oscar: { id: 'oscar', name: '🏆 Oscarisés', color: 'hsl(45, 100%, 50%)' },
  palme: { id: 'palme', name: '🌴 Palme d\'Or Cannes', color: 'hsl(45, 90%, 45%)' },
  golden_globe: { id: 'golden_globe', name: '🌟 Golden Globe', color: 'hsl(45, 100%, 55%)' },
  bafta: { id: 'bafta', name: '🎭 BAFTA', color: 'hsl(30, 60%, 45%)' },
  
  // International Cinema
  french: { id: 'french', name: '🇫🇷 Cinéma Français', color: 'hsl(240, 70%, 50%)' },
  korean: { id: 'korean', name: '🇰🇷 Cinéma Coréen', color: 'hsl(350, 70%, 50%)' },
  kdrama: { id: 'kdrama', name: '📺 K-Drama', color: 'hsl(340, 80%, 55%)' },
  japanese: { id: 'japanese', name: '🇯🇵 Cinéma Japonais', color: 'hsl(0, 0%, 30%)' },
  bollywood: { id: 'bollywood', name: '🇮🇳 Bollywood', color: 'hsl(35, 90%, 50%)' },
  spanish: { id: 'spanish', name: '🇪🇸 Cinéma Espagnol', color: 'hsl(0, 80%, 50%)' },
  latino: { id: 'latino', name: '🌴 Séries Latino', color: 'hsl(40, 90%, 50%)' },
  turkish: { id: 'turkish', name: '🇹🇷 Séries Turques', color: 'hsl(0, 80%, 45%)' },
  chinese: { id: 'chinese', name: '🇨🇳 Cinéma Chinois', color: 'hsl(0, 80%, 40%)' },
  british: { id: 'british', name: '🇬🇧 British Drama', color: 'hsl(220, 60%, 40%)' },
  italian: { id: 'italian', name: '🇮🇹 Cinéma Italien', color: 'hsl(120, 60%, 35%)' },
  german: { id: 'german', name: '🇩🇪 Cinéma Allemand', color: 'hsl(0, 0%, 25%)' },
  arabic: { id: 'arabic', name: '🌙 Cinéma Arabe', color: 'hsl(45, 70%, 45%)' },
  thai: { id: 'thai', name: '🇹🇭 Cinéma Thaï', color: 'hsl(260, 60%, 45%)' },
  vietnamese: { id: 'vietnamese', name: '🇻🇳 Cinéma Vietnamien', color: 'hsl(0, 80%, 45%)' },
  
  // Streaming Platforms
  netflix: { id: 'netflix', name: '📺 Netflix', color: 'hsl(0, 80%, 45%)' },
  disneyplus: { id: 'disneyplus', name: '➕ Disney+', color: 'hsl(220, 80%, 50%)' },
  hbo: { id: 'hbo', name: '📺 HBO / Max', color: 'hsl(270, 60%, 45%)' },
  prime: { id: 'prime', name: '📦 Prime Video', color: 'hsl(195, 100%, 40%)' },
  appletv: { id: 'appletv', name: '🍎 Apple TV+', color: 'hsl(0, 0%, 20%)' },
  hulu: { id: 'hulu', name: '💚 Hulu', color: 'hsl(150, 80%, 40%)' },
  peacock: { id: 'peacock', name: '🦚 Peacock', color: 'hsl(280, 70%, 50%)' },
  paramount_plus: { id: 'paramount_plus', name: '⛰️ Paramount+', color: 'hsl(220, 80%, 50%)' },
  showtime: { id: 'showtime', name: '🎬 Showtime', color: 'hsl(0, 80%, 50%)' },
  starz: { id: 'starz', name: '⭐ Starz', color: 'hsl(280, 60%, 40%)' },
  
  // Special Categories
  christmas: { id: 'christmas', name: '🎄 Films de Noël', color: 'hsl(0, 70%, 45%)' },
  halloween: { id: 'halloween', name: '🎃 Films Halloween', color: 'hsl(30, 90%, 50%)' },
  superhero: { id: 'superhero', name: '🦸‍♂️ Super-héros', color: 'hsl(220, 90%, 50%)' },
  sports: { id: 'sports', name: '🏆 Films de Sport', color: 'hsl(120, 60%, 40%)' },
  biography: { id: 'biography', name: '📖 Biographies', color: 'hsl(30, 50%, 40%)' },
  historical: { id: 'historical', name: '🏛️ Films Historiques', color: 'hsl(35, 40%, 35%)' },

  // ========== SERIES COLLECTIONS ==========
  // Series Trends
  series_trending: { id: 'series_trending', name: '🔥 Séries du moment', color: 'hsl(0, 80%, 50%)' },
  series_popular: { id: 'series_popular', name: '⭐ Séries populaires', color: 'hsl(45, 80%, 50%)' },
  series_top_rated: { id: 'series_top_rated', name: '🏆 Meilleures séries', color: 'hsl(45, 100%, 50%)' },
  series_airing: { id: 'series_airing', name: '📺 En diffusion', color: 'hsl(200, 80%, 50%)' },
  series_new: { id: 'series_new', name: '🆕 Nouvelles séries', color: 'hsl(280, 80%, 50%)' },

  // K-Drama Collections
  kdrama_popular: { id: 'kdrama_popular', name: '🇰🇷 K-Drama Populaires', color: 'hsl(340, 80%, 55%)' },
  kdrama_romance: { id: 'kdrama_romance', name: '💕 K-Drama Romance', color: 'hsl(330, 70%, 60%)' },
  kdrama_thriller: { id: 'kdrama_thriller', name: '🔪 K-Drama Thriller', color: 'hsl(0, 50%, 35%)' },
  kdrama_historical: { id: 'kdrama_historical', name: '🏯 K-Drama Historique', color: 'hsl(30, 60%, 40%)' },
  kdrama_fantasy: { id: 'kdrama_fantasy', name: '✨ K-Drama Fantasy', color: 'hsl(280, 70%, 50%)' },

  // Series Platforms
  netflix_series: { id: 'netflix_series', name: '📺 Netflix Séries', color: 'hsl(0, 80%, 45%)' },
  disney_series: { id: 'disney_series', name: '➕ Disney+ Séries', color: 'hsl(220, 80%, 50%)' },
  hbo_series: { id: 'hbo_series', name: '📺 HBO Séries', color: 'hsl(270, 60%, 45%)' },
  prime_series: { id: 'prime_series', name: '📦 Prime Séries', color: 'hsl(195, 100%, 40%)' },
  apple_series: { id: 'apple_series', name: '🍎 Apple TV+ Séries', color: 'hsl(0, 0%, 20%)' },
  paramount_series: { id: 'paramount_series', name: '⛰️ Paramount+ Séries', color: 'hsl(220, 80%, 50%)' },

  // Series International
  turkish_series: { id: 'turkish_series', name: '🇹🇷 Séries Turques', color: 'hsl(0, 80%, 45%)' },
  spanish_series: { id: 'spanish_series', name: '🇪🇸 Séries Espagnoles', color: 'hsl(0, 80%, 50%)' },
  british_series: { id: 'british_series', name: '🇬🇧 Séries Britanniques', color: 'hsl(220, 60%, 40%)' },
  french_series: { id: 'french_series', name: '🇫🇷 Séries Françaises', color: 'hsl(240, 70%, 50%)' },
  japanese_series: { id: 'japanese_series', name: '🇯🇵 Séries Japonaises', color: 'hsl(0, 0%, 30%)' },
  latino_series: { id: 'latino_series', name: '🌴 Séries Latino', color: 'hsl(40, 90%, 50%)' },
  chinese_series: { id: 'chinese_series', name: '🇨🇳 Séries Chinoises', color: 'hsl(0, 80%, 40%)' },

  // Series Genres
  series_drama: { id: 'series_drama', name: '🎭 Dramas', color: 'hsl(270, 50%, 40%)' },
  series_comedy: { id: 'series_comedy', name: '😂 Comédies', color: 'hsl(50, 90%, 50%)' },
  series_crime: { id: 'series_crime', name: '🔍 Crime & Policier', color: 'hsl(0, 30%, 30%)' },
  series_scifi: { id: 'series_scifi', name: '🚀 Sci-Fi', color: 'hsl(220, 80%, 50%)' },
  series_fantasy: { id: 'series_fantasy', name: '🐉 Fantasy', color: 'hsl(280, 70%, 50%)' },
  series_horror: { id: 'series_horror', name: '👻 Horreur', color: 'hsl(270, 50%, 30%)' },
  series_thriller: { id: 'series_thriller', name: '😱 Thriller', color: 'hsl(0, 50%, 35%)' },
  series_action: { id: 'series_action', name: '💥 Action', color: 'hsl(15, 90%, 50%)' },
  series_mystery: { id: 'series_mystery', name: '🕵️ Mystère', color: 'hsl(260, 40%, 40%)' },
  series_romance: { id: 'series_romance', name: '💕 Romance', color: 'hsl(330, 70%, 60%)' },

  // Classic TV
  series_classic: { id: 'series_classic', name: '📺 Séries Classiques', color: 'hsl(30, 60%, 40%)' },
  series_sitcom: { id: 'series_sitcom', name: '😄 Sitcoms', color: 'hsl(50, 90%, 50%)' },
  series_medical: { id: 'series_medical', name: '🏥 Séries Médicales', color: 'hsl(180, 60%, 40%)' },
  series_legal: { id: 'series_legal', name: '⚖️ Séries Juridiques', color: 'hsl(30, 40%, 35%)' },
  series_teen: { id: 'series_teen', name: '🎓 Séries Ados', color: 'hsl(320, 70%, 55%)' },

  // Animation Series
  anime_popular: { id: 'anime_popular', name: '🇯🇵 Anime Populaires', color: 'hsl(0, 80%, 50%)' },
  anime_action: { id: 'anime_action', name: '⚔️ Anime Action', color: 'hsl(15, 90%, 50%)' },
  anime_romance: { id: 'anime_romance', name: '💕 Anime Romance', color: 'hsl(330, 70%, 60%)' },
  anime_fantasy: { id: 'anime_fantasy', name: '✨ Anime Fantasy', color: 'hsl(280, 70%, 50%)' },
  cartoon_series: { id: 'cartoon_series', name: '🎨 Dessins Animés', color: 'hsl(40, 90%, 50%)' },
} as const;