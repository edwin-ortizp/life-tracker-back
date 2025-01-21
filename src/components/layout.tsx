import React from 'react';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-full w-64 bg-white border-r">
        <Navigation />
      </div>

      {/* Content Area */}
      <div className="md:ml-64">
        <main className="min-h-screen pb-20">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <Navigation />
      </div>
    </div>
  );
}