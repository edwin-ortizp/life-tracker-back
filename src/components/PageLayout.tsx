import { cn } from "@/lib/utils";

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
  }
  
  const PageLayout = ({ children, className }: PageLayoutProps) => { // Added className to destructuring
    return (
      <div className={cn("mx-auto w-full max-w-7xl px-4 pt-20 pb-20 md:pt-6 md:px-6 lg:px-8", className)}>
        {children}
      </div>
    );
  };
  
  export default PageLayout;