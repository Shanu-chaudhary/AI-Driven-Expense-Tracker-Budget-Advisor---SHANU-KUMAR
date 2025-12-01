import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from './context/ToastContext';
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Dashboard from "./components/Dashboard/Dashboard";
import ProfileSetup from "./pages/ProfileSetup";
import EditProfile from "./pages/EditProfile";
import PrivateRoute from "./components/Auth/PrivateRoute";
import ProfileRequiredRoute from "./components/Auth/ProfileRequiredRoute";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import ProfilePage from "./pages/ProfilePage";
import VerifyEmail from "./pages/VerifyEmail";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetPage from "./pages/BudgetPage";
import ExportPage from "./pages/ExportPage";
import CommunityPage from "./pages/CommunityPage";
import AiAdvisor from "./pages/AiAdvisor";
import AiHistory from "./pages/AiHistory";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ToastProvider>
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <LoginForm />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" /> : <RegisterForm />
        } />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProfileRequiredRoute>
              <Dashboard />
            </ProfileRequiredRoute>
          }
        />
        <Route
          path="/setup-profile"
          element={
            <PrivateRoute>
              <ProfileSetup />
            </PrivateRoute>
          }
        />
        <Route
  path="/me"
  element={
    <PrivateRoute>
      <ProfilePage />
    </PrivateRoute>
  }
/>

        <Route
          path="/edit-profile"
          element={
            <ProfileRequiredRoute>
              <EditProfile />
            </ProfileRequiredRoute>
          }
        />

        {/* Root route redirect */}
        <Route path="/" element={
          user 
            ? user.profileComplete 
              ? <Navigate to="/dashboard" />
              : <Navigate to="/setup-profile" />
            : <Navigate to="/login" />
        } />



        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route
          path="/ai-advisor"
          element={
            <ProfileRequiredRoute>
              <AiAdvisor />
            </ProfileRequiredRoute>
          }
        />
        <Route
          path="/ai-history"
          element={
            <ProfileRequiredRoute>
              <AiHistory />
            </ProfileRequiredRoute>
          }
        />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;
