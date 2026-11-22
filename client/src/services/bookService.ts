import { api } from './api';
import type {
  BookAccessTier,
  CatalogBook,
  PaginatedBooksResponse,
  ReaderPreviewResponse,
} from '../types/catalog';

export interface BooksQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  author?: string;
  year?: number;
  minRating?: number;
  accessLevel?: BookAccessTier;
  availability?: 'all' | 'free' | 'included';
  sort?: 'relevance' | 'title' | 'rating' | 'recent';
  order?: 'asc' | 'desc';
}

export const bookService = {
  async list(params: BooksQueryParams = {}): Promise<PaginatedBooksResponse> {
    const { data } = await api.get<PaginatedBooksResponse>('/books', { params });
    return data;
  },

  async getBySlug(slug: string): Promise<CatalogBook> {
    const { data } = await api.get<{ book: CatalogBook }>(`/books/${slug}`);
    return data.book;
  },

  async getFeatured(): Promise<CatalogBook[]> {
    const { data } = await api.get<{ items: CatalogBook[] }>('/books/featured');
    return data.items;
  },

  async getPopular(): Promise<CatalogBook[]> {
    const { data } = await api.get<{ items: CatalogBook[] }>('/books/popular');
    return data.items;
  },

  async getRecommended(): Promise<CatalogBook[]> {
    const { data } = await api.get<{ items: CatalogBook[] }>('/books/recommended');
    return data.items;
  },

  async getRelated(slug: string): Promise<CatalogBook[]> {
    const { data } = await api.get<{ items: CatalogBook[] }>(`/books/${slug}/related`);
    return data.items;
  },

  async getReaderPreview(slug: string): Promise<ReaderPreviewResponse> {
    const { data } = await api.get<ReaderPreviewResponse>(`/books/${slug}/reader`);
    return data;
  },

  async unlockMonthlyBook(
    slug: string
  ): Promise<{ unlocked: boolean; alreadyUnlocked: boolean; referenceMonth: string | null }> {
    const { data } = await api.post<{
      unlocked: boolean;
      alreadyUnlocked: boolean;
      referenceMonth: string | null;
    }>(`/books/${slug}/unlock`);
    return data;
  },

  async addFavorite(bookId: string): Promise<void> {
    await api.post(`/favorites/${bookId}`);
  },

  async removeFavorite(bookId: string): Promise<void> {
    await api.delete(`/favorites/${bookId}`);
  },
};
