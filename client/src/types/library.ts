import type { BookAccessInfo } from './catalog';

export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED';

export interface LibraryBookSummary {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  averageRating: number | null;
  isFreeEligible: boolean;
  hasFullContent: boolean;
  pageCount: number | null;
  access: BookAccessInfo;
  isFavorite: boolean;
  authors: Array<{ id: string; name: string; slug: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface LibraryItem {
  id: string;
  bookId: string;
  status: ReadingStatus;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  readingTimeSeconds: number;
  lastReadAt: string;
  completedAt: string | null;
  book: LibraryBookSummary;
}

export interface ReadingStatisticsData {
  completedCount: number;
  readingCount: number;
  wantToReadCount: number;
  totalPagesRead: number;
  totalReadingSeconds: number;
  recentActivity: Array<{
    bookId: string;
    title: string;
    slug: string;
    lastPage: number;
    lastReadAt: string;
  }>;
}

export interface LibraryResponse {
  items: LibraryItem[];
  counts: {
    ALL: number;
    WANT_TO_READ: number;
    READING: number;
    COMPLETED: number;
    FAVORITES: number;
  };
  stats: ReadingStatisticsData;
}

export interface FavoriteListItem {
  id: string;
  favoritedAt: string;
  book: LibraryBookSummary;
}

export interface ReadingHistoryItem {
  id: string;
  bookId: string;
  lastPage: number;
  totalPages: number;
  progressPercentage: number;
  readingTimeSeconds: number;
  lastReadAt: string;
  book: LibraryBookSummary;
}

export interface SavedReadingProgress {
  id: string;
  userId: string;
  bookId: string;
  status: ReadingStatus;
  currentPage: number;
  totalPages: number;
  progressPercentage: number;
  readingTimeSeconds: number;
  inLibrary: boolean;
  lastReadAt: string;
  completedAt: string | null;
}

export interface OfflineBookEntry {
  id: string;
  bookId: string;
  status: 'PENDING' | 'METADATA_CACHED' | 'REVOKED';
  syncedAt: string;
  book: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    hasFullContent: boolean;
    authors: Array<{ name: string; slug: string }>;
    categories: Array<{ name: string; slug: string }>;
  };
}

export interface OfflineBooksResponse {
  limit: number;
  hasOfflineReading: boolean;
  used: number;
  items: OfflineBookEntry[];
}
