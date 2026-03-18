export type MediaType = "movie" | "series";

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  airDate: string;
  isWatched: boolean;
  watchProgress?: number;
}

export interface Season {
  id: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Media {
  id: string;
  title: string;
  type: MediaType;
  genre: string[];
  year: number;
  rating: string;
  score: number;
  duration?: string;
  description: string;
  thumbnail: string;
  backdrop: string;
  cast: string[];
  director?: string;
  seasons?: Season[];
  isTrending?: boolean;
  isNew?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  watchProgress?: number;
  matchPercentage?: number;
}

const THUMBNAILS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1586899028174-e7098604235b?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=300&h=450&fit=crop",
  "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=300&h=450&fit=crop",
];

const BACKDROPS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=800&h=500&fit=crop",
];

function makeEpisodes(count: number): Episode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ep-${i + 1}`,
    episodeNumber: i + 1,
    title: [
      "Pilot", "The Beginning", "Shadows", "Revelations", "Broken", 
      "Into the Dark", "Resurrection", "End Game", "Finale", "Aftermath"
    ][i % 10],
    description: "A gripping episode filled with twists and turns that will leave you on the edge of your seat.",
    duration: `${40 + Math.floor(Math.random() * 20)}m`,
    thumbnail: THUMBNAILS[i % THUMBNAILS.length],
    airDate: `2024-0${(i % 9) + 1}-${(i % 28) + 1 < 10 ? "0" : ""}${(i % 28) + 1}`,
    isWatched: i < 3,
    watchProgress: i === 3 ? 0.45 : undefined,
  }));
}

export const ALL_MEDIA: Media[] = [
  {
    id: "1",
    title: "Dark Horizon",
    type: "series",
    genre: ["Sci-Fi", "Thriller"],
    year: 2024,
    rating: "TV-MA",
    score: 9.1,
    description: "In a near-future world, a rogue AI begins to rewrite human memory. A team of specialists must stop it before reality collapses entirely.",
    thumbnail: THUMBNAILS[0],
    backdrop: BACKDROPS[0],
    cast: ["Sophia Reyes", "Marcus Webb", "Luna Park", "Derek Stone"],
    director: "Ava Chen",
    isTrending: true,
    matchPercentage: 97,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(8) },
      { id: "s2", seasonNumber: 2, episodes: makeEpisodes(10) },
    ],
  },
  {
    id: "2",
    title: "The Last Ember",
    type: "movie",
    genre: ["Drama", "Action"],
    year: 2024,
    rating: "R",
    score: 8.7,
    duration: "2h 14m",
    description: "When a wildfire consumes an entire national park, one veteran firefighter makes a sacrifice that changes everything.",
    thumbnail: THUMBNAILS[1],
    backdrop: BACKDROPS[1],
    cast: ["James Hart", "Elena Cruz", "Noah Park"],
    director: "Marcus Reed",
    isTrending: true,
    isNew: true,
    matchPercentage: 94,
  },
  {
    id: "3",
    title: "Phantom Protocol",
    type: "series",
    genre: ["Spy", "Action"],
    year: 2023,
    rating: "TV-14",
    score: 8.5,
    description: "An underground network of sleeper agents is activated after 20 years of dormancy. A retired spy must return to stop them.",
    thumbnail: THUMBNAILS[2],
    backdrop: BACKDROPS[2],
    cast: ["Grace Liu", "Sean Miller", "Raj Kapoor"],
    director: "Leila Shah",
    matchPercentage: 91,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(6) },
      { id: "s2", seasonNumber: 2, episodes: makeEpisodes(8) },
      { id: "s3", seasonNumber: 3, episodes: makeEpisodes(8) },
    ],
  },
  {
    id: "4",
    title: "Neon Requiem",
    type: "movie",
    genre: ["Noir", "Crime"],
    year: 2024,
    rating: "R",
    score: 8.9,
    duration: "1h 58m",
    description: "A detective in a rain-soaked future city uncovers a conspiracy that reaches the highest levels of power.",
    thumbnail: THUMBNAILS[3],
    backdrop: BACKDROPS[3],
    cast: ["Viktor Strand", "Aiko Tanaka", "Louis Vega"],
    director: "Theo Black",
    isNew: true,
    matchPercentage: 89,
  },
  {
    id: "5",
    title: "Echoes",
    type: "series",
    genre: ["Mystery", "Drama"],
    year: 2023,
    rating: "TV-MA",
    score: 9.3,
    description: "Identical twins living separate lives secretly swap identities until one goes missing and a web of lies is exposed.",
    thumbnail: THUMBNAILS[4],
    backdrop: BACKDROPS[4],
    cast: ["Chloe Martin", "Chloe Martin", "Dan Reeves", "Priya Seth"],
    director: "Nina Cross",
    isTrending: true,
    matchPercentage: 99,
    watchProgress: 0.3,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(7) },
    ],
  },
  {
    id: "6",
    title: "Ironclad",
    type: "movie",
    genre: ["Action", "Adventure"],
    year: 2024,
    rating: "PG-13",
    score: 7.8,
    duration: "2h 31m",
    description: "An ex-soldier builds a suit of advanced armor to avenge his family and stop a weapons cartel.",
    thumbnail: THUMBNAILS[5],
    backdrop: BACKDROPS[5],
    cast: ["Leo Stone", "Carmen Silva", "Wren Banks"],
    director: "Kira Moss",
    matchPercentage: 82,
  },
  {
    id: "7",
    title: "The Signal",
    type: "series",
    genre: ["Sci-Fi", "Drama"],
    year: 2024,
    rating: "TV-14",
    score: 8.2,
    description: "A mysterious signal from deep space carries a message that divides humanity: salvation or annihilation.",
    thumbnail: THUMBNAILS[6],
    backdrop: BACKDROPS[0],
    cast: ["Zara Ali", "Finn Cole", "Mia Torres"],
    director: "Elias Park",
    isNew: true,
    matchPercentage: 88,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(9) },
    ],
  },
  {
    id: "8",
    title: "Blood & Chrome",
    type: "series",
    genre: ["Crime", "Thriller"],
    year: 2023,
    rating: "TV-MA",
    score: 8.8,
    description: "Inside a chrome city run by warring factions, a young enforcer chooses loyalty over survival.",
    thumbnail: THUMBNAILS[7],
    backdrop: BACKDROPS[1],
    cast: ["Dami Stone", "Freya Bell", "Kwame Asante"],
    director: "Ruby Diaz",
    isTrending: true,
    matchPercentage: 95,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(10) },
      { id: "s2", seasonNumber: 2, episodes: makeEpisodes(8) },
    ],
  },
  {
    id: "9",
    title: "Fractured",
    type: "movie",
    genre: ["Psychological", "Thriller"],
    year: 2024,
    rating: "R",
    score: 8.4,
    duration: "1h 45m",
    description: "After a car crash, a man wakes in a hospital where nothing — and no one — is what they seem.",
    thumbnail: THUMBNAILS[8],
    backdrop: BACKDROPS[2],
    cast: ["Ray Lawson", "Hana Kim", "Eli Voss"],
    director: "Sasha Green",
    matchPercentage: 86,
  },
  {
    id: "10",
    title: "Wild Code",
    type: "series",
    genre: ["Tech", "Drama"],
    year: 2024,
    rating: "TV-14",
    score: 7.9,
    description: "Inside the world's most secretive tech startup, brilliant minds clash as a revolutionary product nears launch.",
    thumbnail: THUMBNAILS[9],
    backdrop: BACKDROPS[3],
    cast: ["Yuki Mori", "Sam Blake", "Arjun Das"],
    director: "Joe Lee",
    matchPercentage: 78,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(6) },
    ],
  },
  {
    id: "11",
    title: "Void Walker",
    type: "movie",
    genre: ["Sci-Fi", "Action"],
    year: 2023,
    rating: "PG-13",
    score: 7.5,
    duration: "2h 8m",
    description: "A lone explorer traverses the remnants of a collapsed universe to find the last inhabited world.",
    thumbnail: THUMBNAILS[10],
    backdrop: BACKDROPS[4],
    cast: ["Tyrone Bell", "Lyra Moon", "Cass Ford"],
    director: "Mara Ito",
    matchPercentage: 73,
  },
  {
    id: "12",
    title: "The Hunt",
    type: "series",
    genre: ["Survival", "Thriller"],
    year: 2024,
    rating: "TV-MA",
    score: 9.0,
    description: "Eight strangers are dropped into a wilderness with no supplies. Only one will survive. But the real threat isn't each other.",
    thumbnail: THUMBNAILS[11],
    backdrop: BACKDROPS[5],
    cast: ["Petra Ward", "Marco Rose", "Jessie Kwan"],
    director: "Hiro Tanaka",
    isTrending: true,
    isNew: true,
    matchPercentage: 93,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(8) },
      { id: "s2", seasonNumber: 2, episodes: makeEpisodes(8) },
    ],
  },
  {
    id: "13",
    title: "Afterglow",
    type: "movie",
    genre: ["Romance", "Drama"],
    year: 2024,
    rating: "PG-13",
    score: 8.1,
    duration: "1h 52m",
    description: "Two strangers meet on a train and spend 24 hours questioning everything they thought they wanted from life.",
    thumbnail: THUMBNAILS[12],
    backdrop: BACKDROPS[0],
    cast: ["Isla Moore", "Rio Sato", "Camille Voss"],
    director: "Ana Patel",
    matchPercentage: 76,
  },
  {
    id: "14",
    title: "Apex",
    type: "series",
    genre: ["Sports", "Drama"],
    year: 2023,
    rating: "TV-14",
    score: 8.6,
    description: "Inside the brutal world of underground racing, a former champion rebuilds from rock bottom.",
    thumbnail: THUMBNAILS[13],
    backdrop: BACKDROPS[1],
    cast: ["Dante Ferris", "Suki Hara", "Omar Said"],
    director: "Reese Fox",
    matchPercentage: 85,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(8) },
    ],
  },
  {
    id: "15",
    title: "Silhouette",
    type: "movie",
    genre: ["Horror", "Thriller"],
    year: 2024,
    rating: "R",
    score: 7.7,
    duration: "1h 38m",
    description: "A family moves into their dream home, only to discover the previous owners never truly left.",
    thumbnail: THUMBNAILS[14],
    backdrop: BACKDROPS[2],
    cast: ["Holly Dean", "Barry Finch", "Zoe Marsh"],
    director: "Kyle Beck",
    isNew: true,
    matchPercentage: 71,
  },
  {
    id: "16",
    title: "Parallax",
    type: "series",
    genre: ["Sci-Fi", "Mystery"],
    year: 2024,
    rating: "TV-14",
    score: 8.3,
    description: "A physicist discovers she can shift between parallel timelines — but each jump takes something from her.",
    thumbnail: THUMBNAILS[15],
    backdrop: BACKDROPS[3],
    cast: ["Sage Hart", "Felix Quinn", "Mira Lim"],
    director: "Dex Crane",
    isNew: true,
    matchPercentage: 90,
    seasons: [
      { id: "s1", seasonNumber: 1, episodes: makeEpisodes(8) },
    ],
  },
];

export const FEATURED_MEDIA = ALL_MEDIA.filter((m) => m.isTrending).slice(0, 4);

export const TRENDING = ALL_MEDIA.filter((m) => m.isTrending);

export const NEW_RELEASES = ALL_MEDIA.filter((m) => m.isNew);

export const CONTINUE_WATCHING = ALL_MEDIA.filter(
  (m) => m.watchProgress !== undefined
);

export const CATEGORIES = [
  {
    id: "trending",
    title: "Trending Now",
    items: TRENDING,
  },
  {
    id: "new",
    title: "New Releases",
    items: NEW_RELEASES,
  },
  {
    id: "scifi",
    title: "Sci-Fi & Fantasy",
    items: ALL_MEDIA.filter((m) => m.genre.includes("Sci-Fi")),
  },
  {
    id: "thriller",
    title: "Thrillers",
    items: ALL_MEDIA.filter((m) => m.genre.includes("Thriller") || m.genre.includes("Crime")),
  },
  {
    id: "action",
    title: "Action & Adventure",
    items: ALL_MEDIA.filter((m) => m.genre.includes("Action")),
  },
  {
    id: "series",
    title: "Top Series",
    items: ALL_MEDIA.filter((m) => m.type === "series"),
  },
  {
    id: "movies",
    title: "Top Movies",
    items: ALL_MEDIA.filter((m) => m.type === "movie"),
  },
];

export const MOCK_DOWNLOADS: Media[] = ALL_MEDIA.slice(0, 3).map((m) => ({
  ...m,
  isDownloaded: true,
  downloadProgress: 1,
}));

MOCK_DOWNLOADS.push({
  ...ALL_MEDIA[4],
  isDownloaded: false,
  downloadProgress: 0.65,
});
