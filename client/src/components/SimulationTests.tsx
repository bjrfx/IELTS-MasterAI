import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseTests } from "@/hooks/useFirebaseTests";
import { useLocation } from "wouter";
import { School, Briefcase, ArrowRight, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTest } from "@/contexts/TestContext";

interface SimulationTestsProps {
  testType?: 'academic' | 'general';
}

export default function SimulationTests({ testType }: SimulationTestsProps) {
  const { tests, isLoading } = useFirebaseTests({ 
    testType, 
    fetchOnMount: true 
  });
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { setCurrentTestId, setTestType } = useTest();
  
  // We only want to show tests that have all modules
  const completeTests = tests.filter(test => 
    test.hasReading && test.hasListening && test.hasWriting && test.hasSpeaking
  );
  
  const handleStartTest = (testId: string) => {
    if (!currentUser) {
      setLocation("/login");
      return;
    }
    
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    
    // Set context for the test
    setCurrentTestId(testId);
    setTestType(test.type as 'academic' | 'general');
    
    // Navigate to the test page
    setLocation(`/test/${testId}?mode=simulation`);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-6 flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (completeTests.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No Simulation Tests Available</h3>
          <p className="text-gray-500 mb-4">
            {testType 
              ? `There are no ${testType} tests available for full simulation.` 
              : "There are no tests available for full simulation currently."}
          </p>
          {currentUser?.isAdmin && (
            <Button onClick={() => setLocation("/admin")} className="mt-2">
              Go to Admin Panel to Create Tests
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {completeTests.map((test) => (
        <Card key={test.id} className="bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{test.title}</h3>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    test.type === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {test.type === 'academic' ? 'Academic' : 'General Training'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 mb-6">
              <p className="text-gray-700 mb-3">
                Full IELTS {test.type === 'academic' ? 'Academic' : 'General Training'} simulation with all four modules:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Reading (60 mins)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Listening (30 mins)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Writing (60 mins)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Speaking (11-14 mins)</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full flex items-center justify-center"
              variant={test.type === 'academic' ? "default" : "secondary"}
              onClick={() => handleStartTest(test.id)}
            >
              {test.type === 'academic' ? (
                <School className="mr-2 h-4 w-4" />
              ) : (
                <Briefcase className="mr-2 h-4 w-4" />
              )}
              <span>Start Full {test.type === 'academic' ? 'Academic' : 'General'} Test</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
