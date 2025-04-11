import { useState, useEffect } from "react";
import { useParams, useLocation, useRoute } from "wouter";
import { useTest } from "@/contexts/TestContext";
import { useAuth } from "@/contexts/AuthContext";
import ReadingTest from "@/components/tests/ReadingTest";
import WritingTest from "@/components/tests/WritingTest";
import ListeningTest from "@/components/tests/ListeningTest";
import SpeakingTest from "@/components/tests/SpeakingTest";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getTest, saveTestResult } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Parse query parameters
function useQueryParams() {
  // We need to directly access the browser URL instead of using wouter's location
  // This fixes the issue of parameters not being detected
  const searchString = window.location.search;
  console.log("Direct window.location.search:", searchString);
  
  const searchParams = new URLSearchParams(searchString);
  
  const moduleParam = searchParams.get('module');
  const modeParam = searchParams.get('mode');
  
  console.log("Direct parsed params - module:", moduleParam, "mode:", modeParam);
  
  return {
    module: moduleParam as 'reading' | 'listening' | 'writing' | 'speaking' | null,
    mode: modeParam as 'practice' | 'simulation' | null,
  };
}

export default function Test() {
  const params = useParams<{ id: string }>();
  const queryParams = useQueryParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { 
    setCurrentTest, 
    currentTest, 
    setCurrentModule,
    currentModule,
    answers,
    scores,
    setScores,
    setIsTestActive,
    isTestActive,
    currentTestId,
    setCurrentTestId,
    testType,
    setTestType
  } = useTest();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMissingParams, setIsMissingParams] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchTestData = async () => {
      if (!params.id) {
        console.log("No test ID found in params");
        setIsMissingParams(true);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching test data with ID:", params.id);
        console.log("Query params:", queryParams);
        
        // Check if we already have the current test ID loaded
        if (currentTestId !== params.id) {
          const testData = await getTest(params.id);
          console.log("Test data retrieved:", testData);
          
          if (!testData) {
            console.log("Test not found in Firestore");
            toast({
              title: "Error",
              description: "Test not found. Please try another test.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          setCurrentTestId(params.id);
          setCurrentTest(testData.content);
          setTestType(testData.type);
        }
        
        // Set the current module from query parameter for practice mode
        if (queryParams.mode === 'practice' && queryParams.module) {
          console.log("Setting module for practice mode:", queryParams.module);
          setCurrentModule(queryParams.module);
        } else if (queryParams.mode === 'simulation') {
          console.log("Setting reading module for simulation mode");
          // Start with reading for simulation mode
          setCurrentModule('reading');
        } else if (!queryParams.module && !queryParams.mode) {
          console.log("Missing query parameters - mode or module not provided");
          setIsMissingParams(true);
          return;
        }
        
        setIsTestActive(true);
        
      } catch (error) {
        console.error("Error fetching test:", error);
        toast({
          title: "Error",
          description: "Failed to load test data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
    
    // Cleanup function to reset test state when leaving the page
    return () => {
      if (queryParams.mode === 'practice') {
        // Only reset the module for practice mode
        setCurrentModule(null);
      }
    };
  }, [params.id, queryParams.module, queryParams.mode]);

  const submitTest = async () => {
    if (!currentUser || !currentTestId) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the API to evaluate the test
      const evaluationResponse = await apiRequest("POST", "/api/evaluate-test", {
        testId: currentTestId,
        userId: currentUser.uid,
        answers,
        testType,
      });
      
      if (!evaluationResponse.ok) {
        throw new Error("Failed to evaluate test");
      }
      
      const evaluationResult = await evaluationResponse.json();
      
      // Save the results to Firebase
      const resultId = await saveTestResult(currentUser.uid, {
        testId: currentTestId,
        testTitle: currentTest?.title || "IELTS Test",
        testType: testType,
        completedAt: new Date(),
        readingScore: evaluationResult.scores.reading,
        listeningScore: evaluationResult.scores.listening,
        writingScore: evaluationResult.scores.writing,
        speakingScore: evaluationResult.scores.speaking,
        overallScore: evaluationResult.scores.overall,
        answers,
        feedback: evaluationResult.feedback,
      });
      
      // Update the scores in context
      setScores(evaluationResult.scores);
      
      // Redirect to the results page
      toast({
        title: "Test Submitted",
        description: "Your test has been submitted and evaluated.",
      });
      
      navigate(`/results/${resultId}`);
      
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsTestActive(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (isMissingParams) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Invalid Test Parameters</h2>
        <p className="mb-6">The test could not be loaded due to missing or invalid parameters.</p>
        <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div>
      {currentModule === 'reading' && <ReadingTest />}
      {currentModule === 'writing' && <WritingTest />}
      {currentModule === 'listening' && <ListeningTest />}
      {currentModule === 'speaking' && <SpeakingTest />}
      
      {/* Submit button for practice mode or final module in simulation */}
      {(queryParams.mode === 'practice' || 
        (queryParams.mode === 'simulation' && currentModule === 'speaking')) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-8">
          <Button 
            className="w-full py-6 text-lg"
            onClick={submitTest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>Submit and Get Evaluation</>
            )}
          </Button>
        </div>
      )}
      
      {/* Navigation buttons for simulation mode */}
      {queryParams.mode === 'simulation' && currentModule !== 'speaking' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mt-8">
          <Button 
            className="w-full"
            onClick={() => {
              // Navigation logic for simulation mode
              if (currentModule === 'reading') {
                setCurrentModule('listening');
              } else if (currentModule === 'listening') {
                setCurrentModule('writing');
              } else if (currentModule === 'writing') {
                setCurrentModule('speaking');
              }
            }}
          >
            Continue to Next Section
          </Button>
        </div>
      )}
    </div>
  );
}
