import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  actions 
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Page header - hidden on mobile, visible on tablets and up */}
        <header className="hidden border-b border-gray-200 bg-white px-6 py-4 shadow-sm md:block">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
              
              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Mobile title and subtitle - only visible on mobile */}
        <div className="mt-16 block border-b border-gray-200 bg-white px-6 py-4 md:hidden">
          <div>
            {title && (
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} IELTS Practice. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Terms
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Privacy
                </a>
                <a href="#" className="text-sm text-gray-500 hover:text-gray-900">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}