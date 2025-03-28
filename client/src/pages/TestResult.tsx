import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Book, 
  Headphones, 
  Edit, 
  Mic, 
  MessageSquareText,
  AlertTriangle,
  ArrowLeft,
  Award
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TestFeedback {
  reading?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  listening?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  writing?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
    task1Feedback?: string;
    task2Feedback?: string;
  };
  speaking?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  overall?: {
    summary: string;
    nextSteps: string[];
  };
}

interface TestResultData {
  id: string;
  testId: string;
  testTitle: string;
  testType: string;
  completedAt: Date;
  readingScore: number;
  listeningScore: number;
  writingScore: number;
  speakingScore: number;
  overallScore: number;
  answers: Record<string, any>;
  feedback: TestFeedback;
}

export default function TestResult() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [resultData, setResultData] = useState<TestResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResultData = async () => {
      if (!params.id || !currentUser) {
        navigate("/results");
        return;
      }

      try {
        setIsLoading(true);
        const resultRef = doc(db, "results", params.id);
        const resultDoc = await getDoc(resultRef);

        if (!resultDoc.exists()) {
          toast({
            title: "Error",
            description: "Test result not found.",
            variant: "destructive",
          });
          navigate("/results");
          return;
        }

        const data = resultDoc.data();
        // Check if this result belongs to the current user
        if (data.userId !== currentUser.uid) {
          toast({
            title: "Unauthorized",
            description: "You do not have permission to view this result.",
            variant: "destructive",
          });
          navigate("/results");
          return;
        }

        setResultData({
          id: resultDoc.id,
          testId: data.testId,
          testTitle: data.testTitle || "IELTS Test",
          testType: data.testType || "academic",
          completedAt: data.completedAt?.toDate() || new Date(),
          readingScore: data.readingScore || 0,
          listeningScore: data.listeningScore || 0,
          writingScore: data.writingScore || 0,
          speakingScore: data.speakingScore || 0,
          overallScore: data.overallScore || 0,
          answers: data.answers || {},
          feedback: data.feedback || {},
        });
      } catch (error) {
        console.error("Error fetching test result:", error);
        toast({
          title: "Error",
          description: "Failed to load test result data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResultData();
  }, [params.id, currentUser]);

  const getBandColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 7) return "bg-green-400";
    if (score >= 6) return "bg-yellow-400";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 9) return "Expert";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    if (score >= 6) return "Competent";
    if (score >= 5) return "Modest";
    if (score >= 4) return "Limited";
    if (score >= 3) return "Extremely Limited";
    if (score >= 2) return "Intermittent";
    return "Non User";
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Result Not Found</h2>
        <p className="mb-6">The test result you're looking for could not be found or you don't have permission to view it.</p>
        <Button onClick={() => navigate("/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{resultData.testTitle} Results</h2>
          <Button variant="outline" onClick={() => navigate("/results")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
          </Button>
        </div>
        <p className="text-gray-500">
          {resultData.testType === "academic" ? "Academic" : "General Training"} Test • Completed on{" "}
          {resultData.completedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="rounded-full bg-primary/10 p-4 mr-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Overall Band Score</h3>
                <p className="text-gray-500">Your combined performance across all modules</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary mx-auto">
                <span className="text-3xl font-bold">{resultData.overallScore.toFixed(1)}</span>
              </div>
              <p className="mt-2 font-medium text-gray-700">{getScoreDescription(resultData.overallScore)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Reading</h3>
                <p className="text-gray-500 text-sm">{resultData.testType === "academic" ? "Academic" : "General"}</p>
              </div>
              <Book className="text-primary" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Score</span>
                <span className="font-medium">{resultData.readingScore.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full ${getBandColor(resultData.readingScore)} rounded-full`}
                  style={{ width: `${(resultData.readingScore / 9) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Listening</h3>
                <p className="text-gray-500 text-sm">{resultData.testType === "academic" ? "Academic" : "General"}</p>
              </div>
              <Headphones className="text-secondary" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Score</span>
                <span className="font-medium">{resultData.listeningScore.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full ${getBandColor(resultData.listeningScore)} rounded-full`}
                  style={{ width: `${(resultData.listeningScore / 9) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Writing</h3>
                <p className="text-gray-500 text-sm">{resultData.testType === "academic" ? "Academic" : "General"}</p>
              </div>
              <Edit className="text-accent" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Score</span>
                <span className="font-medium">{resultData.writingScore.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full ${getBandColor(resultData.writingScore)} rounded-full`}
                  style={{ width: `${(resultData.writingScore / 9) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">Speaking</h3>
                <p className="text-gray-500 text-sm">{resultData.testType === "academic" ? "Academic" : "General"}</p>
              </div>
              <Mic className="text-error" />
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Score</span>
                <span className="font-medium">{resultData.speakingScore.toFixed(1)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-full ${getBandColor(resultData.speakingScore)} rounded-full`}
                  style={{ width: `${(resultData.speakingScore / 9) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquareText className="h-5 w-5 mr-2" />
            Detailed Feedback
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overall">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="reading">Reading</TabsTrigger>
              <TabsTrigger value="listening">Listening</TabsTrigger>
              <TabsTrigger value="writing">Writing</TabsTrigger>
              <TabsTrigger value="speaking">Speaking</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="p-4">
              {resultData.feedback?.overall ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
                  <p className="mb-6">{resultData.feedback.overall.summary}</p>

                  <h3 className="text-lg font-semibold mb-4">Recommended Next Steps</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {resultData.feedback.overall.nextSteps?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">IELTS Band Score Chart</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Band 9: Expert</span>
                          <Progress value={100} className="w-2/3 h-2 bg-green-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Bands 7-8: Good/Very Good</span>
                          <Progress value={78} className="w-2/3 h-2 bg-green-400" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Bands 5-6: Modest/Competent</span>
                          <Progress value={56} className="w-2/3 h-2 bg-yellow-400" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Bands 3-4: Limited/Extremely Limited</span>
                          <Progress value={33} className="w-2/3 h-2 bg-amber-500" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Bands 1-2: Non/Intermittent User</span>
                          <Progress value={11} className="w-2/3 h-2 bg-red-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No overall feedback available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reading" className="p-4">
              {resultData.feedback?.reading ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Reading Assessment</h3>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Score:</span>
                      <span className={`px-2 py-1 rounded-full text-white ${getBandColor(resultData.readingScore)}`}>
                        {resultData.readingScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.reading.strengths?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.reading.weaknesses?.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Advice for Improvement</h4>
                    <p>{resultData.feedback.reading.advice}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No reading feedback available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="listening" className="p-4">
              {resultData.feedback?.listening ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Listening Assessment</h3>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Score:</span>
                      <span className={`px-2 py-1 rounded-full text-white ${getBandColor(resultData.listeningScore)}`}>
                        {resultData.listeningScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.listening.strengths?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.listening.weaknesses?.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Advice for Improvement</h4>
                    <p>{resultData.feedback.listening.advice}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No listening feedback available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="writing" className="p-4">
              {resultData.feedback?.writing ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Writing Assessment</h3>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Score:</span>
                      <span className={`px-2 py-1 rounded-full text-white ${getBandColor(resultData.writingScore)}`}>
                        {resultData.writingScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {resultData.feedback.writing.task1Feedback && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Task 1 Feedback</h4>
                      <p className="bg-gray-50 p-3 rounded">{resultData.feedback.writing.task1Feedback}</p>
                    </div>
                  )}
                  
                  {resultData.feedback.writing.task2Feedback && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2">Task 2 Feedback</h4>
                      <p className="bg-gray-50 p-3 rounded">{resultData.feedback.writing.task2Feedback}</p>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.writing.strengths?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.writing.weaknesses?.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Advice for Improvement</h4>
                    <p>{resultData.feedback.writing.advice}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No writing feedback available.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="speaking" className="p-4">
              {resultData.feedback?.speaking ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Speaking Assessment</h3>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">Score:</span>
                      <span className={`px-2 py-1 rounded-full text-white ${getBandColor(resultData.speakingScore)}`}>
                        {resultData.speakingScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Strengths</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.speaking.strengths?.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Areas for Improvement</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {resultData.feedback.speaking.weaknesses?.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Advice for Improvement</h4>
                    <p>{resultData.feedback.speaking.advice}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>No speaking feedback available.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => navigate("/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
        </Button>
        <Button onClick={() => navigate("/practice")}>Practice Again</Button>
      </div>
    </div>
  );
}
