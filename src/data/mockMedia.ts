import { MediaItem } from '@/types/media';

// Mock data simulating DarkiWorld API response
// In production, this would be fetched from the actual API
export const mockMovies: MediaItem[] = [
  {
    id: 'movie-1',
    title: 'Dune: Part Two',
    year: '2024',
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    type: 'movie',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
  },
  {
    id: 'movie-2',
    title: 'Oppenheimer',
    year: '2023',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    type: 'movie',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
  },
  {
    id: 'movie-3',
    title: 'Poor Things',
    year: '2023',
    poster: 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    type: 'movie',
    description: 'The incredible tale about the fantastical evolution of Bella Baxter.',
  },
  {
    id: 'movie-4',
    title: 'The Batman',
    year: '2022',
    poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    type: 'movie',
    description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate.',
  },
  {
    id: 'movie-5',
    title: 'Interstellar',
    year: '2014',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    type: 'movie',
    description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    id: 'movie-6',
    title: 'Blade Runner 2049',
    year: '2017',
    poster: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    type: 'movie',
    description: 'Young Blade Runner K uncovers a long-buried secret that leads him to track down former Blade Runner Rick Deckard.',
  },
  {
    id: 'movie-7',
    title: 'Inception',
    year: '2010',
    poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    type: 'movie',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
  },
  {
    id: 'movie-8',
    title: 'The Matrix',
    year: '1999',
    poster: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    type: 'movie',
    description: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
  },
];

export const mockSeries: MediaItem[] = [
  {
    id: 'series-1',
    title: 'The Last of Us',
    year: '2023',
    poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    type: 'series',
    description: 'Joel and Ellie traverse post-apocalyptic America in a fight for survival.',
  },
  {
    id: 'series-2',
    title: 'House of the Dragon',
    year: '2022',
    poster: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
    type: 'series',
    description: 'The story of the House Targaryen set 200 years before the events of Game of Thrones.',
  },
  {
    id: 'series-3',
    title: 'Breaking Bad',
    year: '2008',
    poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    type: 'series',
    description: 'A high school chemistry teacher diagnosed with cancer turns to manufacturing methamphetamine.',
  },
  {
    id: 'series-4',
    title: 'Stranger Things',
    year: '2016',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    type: 'series',
    description: 'When a young boy disappears, his mother and friends must confront terrifying supernatural forces.',
  },
];

export const mockAnimes: MediaItem[] = [
  {
    id: 'anime-1',
    title: 'Attack on Titan',
    year: '2013',
    poster: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
    type: 'anime',
    description: 'Humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid beings.',
  },
  {
    id: 'anime-2',
    title: 'Demon Slayer',
    year: '2019',
    poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6ydxMvp.jpg',
    type: 'anime',
    description: 'A young man seeks to restore the humanity of his demon sister and avenge his family.',
  },
  {
    id: 'anime-3',
    title: 'Jujutsu Kaisen',
    year: '2020',
    poster: 'https://image.tmdb.org/t/p/w500/hFWP5HkbVEe40hrXgtCeQxoccHE.jpg',
    type: 'anime',
    description: 'A boy swallows a cursed talisman and becomes host to a powerful curse.',
  },
  {
    id: 'anime-4',
    title: 'One Piece',
    year: '1999',
    poster: 'https://image.tmdb.org/t/p/w500/fcXdJlbSdUEeMSJFsXKsznGwwok.jpg',
    type: 'anime',
    description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate.',
  },
];

export const mockDocumentaries: MediaItem[] = [
  {
    id: 'doc-1',
    title: 'Planet Earth II',
    year: '2016',
    poster: 'https://image.tmdb.org/t/p/w500/6SLPF6FBR2xvnCuO3VLWpBZlQVF.jpg',
    type: 'documentary',
    description: 'David Attenborough returns with a new wildlife documentary that surveys the animal kingdom.',
  },
  {
    id: 'doc-2',
    title: 'The Social Dilemma',
    year: '2020',
    poster: 'https://image.tmdb.org/t/p/w500/6Kbp7TaJlBW2WPMzPPqQqSfCPqO.jpg',
    type: 'documentary',
    description: 'Explores the dangerous human impact of social networking, with tech experts sounding the alarm.',
  },
  {
    id: 'doc-3',
    title: 'Our Planet',
    year: '2019',
    poster: 'https://image.tmdb.org/t/p/w500/lmZFxXgJE3vgrciwuDib0N8CfQo.jpg',
    type: 'documentary',
    description: 'Documentary series focusing on the breadth of the diversity of habitats around the world.',
  },
];

export const getAllMedia = (): MediaItem[] => {
  return [...mockMovies, ...mockSeries, ...mockAnimes, ...mockDocumentaries];
};

export const getMovies = (): MediaItem[] => mockMovies;

export const getSeriesContent = (): MediaItem[] => {
  return [...mockSeries, ...mockAnimes, ...mockDocumentaries];
};
