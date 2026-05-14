import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Empire from './pages/Empire';
import Leaderboard from './pages/Leaderboard';
import Metrics from './pages/Metrics';
import UIConfig from './pages/UIConfig';
import GameConfig from './pages/GameConfig';
import Verifications from './pages/Verifications';
import Nodes from './pages/Nodes';
import Plugins from './pages/Plugins';
import ShopItems from './pages/ShopItems';
import Structures from './pages/Structures';
import Research from './pages/Research';
import Social from './pages/Social';
import Civilizations from './pages/Civilizations';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="categories" element={<Categories />} />
            <Route path="users" element={<Users />} />
            <Route path="empire" element={<Empire />} />
            <Route path="structures" element={<Structures />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="verifications" element={<Verifications />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="ui-config" element={<UIConfig />} />
            <Route path="game-config" element={<GameConfig />} />
            <Route path="shop-items" element={<ShopItems />} />
            <Route path="research" element={<Research />} />
            <Route path="social" element={<Social />} />
            <Route path="civilizations" element={<Civilizations />} />
            <Route path="nodes" element={<Nodes />} />
            <Route path="plugins" element={<Plugins />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
