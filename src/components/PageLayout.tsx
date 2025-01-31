interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
  }
  
  const PageLayout = ({ children }: PageLayoutProps) => {
    return (
      <div className={"mx-auto px-4 pt-16 pb-20 md:py-6 ${className}"}>
        {children}
      </div>
    );
  };
  
  export default PageLayout;