import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
  noPadding?: boolean;
  showFloatingButton?: boolean;
  onFloatingButtonClick?: () => void;
  floatingButtonLabel?: string;
}

const PageLayout = ({ 
  children, 
  className, 
  fullHeight = false, 
  noPadding = false,
  showFloatingButton = false,
  onFloatingButtonClick,
  floatingButtonLabel = "Agregar"
}: PageLayoutProps) => {
  if (noPadding) {
    return (
      <div className={cn("h-full", className)}>
        {children}
        {showFloatingButton && (
          <Button
            onClick={onFloatingButtonClick}
            className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 md:hidden"
            size="icon"
            title={floatingButtonLabel}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      fullHeight 
        ? "h-full flex flex-col" 
        : "min-h-full",
      // Responsive padding optimizado para desktop y mobile
      "px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16",
      "pt-4 md:pt-6 lg:pt-8",
      "pb-4 md:pb-6 lg:pb-8", // Reducido padding bottom
      className
    )}>
      <div className={cn(
        fullHeight ? "flex-1 flex flex-col" : "",
        // Espaciado optimizado para diferentes tamaños
        "space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-10", 
        // Contenedor más amplio para pantallas grandes
        "max-w-screen-2xl mx-auto w-full",
        // Grid optimization class for large screens
        "container-wide"
      )}>
        {children}
      </div>
      
      {showFloatingButton && (
        <Button
          onClick={onFloatingButtonClick}
          className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 md:hidden"
          size="icon"
          title={floatingButtonLabel}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};
  
  export default PageLayout;