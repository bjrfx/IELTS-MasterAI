import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseTests } from "@/hooks/useFirebaseTests";
import PageLayout from "@/components/ui/PageLayout";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { 
  BookOpen, 
  Headphones, 
  Edit3, 
  Mic, 
  CheckCircle, 
  Clock, 
  TagIcon,
  ArrowRight,
  BookText,
  Filter
} from "lucide-react";

export default function Practice() {
  const [location] = useLocation();
  const { currentUser, isPaidUser } = useAuth();
  const [activeModule, setActiveModule] = useState<string>("all");
  const [testType, setTestType] = useState<string>("all");
  const { tests, loading, error } = useFirebaseTests({});
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  
  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get("module");
    if (moduleParam) {
      setActiveModule(moduleParam);
    }
  }, [location]);
  
  // Filter tests based on selected filters
  useEffect(() => {
    if (!tests) return;
    
    let filtered = [...tests];
    
    // Filter by test type if needed
    if (testType !== "all") {
      filtered = filtered.filter(test => test.type === testType);
    }
    
    // Filter by module if needed
    if (activeModule !== "all") {
      filtered = filtered.filter(test => {
        switch (activeModule) {
          case "reading":
            return test.hasReading;
          case "listening":
            return test.hasListening;
          case "writing":
            return test.hasWriting;
          case "speaking":
            return test.hasSpeaking;
          default:
            return true;
        }
      });
    }
    
    setFilteredTests(filtered);
  }, [tests, activeModule, testType]);
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };
  
  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case "reading":
        return <BookOpen className="h-5 w-5 text-primary" />;
      case "listening":
        return <Headphones className="h-5 w-5 text-primary" />;
      case "writing":
        return <Edit3 className="h-5 w-5 text-primary" />;
      case "speaking":
        return <Mic className="h-5 w-5 text-primary" />;
      default:
        return <BookText className="h-5 w-5 text-primary" />;
    }
  };
  
  const renderModuleItem = (name: string, label: string, count: number) => (
    <button
      onClick={() => setActiveModule(name)}
      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
        activeModule === name
          ? "bg-primary text-white"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center">
        {getModuleIcon(name)}
        <span className="ml-3 font-medium">{label}</span>
      </div>
      <div className={`rounded-full ${
        activeModule === name
          ? "bg-white/20 text-white"
          : "bg-gray-100 text-gray-600"
        } px-2 py-0.5 text-xs font-medium`}
      >
        {count}
      </div>
    </button>
  );
  
  const getTestCountByModule = (moduleName: string) => {
    if (!tests) return 0;
    
    return tests.filter(test => {
      switch (moduleName) {
        case "reading":
          return test.hasReading;
        case "listening":
          return test.hasListening;
        case "writing":
          return test.hasWriting;
        case "speaking":
          return test.hasSpeaking;
        default:
          return true;
      }
    }).length;
  };
  
  const getModuleTag = (test: any) => {
    if (test.hasReading && test.hasListening && test.hasWriting && test.hasSpeaking) {
      return "Full Test";
    }
    
    const modules = [];
    if (test.hasReading) modules.push("Reading");
    if (test.hasListening) modules.push("Listening");
    if (test.hasWriting) modules.push("Writing");
    if (test.hasSpeaking) modules.push("Speaking");
    
    return modules.join(", ");
  };
  
  const getDuration = (test: any) => {
    let minutes = 0;
    if (test.hasReading) minutes += 60;
    if (test.hasListening) minutes += 30;
    if (test.hasWriting) minutes += 60;
    if (test.hasSpeaking) minutes += 14;
    
    return minutes;
  };
  
  const isTestLocked = (test: any) => {
    return !isPaidUser && test.type === "academic";
  };

  return (
    <PageLayout
      title="Practice Tests"
      subtitle="Improve your skills with targeted practice modules"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar filters */}
        <div>
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Modules</h3>
            <div className="space-y-2">
              {renderModuleItem("all", "All Modules", tests?.length || 0)}
              {renderModuleItem("reading", "Reading", getTestCountByModule("reading"))}
              {renderModuleItem("listening", "Listening", getTestCountByModule("listening"))}
              {renderModuleItem("writing", "Writing", getTestCountByModule("writing"))}
              {renderModuleItem("speaking", "Speaking", getTestCountByModule("speaking"))}
            </div>
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Test Type</h3>
            <div className="flex flex-col space-y-2">
              <label className="flex cursor-pointer items-center rounded-md px-3 py-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name="testType"
                  value="all"
                  checked={testType === "all"}
                  onChange={() => setTestType("all")}
                  className="h-4 w-4 accent-primary"
                />
                <span className="ml-2 text-gray-700">All Types</span>
              </label>
              
              <label className="flex cursor-pointer items-center rounded-md px-3 py-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name="testType"
                  value="general"
                  checked={testType === "general"}
                  onChange={() => setTestType("general")}
                  className="h-4 w-4 accent-primary"
                />
                <span className="ml-2 text-gray-700">General Training</span>
              </label>
              
              <label className="flex cursor-pointer items-center rounded-md px-3 py-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name="testType"
                  value="academic"
                  checked={testType === "academic"}
                  onChange={() => setTestType("academic")}
                  className="h-4 w-4 accent-primary"
                />
                <span className="ml-2 text-gray-700">Academic</span>
                {!isPaidUser && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-600">Premium</span>
                )}
              </label>
            </div>
          </div>
        </div>
        
        {/* Tests grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
                <p className="text-lg font-medium text-gray-600">Loading tests...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredTests.length > 0 ? (
            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTests.map((test) => (
                <DashboardCard
                  key={test.id}
                  title={test.title}
                  className={isTestLocked(test) ? "opacity-75" : ""}
                >
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center">
                      <TagIcon className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {test.type.charAt(0).toUpperCase() + test.type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <BookText className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{getModuleTag(test)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{getDuration(test)} minutes</span>
                    </div>
                    
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Added {formatDate(test.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    {isTestLocked(test) ? (
                      <div className="flex flex-col space-y-2">
                        <button
                          disabled
                          className="flex cursor-not-allowed items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500"
                        >
                          Premium Content
                        </button>
                        <p className="text-center text-xs text-gray-500">
                          Upgrade to access academic tests
                        </p>
                      </div>
                    ) : (
                      <button
                        className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                        onClick={() => window.location.href = `/test/${test.id}`}
                      >
                        Start Test
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    )}
                  </div>
                </DashboardCard>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <Filter className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No tests found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your filters or check back later for new tests.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}