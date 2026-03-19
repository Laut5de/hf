const BASE_URL = "https://apii.freehandyflix.online/api";

export interface ApiImage {
  url: string;
  width: number;
  height: number;
  blurHash?: string;
}

export interface ApiSubject {
  subjectId: string;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: ApiImage;
  countryName: string;
  imdbRatingValue: string;
  hasResource: boolean;
  detailPath: string;
  stills?: ApiImage | null;
  imdbRatingCount: number;
  corner: string;
  postTitle: string;
}

export interface ApiBannerItem {
  id: string;
  title: string;
  image: ApiImage;
  subjectId: string;
  subjectType: number;
  subject: ApiSubject;
  detailPath: string;
}

export interface ApiOperatingItem {
  type: string;
  position: number;
  title: string;
  subjects: ApiSubject[];
  banner?: {
    items: ApiBannerItem[];
  } | null;
}

export interface ApiHomepageData {
  operatingList: ApiOperatingItem[];
  platformList: { name: string; uploadBy: string }[];
}

export interface ApiInfoData {
  subjectId: string;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: ApiImage;
  countryName: string;
  imdbRatingValue: string;
  hasResource: boolean;
  detailPath: string;
  staffList: { name: string; roleName: string; avatar?: ApiImage }[];
  episodeList?: {
    seasonTitle: string;
    episodes: {
      episodeId: string;
      title: string;
      episodeNo: number;
      cover?: ApiImage | null;
      duration: number;
    }[];
  }[];
  stills?: ApiImage | null;
  trailer?: { url: string } | null;
}

export async function fetchHomepage(): Promise<ApiHomepageData> {
  const res = await fetch(`${BASE_URL}/homepage`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("API returned error");
  return json.data;
}

export async function fetchTrending(): Promise<ApiSubject[]> {
  const res = await fetch(`${BASE_URL}/trending`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("API returned error");
  return json.data.subjectList || [];
}

export async function fetchInfo(movieId: string): Promise<ApiInfoData | null> {
  try {
    const res = await fetch(`${BASE_URL}/info/${movieId}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success") return null;
    return json.data;
  } catch {
    return null;
  }
}

export async function fetchSearch(query: string): Promise<ApiSubject[]> {
  const res = await fetch(`${BASE_URL}/search/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("API returned error");
  const data = json.data;
  const items = data.items ?? data.subjectList;
  return Array.isArray(items) ? items : [];
}

export interface ApiSourceDownload {
  id: string;
  url: string;
  proxyUrl: string;
  resolution: number;
  size: string;
}

export interface ApiCaption {
  id: string;
  lan: string;
  lanName: string;
  url: string;
  size: string;
  delay: number;
}

export interface ApiSourcesData {
  downloads: ApiSourceDownload[];
  captions: ApiCaption[];
}

function buildProxyUrl(directUrl: string): string {
  return `${BASE_URL}/download/${encodeURIComponent(directUrl)}`;
}

export async function fetchSources(movieId: string): Promise<ApiSourcesData | null> {
  try {
    const res = await fetch(`${BASE_URL}/sources/${movieId}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success") return null;
    const data = json.data;
    if (data?.downloads) {
      data.downloads = data.downloads.map((d: any) => ({
        ...d,
        proxyUrl: d.proxyUrl || buildProxyUrl(d.url),
      }));
    }
    return data;
  } catch {
    return null;
  }
}

export async function fetchFrenchVersion(title: string): Promise<ApiSubject | null> {
  try {
    const cleanTitle = title.replace(/\s*\[version française\]/i, "").trim();
    const query = `${cleanTitle} [version française]`;
    const res = await fetch(`${BASE_URL}/search/${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success") return null;
    const items: ApiSubject[] = json.data?.items ?? json.data?.subjectList ?? [];
    const match = items.find(
      (item) =>
        item.title.toLowerCase().includes("[version française]") &&
        item.title.toLowerCase().includes(cleanTitle.toLowerCase().split(":")[0].trim())
    );
    return match || null;
  } catch {
    return null;
  }
}

export function isFrenchVersion(title: string): boolean {
  return /\[version française\]/i.test(title);
}

export function cleanFrenchTitle(title: string): string {
  return title.replace(/\s*\[version française\]/i, "").trim();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getGenres(genre: string): string[] {
  if (!genre) return [];
  return genre.split(",").map((g) => g.trim()).filter(Boolean);
}

export function getYear(releaseDate: string): string {
  if (!releaseDate) return "";
  return releaseDate.substring(0, 4);
}
