import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { Loading, EmptyState } from "./components/States";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { PasswordPage } from "./pages/PasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PapersPage } from "./pages/PapersPage";
import { PaperPage } from "./pages/PaperPage";
import { AttemptPage } from "./pages/AttemptPage";
import { ResultsPage } from "./pages/ResultsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
function Protected() {
  const location = useLocation();
  const { session, loading } = useAuth();
  return loading ? (
    <Loading />
  ) : session ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      state={{ returnTo: location.pathname + location.search }}
      replace
    />
  );
}
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage key="login" />} />
      <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
      <Route path="/forgot-password" element={<PasswordPage key="request" />} />
      <Route
        path="/reset-password"
        element={<PasswordPage key="reset" reset />}
      />
      <Route element={<Protected />}>
        <Route
          path="/app/attempts/:id"
          element={<AttemptPage key={location.pathname} />}
        />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="papers" element={<PapersPage />} />
          <Route path="papers/:id" element={<PaperPage />} />
          <Route path="attempts/:id/results" element={<ResultsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <EmptyState
            title="This page took a wrong turn."
            description="Let’s get you back to Cutoff."
            to="/"
            action="Go home"
          />
        }
      />
    </Routes>
  );
}
