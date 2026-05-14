import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Home from './pages/user/Home';
import Dashboard from './pages/user/Dashboard';
import Tasks from './pages/user/Tasks';
import Empire from './pages/user/Empire';
import InGameEmpire from './pages/user/InGameEmpire';
import RealWorldEmpire from './pages/user/RealWorldEmpire';
import Research from './pages/user/Research';
import Civilizations from './pages/user/Civilizations';
import Shop from './pages/user/Shop';
import Leaderboard from './pages/user/Leaderboard';
import Profile from './pages/user/Profile';
import SpaceGame from './pages/user/SpaceGame';
import GameHub from './pages/user/GameHub';
import PlayGame from './pages/user/PlayGame';
import ARExplorer from './pages/user/ARExplorer';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTasks from './pages/admin/AdminTasks';
import AdminUsers from './pages/admin/AdminUsers';
import AdminEmpire from './pages/admin/AdminEmpire';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';
import AdminMetrics from './pages/admin/AdminMetrics';
import AdminUIConfig from './pages/admin/AdminUIConfig';

// Layout
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Game IS the app — entry point */}
          <Route path="/" element={<PrivateRoute><PlayGame /></PrivateRoute>} />
          <Route path="/play" element={<PrivateRoute><PlayGame /></PrivateRoute>} />
          <Route path="/space" element={<PrivateRoute><SpaceGame /></PrivateRoute>} />
          <Route path="/ar-explore" element={<PrivateRoute><ARExplorer /></PrivateRoute>} />

          {/* Legacy routes — redirect to game */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/game" element={<Navigate to="/" replace />} />
          <Route path="/tasks" element={<Navigate to="/" replace />} />
          <Route path="/empire/*" element={<Navigate to="/" replace />} />
          <Route path="/research" element={<Navigate to="/" replace />} />
          <Route path="/civilizations" element={<Navigate to="/" replace />} />
          <Route path="/shop" element={<Navigate to="/" replace />} />
          <Route path="/leaderboard" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<Navigate to="/" replace />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="empire" element={<AdminEmpire />} />
            <Route path="leaderboard" element={<AdminLeaderboard />} />
            <Route path="metrics" element={<AdminMetrics />} />
            <Route path="ui-config" element={<AdminUIConfig />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
