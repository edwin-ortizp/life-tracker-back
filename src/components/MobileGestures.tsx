import { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileGesturesProps {
  children: React.ReactNode;
}

const MobileGestures = ({ children }: MobileGesturesProps) => {
  const { isMobile } = useResponsive();
  const [pullToRefreshDistance, setPullToRefreshDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    let startY = 0;
    let currentY = 0;
    let isScrolledToTop = true;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isScrolledToTop = window.scrollY === 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isScrolledToTop) return;

      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0 && pullDistance < 150) {
        setIsPulling(true);
        setPullToRefreshDistance(pullDistance);
        // Prevenir el scroll nativo cuando estamos haciendo pull-to-refresh
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && pullToRefreshDistance > 100) {
        // Trigger refresh
        window.location.reload();
      }
      
      setIsPulling(false);
      setPullToRefreshDistance(0);
    };

    // Agregar listeners solo en móvil
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isPulling, pullToRefreshDistance]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      {isPulling && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-2 text-sm transition-transform duration-200"
          style={{
            transform: `translateY(${Math.min(pullToRefreshDistance - 50, 0)}px)`,
            opacity: pullToRefreshDistance / 100
          }}
        >
          {pullToRefreshDistance > 100 ? '¡Suelta para actualizar!' : 'Tira hacia abajo para actualizar'}
        </div>
      )}
      
      {children}
    </div>
  );
};

export default MobileGestures;
