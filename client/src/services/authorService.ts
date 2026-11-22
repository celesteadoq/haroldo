import { api } from './api';
import type { CatalogAuthor, PaginatedBooksResponse } from '../types/catalog';
import type { BooksQueryParams } from './bookService';

export const authorService = {
  async list(): Promise<CatalogAuthor[]> {
    const { data } = await api.get<{ items: CatalogAuthor[] }>('/authors');
    return data.items;
  },

  async getBySlug(slug: string): Promise<CatalogAuthor> {
    const { data } = await api.get<{ author: CatalogAuthor }>(`/authors/${slug}`);
    return data.author;
  },

  async getBooks(
    slug: string,
    params: Omit<BooksQueryParams, 'author'> = {}
  ): Promise<PaginatedBooksResponse & { author: CatalogAuthor }> {
    const { data } = await api.get<PaginatedBooksResponse & { author: CatalogAuthor }>(
      `/authors/${slug}/books`,
      { params }
    );
    return data;
  },
};
