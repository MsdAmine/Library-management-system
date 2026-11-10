import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with optimized spacing and responsive collapse */}
      <Navbar />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Modern subtle footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 text-center text-xs text-slate-500 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <span className="font-medium text-slate-500">Library Management System &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
