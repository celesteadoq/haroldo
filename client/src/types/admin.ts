import type { UserRole, UserSubscriptionSummary } from './auth';
import type { BookAccessTier } from './catalog';
import type { HelpArticleItem, PaymentStatus, PlanItem } from './subscription';

export type DashboardPeriod = '7d' | '30d' | '90d' | 'all';

export interface AdminAuditLogItem {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string;
  adminUser: {
    id?: string;
    name: string;
    email?: string;
  };
}

export interface AdminDashboardResponse {
  period: DashboardPeriod;
  isSimulatedRevenue: boolean;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    usersInPeriod: number;
    activeSubscribers: number;
    trialingUsers: number;
    simulatedRevenue: number;
    paidPaymentsCount: number;
    failedPaymentsCount: number;
    totalBooks: number;
    activeBooks: number;
  };
  planDistribution: Array<{
    planId: string;
    planName: string;
    price: number;
    count: number;
  }>;
  mostFavoritedBooks: Array<{
    bookId: string;
    title: string;
    slug: string;
    count: number;
  }>;
  mostAccessedBooks: Array<{
    bookId: string;
    title: string;
    slug: string;
    count: number;
  }>;
  recentActivity: AdminAuditLogItem[];
}

export interface AdminBookItem {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  coverUrl: string | null;
  publicationYear: number | null;
  publisher: string | null;
  pageCount: number | null;
  language: string;
  ageRating: string | null;
  averageRating: number;
  accessTier: BookAccessTier;
  isActive: boolean;
  isFeatured: boolean;
  isFreeEligible: boolean;
  hasFullContent: boolean;
  authors: Array<{ author: { id: string; name: string; slug: string } }>;
  categories: Array<{ category: { id: string; name: string; slug: string } }>;
  previewPages?: Array<{
    id: string;
    pageNumber: number;
    chapterTitle: string | null;
    eyebrow: string;
    title: string;
    content: string;
    disclaimer: string | null;
  }>;
  _count?: { previewPages: number };
}

export interface AdminAuthorItem {
  id: string;
  name: string;
  slug: string;
  biography: string | null;
  photoUrl: string | null;
  _count?: { books: number };
  books?: Array<{ book: { id: string; title: string; slug: string } }>;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  _count?: { books: number };
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
  subscriptions: Array<{
    id: string;
    status: string;
    plan: { id: string; name: string; price: number };
  }>;
}

export interface AdminUserDetails {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  trialUsedAt: string | null;
  preferredLanguage: string;
  preferredTheme: string;
  createdAt: string;
  subscriptions: Array<UserSubscriptionSummary & { plan: PlanItem }>;
  payments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    paymentMethod: string;
    cardLast4: string | null;
    failureReason: string | null;
    transactionReference: string | null;
    createdAt: string;
    plan: { name: string } | null;
  }>;
  devices: Array<{
    id: string;
    deviceName: string;
    firstAccessAt: string;
    lastActiveAt: string;
  }>;
  readingHistory: Array<{
    id: string;
    lastPage: number;
    progressPercentage: number;
    lastReadAt: string;
    book: { id: string; title: string; slug: string };
  }>;
}

export interface AdminPlanItem extends PlanItem {
  _count?: { subscriptions: number };
}

export interface AdminSubscriptionItem {
  id: string;
  status: UserSubscriptionSummary['status'];
  isTrial: boolean;
  startDate: string;
  endDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  cancelAtPeriodEnd: boolean;
  user: { id: string; name: string; email: string };
  plan: { id: string; name: string; price: number };
  pendingPlan: { id: string; name: string } | null;
}

export interface AdminPaymentItem {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  transactionReference: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  plan: { id: string; name: string } | null;
}

export type AdminHelpArticleItem = HelpArticleItem;
