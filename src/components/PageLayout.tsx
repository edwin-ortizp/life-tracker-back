import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
  }
  
  const PageLayout = ({ children, className }: PageLayoutProps) => {    return (
      <div className={cn(
        "mx-auto w-[90%] px-4 pt-20 pb-20 md:pt-6 md:px-6 lg:px-8 relative z-10", 
        className
      )}>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    );
  };
  
  export default PageLayout;