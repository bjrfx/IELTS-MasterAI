import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen,
  BookText,
  BarChart3,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  GraduationCap,
  MessageSquare
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { currentUser, isAdmin, isPaidUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);
  
  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      name: "Practice Tests",
      href: "/practice",
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      name: "Simulation Tests",
      href: "/simulation",
      icon: <BookText className="h-5 w-5" />
    },
    {
      name: "Results",
      href: "/results",
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />
    }
  ];
  
  // Admin items (only shown to admins)
  const adminItems = [
    {
      name: "Admin Panel",
      href: "/admin",
      icon: <Settings className="h-5 w-5" />
    },
    {
      name: "AI Chat",
      href: "/ai-chat",
     icon: <MessageSquare className="h-5 w-5" />
    },
    {
      name: "IELTS General",
      href: "/ai-chat/general",
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      name: "IELTS Academic",
      href: "/ai-chat/academic",
      icon: <MessageSquare className="h-5 w-5" />
    }
  ];
  
  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return location === href;
    }
    return location.startsWith(href);
  };
  
  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Mobile menu toggle button */}
      <div className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-3 text-lg font-bold text-gray-900">IELTS Practice</span>
        </div>
        
        {currentUser && (
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium text-gray-700">
              {currentUser.displayName || currentUser.email}
            </span>
            {isPaidUser && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Premium
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Sidebar container (mobile & desktop) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">IELTS Practice</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <div key={item.name}>
                  <Link 
                    href={item.href}
                    className={`group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className={`mr-3 ${isActive(item.href) ? "text-primary" : "text-gray-500 group-hover:text-gray-700"}`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>
            
            {/* Admin navigation */}
            {isAdmin && (
              <div className="mt-8">
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Administration
                </h3>
                <nav className="mt-2 space-y-1">
                  {adminItems.map((item) => (
                    <div key={item.name}>
                      <Link 
                        href={item.href}
                        className={`group flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium ${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className={`mr-3 ${isActive(item.href) ? "text-primary" : "text-gray-500 group-hover:text-gray-700"}`}>
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    </div>
                  ))}
                </nav>
              </div>
            )}
          </div>
          
          {/* User profile section */}
          {currentUser && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {currentUser.displayName 
                    ? currentUser.displayName.charAt(0).toUpperCase() 
                    : currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isPaidUser ? "Premium Account" : "Free Account"}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
      
      {/* Sidebar spacer for desktop (prevents content from being hidden behind sidebar) */}
      <div className="hidden w-64 flex-shrink-0 lg:block"></div>
    </>
  );
}