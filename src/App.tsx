import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { Navigate } from "react-router-dom";
import { FEATURES } from "@/lib/features";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import ProfileDetail from "./pages/ProfileDetail";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import FavoritesPage from "./pages/FavoritesPage";
import EditProfilePage from "./pages/EditProfilePage";
import PlanosPage from "./pages/PlanosPage";
import ContentDashboardPage from "./pages/ContentDashboardPage";
import AdminPage from "./pages/AdminPage";
import RankingPage from "./pages/RankingPage";
import ContaPage from "./pages/ContaPage";
import PagamentoConfirmadoPage from "./pages/PagamentoConfirmadoPage";
import CityPage from "./pages/CityPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/busca" element={<SearchPage />} />
            <Route path="/acompanhantes/:slug" element={<CityPage />} />
            <Route path="/perfil/:id" element={<ProfileDetail />} />
            <Route path="/acompanhante/:slug" element={<ProfileDetail />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro-usuario" element={<SignupPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/favoritos" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
            <Route path="/meu-perfil" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            <Route path="/planos" element={<ProtectedRoute><PlanosPage /></ProtectedRoute>} />
            <Route path="/painel-criadora" element={FEATURES.CRIADORA_CONTEUDO ? <ProtectedRoute><ContentDashboardPage /></ProtectedRoute> : <Navigate to="/" replace />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/conta" element={<ProtectedRoute><ContaPage /></ProtectedRoute>} />
            <Route path="/pagamento-confirmado" element={<ProtectedRoute><PagamentoConfirmadoPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
