import { Book, Users, History, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const stats = [
    { title: 'Total Books', value: '1,284', icon: <Book />, color: 'blue' },
    { title: 'Active Members', value: '452', icon: <Users />, color: 'green' },
    { title: 'Books Borrowed', value: '86', icon: <History />, color: 'indigo' },
    { title: 'Overdue Returns', value: '12', icon: <AlertCircle />, color: 'orange' },
  ];

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Library Overview</h1>
        <p>Manage your library resources and member activities.</p>
      </header>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
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
