import React from 'react';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation - el componente maneja su propia responsividad */}
      <Navigation />

      {/* Content Area */}
      <main className="min-h-screen pb-20 md:pl-16">{children}</main>
    </div>
  );
}