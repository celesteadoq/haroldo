import { api } from './api';
import type {
  AdminAuditLogItem,
  AdminAuthorItem,
  AdminBookItem,
  AdminCategoryItem,
  AdminDashboardResponse,
  AdminHelpArticleItem,
  AdminPaymentItem,
  AdminPlanItem,
  AdminSubscriptionItem,
  AdminUserDetails,
  AdminUserListItem,
  DashboardPeriod,
} from '../types/admin';
import type { UserRole, UserSubscriptionSummary } from '../types/auth';
import type { BookAccessTier } from '../types/catalog';
import type { PaymentStatus } from '../types/subscription';

export interface AdminPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminBookPayload {
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  coverUrl?: string | null;
  publicationYear?: number | null;
  publisher?: string | null;
  pageCount?: number | null;
  language: string;
  ageRating?: string | null;
  averageRating?: number;
  accessTier: BookAccessTier;
  isActive: boolean;
  isFeatured: boolean;
  isFreeEligible: boolean;
  hasFullContent: boolean;
  authorIds: string[];
  categoryIds: string[];
}

export const adminService = {
  async getDashboard(period: DashboardPeriod = '30d'): Promise<AdminDashboardResponse> {
    const { data } = await api.get<AdminDashboardResponse>('/admin/dashboard', {
      params: { period },
    });
    return data;
  },

  async listBooks(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    authorId?: string;
    status?: 'active' | 'inactive' | 'all';
  }): Promise<AdminPaginated<AdminBookItem>> {
    const { data } = await api.get<AdminPaginated<AdminBookItem>>('/admin/books', { params });
    return data;
  },

  async getBook(id: string): Promise<AdminBookItem> {
    const { data } = await api.get<{ book: AdminBookItem }>(`/admin/books/${id}`);
    return data.book;
  },

  async createBook(payload: AdminBookPayload): Promise<AdminBookItem> {
    const { data } = await api.post<{ book: AdminBookItem }>('/admin/books', payload);
    return data.book;
  },

  async updateBook(id: string, payload: Partial<AdminBookPayload>): Promise<AdminBookItem> {
    const { data } = await api.patch<{ book: AdminBookItem }>(`/admin/books/${id}`, payload);
    return data.book;
  },

  async deleteBook(id: string): Promise<void> {
    await api.delete(`/admin/books/${id}`);
  },

  async saveBookPreview(
    id: string,
    pages: Array<{
      pageNumber: number;
      chapterTitle?: string | null;
      eyebrow: string;
      title: string;
      content: string;
      disclaimer?: string | null;
    }>
  ): Promise<AdminBookItem> {
    const { data } = await api.put<{ book: AdminBookItem }>(`/admin/books/${id}/preview`, {
      pages,
    });
    return data.book;
  },

  async listAuthors(search?: string): Promise<AdminAuthorItem[]> {
    const { data } = await api.get<{ items: AdminAuthorItem[] }>('/admin/authors', {
      params: search ? { search } : undefined,
    });
    return data.items;
  },

  async createAuthor(payload: {
    name: string;
    slug: string;
    biography?: string | null;
    photoUrl?: string | null;
  }): Promise<AdminAuthorItem> {
    const { data } = await api.post<{ author: AdminAuthorItem }>('/admin/authors', payload);
    return data.author;
  },

  async updateAuthor(
    id: string,
    payload: {
      name?: string;
      slug?: string;
      biography?: string | null;
      photoUrl?: string | null;
    }
  ): Promise<AdminAuthorItem> {
    const { data } = await api.patch<{ author: AdminAuthorItem }>(`/admin/authors/${id}`, payload);
    return data.author;
  },

  async deleteAuthor(id: string): Promise<void> {
    await api.delete(`/admin/authors/${id}`);
  },

  async listCategories(): Promise<AdminCategoryItem[]> {
    const { data } = await api.get<{ items: AdminCategoryItem[] }>('/admin/categories');
    return data.items;
  },

  async createCategory(payload: {
    name: string;
    slug: string;
    description: string;
    isActive?: boolean;
  }): Promise<AdminCategoryItem> {
    const { data } = await api.post<{ category: AdminCategoryItem }>('/admin/categories', payload);
    return data.category;
  },

  async updateCategory(
    id: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<AdminCategoryItem> {
    const { data } = await api.patch<{ category: AdminCategoryItem }>(
      `/admin/categories/${id}`,
      payload
    );
    return data.category;
  },

  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    planId?: string;
    status?: 'active' | 'blocked' | 'all';
  }): Promise<AdminPaginated<AdminUserListItem>> {
    const { data } = await api.get<AdminPaginated<AdminUserListItem>>('/admin/users', { params });
    return data;
  },

  async getUserDetails(id: string): Promise<AdminUserDetails> {
    const { data } = await api.get<{ user: AdminUserDetails }>(`/admin/users/${id}`);
    return data.user;
  },

  async updateUserAccess(
    id: string,
    payload: { isBlocked?: boolean; role?: UserRole }
  ): Promise<AdminUserListItem> {
    const { data } = await api.patch<{ user: AdminUserListItem }>(`/admin/users/${id}`, payload);
    return data.user;
  },

  async listPlans(): Promise<AdminPlanItem[]> {
    const { data } = await api.get<{ items: AdminPlanItem[] }>('/admin/plans');
    return data.items;
  },

  async updatePlan(
    id: string,
    payload: {
      description?: string;
      maxDevices?: number;
      offlineBookLimit?: number;
      monthlyBookLimit?: number | null;
      hasAds?: boolean;
      hasOfflineReading?: boolean;
      isActive?: boolean;
    }
  ): Promise<AdminPlanItem> {
    const { data } = await api.patch<{ plan: AdminPlanItem }>(`/admin/plans/${id}`, payload);
    return data.plan;
  },

  async listSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    planId?: string;
    status?: UserSubscriptionSummary['status'];
  }): Promise<AdminPaginated<AdminSubscriptionItem>> {
    const { data } = await api.get<AdminPaginated<AdminSubscriptionItem>>('/admin/subscriptions', {
      params,
    });
    return data;
  },

  async updateSubscription(
    id: string,
    payload: {
      status?: UserSubscriptionSummary['status'];
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<AdminSubscriptionItem> {
    const { data } = await api.patch<{ subscription: AdminSubscriptionItem }>(
      `/admin/subscriptions/${id}`,
      payload
    );
    return data.subscription;
  },

  async listPayments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatus;
    period?: DashboardPeriod;
  }): Promise<AdminPaginated<AdminPaymentItem>> {
    const { data } = await api.get<AdminPaginated<AdminPaymentItem>>('/admin/payments', {
      params,
    });
    return data;
  },

  async listHelpArticles(): Promise<AdminHelpArticleItem[]> {
    const { data } = await api.get<{ items: AdminHelpArticleItem[] }>('/admin/help');
    return data.items;
  },

  async createHelpArticle(payload: {
    category: string;
    question: string;
    answer: string;
    displayOrder: number;
    isActive: boolean;
  }): Promise<AdminHelpArticleItem> {
    const { data } = await api.post<{ article: AdminHelpArticleItem }>('/admin/help', payload);
    return data.article;
  },

  async updateHelpArticle(
    id: string,
    payload: {
      category?: string;
      question?: string;
      answer?: string;
      displayOrder?: number;
      isActive?: boolean;
    }
  ): Promise<AdminHelpArticleItem> {
    const { data } = await api.patch<{ article: AdminHelpArticleItem }>(
      `/admin/help/${id}`,
      payload
    );
    return data.article;
  },

  async deleteHelpArticle(id: string): Promise<void> {
    await api.delete(`/admin/help/${id}`);
  },

  async listAuditLogs(params: {
    page?: number;
    limit?: number;
    search?: string;
    entityType?: string;
    action?: string;
  }): Promise<AdminPaginated<AdminAuditLogItem>> {
    const { data } = await api.get<AdminPaginated<AdminAuditLogItem>>('/admin/audit-logs', {
      params,
    });
    return data;
  },
};
