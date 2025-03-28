import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseTests } from "@/hooks/useFirebaseTests";
import PageLayout from "@/components/ui/PageLayout";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { 
  Clock, 
  CheckCircle, 
  Award, 
  BookText,
  Lock,
  Play,
  ArrowRight,
  Loader2,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

export default function Simulation() {
  const { isPaidUser } = useAuth();
  const [testType, setTestType] = useState<string>("general");
  const { tests, loading, error } = useFirebaseTests({ fetchOnMount: true });
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  
  // Filter tests based on selected type and ensure they are full simulation tests
  useEffect(() => {
    if (!tests) return;
    
    // Filter for full simulation tests (containing all modules) of the selected type
    const simulationTests = tests.filter(test => 
      test.type === testType && 
      test.hasReading && 
      test.hasListening && 
      test.hasWriting && 
      test.hasSpeaking
    );
    
    setFilteredTests(simulationTests);
  }, [tests, testType]);
  
  const getTestDuration = () => {
    // Standard IELTS test duration: Reading 60m + Listening 30m + Writing 60m + Speaking 14m
    return "2h 44m";
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    }).format(date);
  };
  
  const isTestLocked = (test: any) => {
    return !isPaidUser && test.type === "academic";
  };

  return (
    <PageLayout
      title="Simulation Tests"
      subtitle="Take full IELTS exams under real test conditions"
    >
      {/* Test type selector */}
      <div className="mb-6">
        <div className="flex w-full overflow-hidden rounded-xl border border-gray-200">
          <button
            onClick={() => setTestType("general")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              testType === "general"
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            General Training
          </button>
          <button
            onClick={() => setTestType("academic")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              testType === "academic"
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Academic
            {!isPaidUser && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">
                <Lock className="mr-1 h-3 w-3" />
                Premium
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Introduction card */}
      <div className="mb-6">
        <DashboardCard
          title={`IELTS ${testType === "academic" ? "Academic" : "General Training"} Simulation`}
          description="Complete a full IELTS test under exam conditions to prepare for the real test"
          gradient
          bordered={false}
          icon={<Award className="h-5 w-5 text-white" />}
        >
          <div className="mt-4 space-y-2">
            <div className="flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white">
              <Clock className="mr-2 h-4 w-4" />
              <span>Duration: {getTestDuration()}</span>
            </div>
            
            <div className="flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white">
              <BookText className="mr-2 h-4 w-4" />
              <span>All modules included: Reading, Listening, Writing, Speaking</span>
            </div>
            
            <div className="flex items-center rounded-full bg-white/20 px-3 py-1 text-sm text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Real-time progress tracking and detailed feedback</span>
            </div>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-white/90">
              Simulation tests recreate the full IELTS exam experience. 
              Complete all four modules in order with accurate time limits.
              Your responses will be evaluated using our AI scoring system,
              providing detailed feedback and band scores.
            </p>
          </div>
        </DashboardCard>
      </div>
      
      {/* Test list */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Available Tests</h2>
        
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-gray-600">Loading tests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-red-600">{error}</p>
            <button 
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : filteredTests.length > 0 ? (
          <div className="space-y-4">
            {filteredTests.map((test) => (
              <div 
                key={test.id} 
                className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${
                  isTestLocked(test) ? "opacity-75" : ""
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="border-b border-gray-100 p-6 md:border-b-0 md:border-r">
                    <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Added {formatDate(test.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex flex-1 items-center justify-between border-b border-gray-100 p-6 md:border-b-0 md:border-r">
                    <div className="flex items-center">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Duration</p>
                        <p className="text-sm text-gray-500">{getTestDuration()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="rounded-full bg-primary/10 p-2">
                        <BookText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Type</p>
                        <p className="text-sm text-gray-500">
                          {test.type.charAt(0).toUpperCase() + test.type.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {isTestLocked(test) ? (
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          disabled
                          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500"
                        >
                          <Lock className="h-4 w-4" />
                          Premium Content
                        </button>
                        <p className="text-xs text-gray-500">
                          Upgrade to access academic tests
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => window.location.href = `/test/${test.id}`}
                        className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4" />
                        Start Simulation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tests available</h3>
            <p className="mt-2 text-gray-500">
              {testType === "academic" && !isPaidUser ? (
                "Upgrade to a premium account to access Academic simulation tests."
              ) : (
                "We're currently preparing new simulation tests. Please check back soon."
              )}
            </p>
            {testType === "academic" && !isPaidUser ? (
              <button
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Upgrade Account
              </button>
            ) : (
              <button
                onClick={() => setTestType(testType === "academic" ? "general" : "academic")}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Try {testType === "academic" ? "General" : "Academic"} Tests
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}