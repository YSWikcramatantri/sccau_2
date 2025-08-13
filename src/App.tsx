import React from 'react';
// Use v6/v7 imports: Routes, Navigate
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import RegisterPage from './components/RegisterPage';
import QuizLoginPage from './components/QuizLoginPage';
import QuizPage from './components/QuizPage';
import AdminPage from './components/AdminPage';

// This is the v6/v7 way to create a protected route.
// It's a wrapper component that checks for auth and navigates away if not authorized.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentParticipantId, isLoading } = useAppContext();

    if (isLoading) {
      // While checking session, show a loading indicator or null
      return <div className="text-center p-10">Loading session...</div>;
    }

    if (!currentParticipantId) {
        // Redirect them to the /quiz login page if they are not authenticated.
        return <Navigate to="/quiz" replace />;
    }
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { isLoading } = useAppContext();

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="text-white text-xl">Loading Sivali Astronomy Union...</div>
        </div>
      )
    }

    return (
       <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/quiz" element={<QuizLoginPage />} />
            <Route 
              path="/quiz/start" 
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/sivali-admin-portal-7b3d9f" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
    );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;
