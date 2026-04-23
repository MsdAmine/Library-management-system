import { NavLink, useNavigate } from 'react-router-dom';
import { Book, Users, LayoutDashboard, History, Library, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <div className="logo">
          <Library className="logo-icon" />
          <span>LibraSync</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/books" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Book size={20} />
            <span>Books</span>
          </NavLink>
          <NavLink to="/members" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Users size={20} />
            <span>Members</span>
          </NavLink>
          <NavLink to="/borrowings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <History size={20} />
            <span>Borrowing</span>
          </NavLink>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
