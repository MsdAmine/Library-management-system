import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Library, ShieldOff } from 'lucide-react';
import './Auth.css';

const UnauthorizedPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Library size={32} />
            <span>LibraSync</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <ShieldOff size={48} color="#ef4444" />
          </div>
          <h1>Access Denied</h1>
          <p>Your account doesn't have access to the management dashboard. Please contact your administrator.</p>
        </div>
        <button className="auth-submit" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
