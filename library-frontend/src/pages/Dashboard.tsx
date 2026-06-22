import { useState, useEffect } from 'react';
import { Book, Users, History, AlertCircle } from 'lucide-react';
import { analyticsApi } from '../services/api';
import './Dashboard.css';

interface Analytics {
  books: { totalTitles: number; totalCopies: number; availableCopies: number; borrowedCopies: number };
  borrowings: { totalBorrowings: number; activeBorrowings: number; overdueBorrowings: number; totalFinesCollected: number };
  members: { totalMembers: number; activeMembers: number };
}

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi.get()
      .then((res) => setAnalytics(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: 'Total Books', value: analytics?.books.totalTitles, icon: <Book />, color: 'blue' },
    { title: 'Active Members', value: analytics?.members.activeMembers, icon: <Users />, color: 'green' },
    { title: 'Books Borrowed', value: analytics?.borrowings.activeBorrowings, icon: <History />, color: 'indigo' },
    { title: 'Overdue Returns', value: analytics?.borrowings.overdueBorrowings, icon: <AlertCircle />, color: 'orange' },
  ];

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Library Overview</h1>
        <p>Manage your library resources and member activities.</p>
      </header>

      {error && <p className="error-message">{error}</p>}

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">
                {loading ? '—' : stat.value?.toLocaleString() ?? '0'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section recent-activity">
          <h2>Recent Borrowings</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <strong>John Doe</strong> borrowed <em>"The Great Gatsby"</em>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot"></div>
              <div className="activity-content">
                <strong>Sarah Smith</strong> returned <em>"Clean Code"</em>
                <span>5 hours ago</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn">Add New Book</button>
            <button className="action-btn">Register Member</button>
            <button className="action-btn outline">View Reports</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
