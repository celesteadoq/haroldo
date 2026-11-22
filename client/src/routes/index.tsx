import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from '../components/auth/AdminRoute';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AccountPage } from '../pages/AccountPage';
import { AuthorPage } from '../pages/AuthorPage';
import { BookDetailsPage } from '../pages/BookDetailsPage';
import { CatalogPage } from '../pages/CatalogPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ComponentsDemoPage } from '../pages/ComponentsDemoPage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { HealthCheckPage } from '../pages/HealthCheckPage';
import { HelpCenterPage } from '../pages/HelpCenterPage';
import { HistoryPage } from '../pages/HistoryPage';
import { LandingPage } from '../pages/LandingPage';
import { LegalInfoPage } from '../pages/LegalInfoPage';
import { LibraryPage } from '../pages/LibraryPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { PlansPage } from '../pages/PlansPage';
import { ReaderPage } from '../pages/ReaderPage';
import { SubscriptionPage } from '../pages/SubscriptionPage';
import { AdminAuditPage } from '../pages/admin/AdminAuditPage';
import { AdminAuthorsPage } from '../pages/admin/AdminAuthorsPage';
import { AdminBookFormPage } from '../pages/admin/AdminBookFormPage';
import { AdminBooksPage } from '../pages/admin/AdminBooksPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminHelpPage } from '../pages/admin/AdminHelpPage';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage';
import { AdminPlansPage } from '../pages/admin/AdminPlansPage';
import { AdminSubscriptionsPage } from '../pages/admin/AdminSubscriptionsPage';
import { AdminUserDetailsPage } from '../pages/admin/AdminUserDetailsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas e institucionais */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/explorar" element={<CatalogPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/categorias/:slug" element={<CategoriesPage />} />
        <Route path="/autores/:slug" element={<AuthorPage />} />
        <Route path="/livro/:slug" element={<BookDetailsPage />} />
        <Route path="/leitor/:slug" element={<ReaderPage />} />
        <Route path="/planos" element={<PlansPage />} />
        <Route path="/ajuda" element={<HelpCenterPage />} />
        <Route path="/ajuda/:id" element={<HelpCenterPage />} />
        <Route path="/contato" element={<Navigate to="/ajuda" replace />} />
        <Route path="/sobre" element={<LegalInfoPage section="about" />} />
        <Route path="/termos" element={<LegalInfoPage section="terms" />} />
        <Route path="/privacidade" element={<LegalInfoPage section="privacy" />} />

        {/* Diagnóstico e demonstração preservados */}
        <Route path="/componentes" element={<ComponentsDemoPage />} />
        <Route path="/setup" element={<HealthCheckPage />} />

        {/* Autenticação */}
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/esqueceu-senha" element={<ForgotPasswordPage />} />
        <Route path="/nova-senha" element={<ResetPasswordPage />} />

        {/* Rotas autenticadas (USER e ADMIN) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/minha-conta" element={<AccountPage />} />
          <Route path="/biblioteca" element={<LibraryPage />} />
          <Route path="/favoritos" element={<FavoritesPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/minha-assinatura" element={<SubscriptionPage />} />
          <Route path="/checkout/:planId" element={<CheckoutPage />} />
          <Route path="/notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Rotas administrativas (exclusivas ADMIN) */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/livros" element={<AdminBooksPage />} />
          <Route path="/admin/livros/novo" element={<AdminBookFormPage />} />
          <Route path="/admin/livros/:id" element={<AdminBookFormPage />} />
          <Route path="/admin/autores" element={<AdminAuthorsPage />} />
          <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/usuarios/:id" element={<AdminUserDetailsPage />} />
          <Route path="/admin/planos" element={<AdminPlansPage />} />
          <Route path="/admin/assinaturas" element={<AdminSubscriptionsPage />} />
          <Route path="/admin/pagamentos" element={<AdminPaymentsPage />} />
          <Route path="/admin/ajuda" element={<AdminHelpPage />} />
          <Route path="/admin/auditoria" element={<AdminAuditPage />} />
        </Route>

        {/* Página não encontrada */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
