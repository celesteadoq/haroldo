import { api } from './api';
import { removeOfflineMetadata, saveOfflineMetadata } from './offlineStorage';
import type { OfflineBooksResponse } from '../types/library';

export const offlineService = {
  async listOfflineBooks(): Promise<OfflineBooksResponse> {
    const { data } = await api.get<OfflineBooksResponse>('/offline/books');
    return data;
  },

  async addOfflineBook(book: { id: string; slug: string; title: string }): Promise<void> {
    const { data } = await api.post<{ item: { syncedAt: string } }>(`/offline/books/${book.id}`);
    await saveOfflineMetadata({
      bookId: book.id,
      slug: book.slug,
      title: book.title,
      syncedAt: data.item?.syncedAt ?? new Date().toISOString(),
      contentStatus: 'metadata_only',
    });
  },

  async removeOfflineBook(bookId: string): Promise<void> {
    await api.delete(`/offline/books/${bookId}`);
    await removeOfflineMetadata(bookId);
  },
};
