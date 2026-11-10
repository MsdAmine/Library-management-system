import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const AppLayout = () => {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with optimized spacing and responsive collapse */}
      <Navbar />

      {/* Main Content Container - locked within viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
