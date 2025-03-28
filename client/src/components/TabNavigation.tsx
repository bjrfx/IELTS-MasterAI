import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
  path: string;
  adminOnly?: boolean;
};

export default function TabNavigation() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  
  const tabs: Tab[] = [
    { id: "dashboard", label: "Dashboard", path: "/" },
    { id: "practice", label: "Practice Tests", path: "/practice" },
    { id: "simulation", label: "Simulation Tests", path: "/simulation" },
    { id: "results", label: "My Results", path: "/results" },
    { id: "profile", label: "My Profile", path: "/profile" },
    { id: "admin", label: "Admin Panel", path: "/admin", adminOnly: true },
  ];
  
  const filteredTabs = tabs.filter(tab => !tab.adminOnly || (tab.adminOnly && isAdmin));

  const getActiveTab = (path: string): string => {
    if (location === path) return "true";
    if (location.startsWith(path) && path !== "/") return "true";
    return "false";
  };

  return (
    <div className="bg-white shadow mb-6">
      <div className="max-w-7xl mx-auto">
        <nav className="flex overflow-x-auto hide-scrollbar">
          {filteredTabs.map((tab) => (
            <Link key={tab.id} href={tab.path}>
              <a
                className={cn(
                  "py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus:outline-none",
                  getActiveTab(tab.path) === "true"
                    ? "border-primary text-primary-dark"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
                data-tab={tab.id}
                data-active={getActiveTab(tab.path)}
              >
                {tab.label}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
