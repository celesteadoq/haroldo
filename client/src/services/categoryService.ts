import { api } from './api';
import type { CatalogCategory, PaginatedBooksResponse } from '../types/catalog';
import type { BooksQueryParams } from './bookService';

export const categoryService = {
  async list(): Promise<CatalogCategory[]> {
    const { data } = await api.get<{ items: CatalogCategory[] }>('/categories');
    return data.items;
  },

  async getBooks(
    slug: string,
    params: Omit<BooksQueryParams, 'category'> = {}
  ): Promise<PaginatedBooksResponse & { category: CatalogCategory }> {
    const { data } = await api.get<PaginatedBooksResponse & { category: CatalogCategory }>(
      `/categories/${slug}/books`,
      { params }
    );
    return data;
  },
};
