import type { SavedReadingProgress } from './library';

export type BookAccessTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface CatalogAuthor {
  id: string;
  name: string;
  slug: string;
  biography: string | null;
  photoUrl?: string | null;
  bookCount?: number;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  bookCount?: number;
}

export interface BookAccessInfo {
  accessLevel: BookAccessTier;
  requiredPlanName: 'Gratuito' | 'Básico' | 'Premium';
  canReadPreview: boolean;
  canReadFull: boolean;
  canUnlockMonthly: boolean;
  hasOfflineAccess: boolean;
  isMonthlyUnlocked: boolean;
  reason: 'ALLOWED' | 'LOGIN_REQUIRED' | 'PLAN_UPGRADE_REQUIRED';
  userPlanName: string | null;
}

export interface CatalogBook {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  synopsis: string;
  coverImage: string | null;
  bannerImage: string | null;
  publicationYear: number | null;
  language: string;
  publisher: string | null;
  pageCount: number | null;
  isbn: string | null;
  ageRating: string | null;
  rating: number | null;
  ratingCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  isFreeEligible: boolean;
  hasFullContent: boolean;
  accessLevel: BookAccessTier;
  access: BookAccessInfo;
  isFavorite: boolean;
  authors: CatalogAuthor[];
  categories: CatalogCategory[];
}

export interface PaginatedBooksResponse {
  items: CatalogBook[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EditorialPreviewPageItem {
  pageNumber: number;
  chapterTitle: string | null;
  eyebrow: string;
  title: string;
  content: string;
  disclaimer: string | null;
}

export interface ReaderPreviewResponse {
  book: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    hasFullContent: boolean;
    authors: Array<{ name: string; slug: string }>;
  };
  access: BookAccessInfo;
  savedProgress: SavedReadingProgress | null;
  hasEditorialPreview: boolean;
  previewPages: EditorialPreviewPageItem[];
}
