import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseResults } from "@/hooks/useFirebaseResults";
import PageLayout from "@/components/ui/PageLayout";
import { DashboardCard } from "@/components/ui/DashboardCard";
import {
  BookOpen,
  Headphones,
  Edit3,
  Mic,
  Calendar,
  Clock,
  BarChart2,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  FileText
} from "lucide-react";

export default function Results() {
  const { currentUser } = useAuth();
  const { results, loading, error } = useFirebaseResults();
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Apply filters and sorting whenever results or filter criteria change
  useEffect(() => {
    if (!results) return;
    
    let filtered = [...results];
    
    // Apply test type filter
    if (filterType !== "all") {
      filtered = filtered.filter(result => result.testType === filterType);
    }
    
    // Apply search filter (search in test title)
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(result => 
        result.testTitle?.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        case "score":
          return (b.scores?.overall || 0) - (a.scores?.overall || 0);
        default:
          return 0;
      }
    });
    
    setFilteredResults(filtered);
  }, [results, searchTerm, sortBy, filterType]);
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Get icon for each module
  const getModuleIcon = (moduleName: string, className: string = "h-5 w-5") => {
    switch (moduleName) {
      case "reading":
        return <BookOpen className={className} />;
      case "listening":
        return <Headphones className={className} />;
      case "writing":
        return <Edit3 className={className} />;
      case "speaking":
        return <Mic className={className} />;
      default:
        return <FileText className={className} />;
    }
  };
  
  // Calculate a color class based on the score
  const getScoreColorClass = (score: number) => {
    if (score >= 7.5) return "text-green-600";
    if (score >= 6.5) return "text-blue-600";
    if (score >= 5.5) return "text-amber-600";
    return "text-red-600";
  };
  
  // Return a label for the score
  const getScoreLabel = (score: number) => {
    if (score >= 8.5) return "Expert";
    if (score >= 7.5) return "Very Good";
    if (score >= 6.5) return "Good";
    if (score >= 5.5) return "Moderate";
    if (score >= 4.5) return "Limited";
    return "Basic";
  };

  return (
    <PageLayout
      title="My Results"
      subtitle="View your test history and track your progress"
    >
      {/* Search and filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Search bar */}
        <div className="relative w-full sm:w-64 lg:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by test title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-gray-200 bg-white pl-3 pr-8 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
            </select>
          </div>
          
          {/* Filter button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm outline-none hover:bg-gray-50"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Test Type:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filterType === "all" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setFilterType("general")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filterType === "general" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                General Training
              </button>
              <button
                onClick={() => setFilterType("academic")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filterType === "academic" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Academic
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Results content */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary"></div>
            <p className="text-lg font-medium text-gray-600">Loading your results...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-red-600">{error}</p>
          <button 
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <div 
              key={result.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md" 
            >
              <div className="flex flex-col lg:flex-row">
                {/* Test info */}
                <div className="border-b border-gray-100 p-6 lg:border-b-0 lg:border-r lg:border-gray-100 lg:pr-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{result.testTitle}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      result.testType === "academic" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-green-100 text-green-700"
                    }`}>
                      {result.testType === "academic" ? "Academic" : "General Training"}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Completed on {formatDate(result.completedAt)}</span>
                  </div>
                </div>
                
                {/* Score distribution */}
                <div className="flex-1 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Score Breakdown</h4>
                    <div className="flex items-baseline">
                      <span className={`text-2xl font-bold ${getScoreColorClass(result.scores?.overall || 0)}`}>
                        {result.scores?.overall?.toFixed(1) || "N/A"}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({getScoreLabel(result.scores?.overall || 0)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {result.scores?.reading !== undefined && (
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 p-3">
                        {getModuleIcon("reading", "h-6 w-6 text-blue-500 mb-1")}
                        <span className="text-xs text-gray-500">Reading</span>
                        <span className={`text-lg font-semibold ${getScoreColorClass(result.scores.reading)}`}>
                          {result.scores.reading.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {result.scores?.listening !== undefined && (
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 p-3">
                        {getModuleIcon("listening", "h-6 w-6 text-purple-500 mb-1")}
                        <span className="text-xs text-gray-500">Listening</span>
                        <span className={`text-lg font-semibold ${getScoreColorClass(result.scores.listening)}`}>
                          {result.scores.listening.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {result.scores?.writing !== undefined && (
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 p-3">
                        {getModuleIcon("writing", "h-6 w-6 text-amber-500 mb-1")}
                        <span className="text-xs text-gray-500">Writing</span>
                        <span className={`text-lg font-semibold ${getScoreColorClass(result.scores.writing)}`}>
                          {result.scores.writing.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {result.scores?.speaking !== undefined && (
                      <div className="flex flex-col items-center rounded-lg border border-gray-100 p-3">
                        {getModuleIcon("speaking", "h-6 w-6 text-green-500 mb-1")}
                        <span className="text-xs text-gray-500">Speaking</span>
                        <span className={`text-lg font-semibold ${getScoreColorClass(result.scores.speaking)}`}>
                          {result.scores.speaking.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* View details button */}
                  <div className="mt-4 flex justify-end">
                    <Link href={`/results/${result.id}`}>
                      <a className="flex items-center text-sm font-medium text-primary hover:underline">
                        View detailed feedback
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <BarChart2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No results found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filters to find your test results."
              : "You haven't completed any tests yet. Start practicing to see your results here."}
          </p>
          {(!searchTerm && filterType === "all") && (
            <div className="mt-6">
              <Link href="/practice">
                <a className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  Start practicing
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}