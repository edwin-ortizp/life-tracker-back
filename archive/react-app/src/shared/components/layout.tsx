import React from 'react';
import Navigation from './navigation/Navigation';
import { useResponsive } from '@/shared/hooks/useResponsive';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { shouldShowDesktopNav } = useResponsive();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Navigation - el componente maneja su propia responsividad */}
      <Navigation />

      {/* Content Area - Ajustar padding dinámicamente */}
      <main className={`min-h-screen pb-20 relative ${shouldShowDesktopNav ? 'md:pl-16' : ''}`}>
        {/* Subtle background patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute bottom-40 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        {children}
      </main>
    </div>
  );
}