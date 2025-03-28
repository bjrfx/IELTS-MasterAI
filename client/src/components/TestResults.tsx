import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserTestResults } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, BarChart } from "lucide-react";
import { format } from "date-fns";

type TestResult = {
  id: string;
  testId: string;
  testTitle: string;
  testType: 'academic' | 'general';
  completedAt: Date;
  scores: {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
    overall?: number;
  };
};

export default function TestResults() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchResults = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        const userResults = await getUserTestResults(currentUser.uid);
        
        // Format the results
        const formattedResults = userResults.map((result: any) => ({
          id: result.id,
          testId: result.testId,
          testTitle: result.testTitle || 'IELTS Test',
          testType: result.testType || 'academic',
          completedAt: result.completedAt?.toDate() || new Date(),
          scores: {
            reading: result.readingScore || 0,
            listening: result.listeningScore || 0,
            writing: result.writingScore || 0,
            speaking: result.speakingScore || 0,
            overall: result.overallScore || 0,
          }
        }));
        
        // Sort by date completed (newest first)
        formattedResults.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
        
        setResults(formattedResults);
      } catch (error) {
        console.error("Error fetching test results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [currentUser]);

  const handleViewResult = (resultId: string) => {
    setLocation(`/results/${resultId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Test Type", "Date", "Reading", "Listening", "Writing", "Speaking", "Overall", "Action"].map((header) => (
                      <th key={header} className="px-6 py-3 text-left">
                        <Skeleton className="h-4 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3].map((row) => (
                    <tr key={row}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((cell) => (
                        <td key={cell} className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-12" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6 text-center">
          <BarChart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Test Results Yet</h3>
          <p className="text-gray-500 mb-4">
            You haven't completed any IELTS tests yet. Take a practice or simulation test to see your results here.
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={() => setLocation("/practice")} variant="outline">
              Practice Tests
            </Button>
            <Button onClick={() => setLocation("/simulation")}>
              Simulation Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Test Results</h2>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reading
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listening
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Writing
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Speaking
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{result.testTitle}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 ${result.testType === 'academic' ? 'bg-primary' : 'bg-secondary'} rounded-full mr-2`}></div>
                      <span className="text-sm font-medium">
                        {result.testType === 'academic' ? 'Academic' : 'General'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(result.completedAt, 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{result.scores.reading?.toFixed(1) || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{result.scores.listening?.toFixed(1) || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{result.scores.writing?.toFixed(1) || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm">{result.scores.speaking?.toFixed(1) || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold">{result.scores.overall?.toFixed(1) || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary-dark"
                      onClick={() => handleViewResult(result.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
