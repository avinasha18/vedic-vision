import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navigation from './components/common/Navigation';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ParticipantDashboard from './components/dashboard/ParticipantDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import Profile from './components/profile/Profile';
import Leaderboard from './components/leaderboard/Leaderboard';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardWrapper />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

// Component to render appropriate dashboard based on user role
const DashboardWrapper = () => {
  const { isAdmin, isParticipant } = useAuth();

  if (isAdmin) {
    return <AdminDashboard />;
  } else if (isParticipant) {
    return <ParticipantDashboard />;
  } else {
    return <div>Loading...</div>;
  }
};

export default App;
