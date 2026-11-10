import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const AppLayout = () => {
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with optimized spacing and responsive collapse */}
      <Navbar />

      {/* Main Content Area - Fixed top bar with clean internal vertical scrolling */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
