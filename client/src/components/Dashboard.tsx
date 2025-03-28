import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getUserTestResults, getUserProgress } from "@/lib/firebase";
import { Book, Headphones, Edit, Mic, CheckCircle, School, Briefcase } from "lucide-react";

type ModuleProgress = {
  module: string;
  type: string;
  averageScore: number;
  testsCompleted: number;
};

type RecentTest = {
  id: string;
  type: string;
  date: string;
  scores: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    overall: number;
  };
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user progress data
        const progress = await getUserProgress(currentUser.uid);
        if (progress && progress.modules) {
          setModuleProgress(progress.modules);
        } else {
          // Set default progress data if none exists
          setModuleProgress([
            { module: "Reading", type: "Academic", averageScore: 0, testsCompleted: 0 },
            { module: "Reading", type: "General", averageScore: 0, testsCompleted: 0 },
            { module: "Listening", type: "Academic", averageScore: 0, testsCompleted: 0 },
            { module: "Listening", type: "General", averageScore: 0, testsCompleted: 0 },
            { module: "Writing", type: "Academic", averageScore: 0, testsCompleted: 0 },
            { module: "Writing", type: "General", averageScore: 0, testsCompleted: 0 },
            { module: "Speaking", type: "Academic", averageScore: 0, testsCompleted: 0 },
            { module: "Speaking", type: "General", averageScore: 0, testsCompleted: 0 },
          ]);
        }

        // Fetch recent test results
        const results = await getUserTestResults(currentUser.uid);
        if (results && results.length > 0) {
          const formattedResults = results
            .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .slice(0, 5)
            .map((result: any) => ({
              id: result.id,
              type: result.testType,
              date: new Date(result.completedAt.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              scores: {
                reading: result.scores.reading || 0,
                listening: result.scores.listening || 0,
                writing: result.scores.writing || 0,
                speaking: result.scores.speaking || 0,
                overall: result.scores.overall || 0,
              },
            }));

          setRecentTests(formattedResults);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "Reading":
        return <Book className="text-primary" />;
      case "Listening":
        return <Headphones className="text-secondary" />;
      case "Writing":
        return <Edit className="text-accent" />;
      case "Speaking":
        return <Mic className="text-error" />;
      default:
        return <Book className="text-primary" />;
    }
  };

  const getScoreWidth = (score: number) => {
    return `${(score / 9) * 100}%`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}!
        </h2>
        <p className="text-gray-600">Continue your IELTS preparation journey</p>
      </div>

      {/* PROGRESS SECTION - Academic */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold flex items-center mb-3">
          <School className="mr-2 h-5 w-5" />
          Academic Test Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {moduleProgress
            .filter(module => module.type === "Academic")
            .map((module, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{module.module}</h3>
                      <p className="text-gray-500 text-sm">{module.type}</p>
                    </div>
                    {getModuleIcon(module.module)}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Score</span>
                      <span className="font-medium">{module.averageScore.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full ${
                          module.module === "Reading" ? "bg-primary" :
                          module.module === "Listening" ? "bg-secondary" :
                          module.module === "Writing" ? "bg-accent" :
                          "bg-error"
                        } rounded-full`} 
                        style={{ width: getScoreWidth(module.averageScore) }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>{module.testsCompleted} tests completed</span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
      
      {/* PROGRESS SECTION - General */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold flex items-center mb-3">
          <Briefcase className="mr-2 h-5 w-5" />
          General Test Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {moduleProgress
            .filter(module => module.type === "General")
            .map((module, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{module.module}</h3>
                      <p className="text-gray-500 text-sm">{module.type}</p>
                    </div>
                    {getModuleIcon(module.module)}
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Score</span>
                      <span className="font-medium">{module.averageScore.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-full ${
                          module.module === "Reading" ? "bg-primary" :
                          module.module === "Listening" ? "bg-secondary" :
                          module.module === "Writing" ? "bg-accent" :
                          "bg-error"
                        } rounded-full`} 
                        style={{ width: getScoreWidth(module.averageScore) }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>{module.testsCompleted} tests completed</span>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Practice Mode</h3>
            <p className="mb-4 text-gray-600">Focus on individual sections to improve your skills at your own pace.</p>
            <div className="space-y-2">
              <Button className="w-full flex items-center justify-center" asChild>
                <Link href="/practice/reading">
                  <Book className="mr-2 h-4 w-4" />
                  Start Reading Practice
                </Link>
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center" asChild>
                <Link href="/practice/listening">
                  <Headphones className="mr-2 h-4 w-4" />
                  Start Listening Practice
                </Link>
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center" asChild>
                <Link href="/practice/writing">
                  <Edit className="mr-2 h-4 w-4" />
                  Start Writing Practice
                </Link>
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center" asChild>
                <Link href="/practice/speaking">
                  <Mic className="mr-2 h-4 w-4" />
                  Start Speaking Practice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Simulation Tests</h3>
            <p className="mb-4 text-gray-600">Experience a full IELTS test under exam conditions with accurate timing.</p>
            <div className="flex flex-col space-y-2 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Real exam format and timing</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>AI-powered assessment</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Detailed performance analysis</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" className="flex items-center justify-center" asChild>
                <Link href="/simulation/academic">
                  <School className="mr-2 h-4 w-4" />
                  Academic Test
                </Link>
              </Button>
              <Button variant="secondary" className="flex items-center justify-center" asChild>
                <Link href="/simulation/general">
                  <Briefcase className="mr-2 h-4 w-4" />
                  General Test
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT TESTS */}
      <Card className="bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">Recent Test Results</h3>
        </div>
        <div className="overflow-x-auto">
          {recentTests.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Type
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
                {recentTests.map((test) => (
                  <tr key={test.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 ${test.type === 'Academic' ? 'bg-primary' : 'bg-secondary'} rounded-full mr-2`}></div>
                        <span className="text-sm font-medium">{test.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{test.scores.reading.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{test.scores.listening.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{test.scores.writing.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{test.scores.speaking.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold">{test.scores.overall.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href={`/results/${test.id}`}>View Details</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">You haven't completed any tests yet.</p>
              <p className="text-gray-500 mt-2">Start a practice or simulation test to see your results here.</p>
            </div>
          )}
        </div>
        {recentTests.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/results">View All Results</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}