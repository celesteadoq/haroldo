import { ToastContainer, ToastProvider } from './components/feedback';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
