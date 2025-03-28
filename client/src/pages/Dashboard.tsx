import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirebaseProgress } from "@/hooks/useFirebaseProgress";
import { useFirebaseResults } from "@/hooks/useFirebaseResults";
import PageLayout from "@/components/ui/PageLayout";
import { DashboardCard, StatsCard } from "@/components/ui/DashboardCard";
import { Link } from "wouter";
import { 
  BookOpen, 
  BookText, 
  BarChart, 
  Award, 
  Zap, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const { progress, loading: progressLoading } = useFirebaseProgress();
  const { results, loading: resultsLoading } = useFirebaseResults();
  
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (results) {
      // Set recent test results (limit to 3)
      setRecentTests(results.slice(0, 3));
    }
  }, [results]);

  useEffect(() => {
    if (progress && progress.moduleProgress) {
      // Format module progress data
      const formattedProgress = Object.entries(progress.moduleProgress || {}).map(([module, data]) => {
        // Handle both module types (academic and general)
        const moduleData = data as any;
        const academicCount = moduleData.academic?.length || 0;
        const generalCount = moduleData.general?.length || 0;
        
        // Calculate average scores if available
        const academicScores = moduleData.academic?.map((item: any) => item.score) || [];
        const generalScores = moduleData.general?.map((item: any) => item.score) || [];
        
        const academicAvg = academicScores.length 
          ? academicScores.reduce((a: number, b: number) => a + b, 0) / academicScores.length 
          : 0;
        
        const generalAvg = generalScores.length 
          ? generalScores.reduce((a: number, b: number) => a + b, 0) / generalScores.length 
          : 0;
        
        return {
          module,
          counts: {
            academic: academicCount,
            general: generalCount,
            total: academicCount + generalCount
          },
          averages: {
            academic: academicAvg.toFixed(1),
            general: generalAvg.toFixed(1),
            overall: ((academicAvg + generalAvg) / 2).toFixed(1)
          }
        };
      });
      
      setModuleProgress(formattedProgress);
    }
  }, [progress]);

  // Calculate overall stats
  const totalTests = results?.length || 0;
  const bestScore = results?.reduce((max, test) => {
    return Math.max(max, test.scores?.overall || 0);
  }, 0) || 0;
  
  // Get practice recommendations
  const getRecommendedModule = () => {
    if (!moduleProgress || !moduleProgress.length) return "reading";
    
    // Find the module with the lowest average score
    const lowestScoring = [...moduleProgress].sort((a, b) => {
      const avgA = parseFloat(a.averages.overall) || 0;
      const avgB = parseFloat(b.averages.overall) || 0;
      return avgA - avgB;
    })[0];
    
    return lowestScoring.module;
  };
  
  // Time to next test - mock data
  const nextTestDate = new Date();
  nextTestDate.setDate(nextTestDate.getDate() + 7);
  const daysToNextTest = Math.ceil((nextTestDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const formatTestType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Track your IELTS preparation progress and plan your studies"
    >
      {/* Stats Overview */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Tests Completed"
          value={totalTests}
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
          description="Total tests completed so far"
        />
        
        <StatsCard
          title="Best Score"
          value={bestScore}
          icon={<Award className="h-5 w-5 text-primary" />}
          description="Your highest band score"
        />
        
        <StatsCard
          title="Practice Needed"
          value={getRecommendedModule().charAt(0).toUpperCase() + getRecommendedModule().slice(1)}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          description="Module that needs improvement"
          to={`/practice?module=${getRecommendedModule()}`}
        />
        
        <StatsCard
          title="Next Test"
          value={daysToNextTest}
          icon={<Calendar className="h-5 w-5 text-primary" />}
          description={`Days until next scheduled test (${nextTestDate.toLocaleDateString()})`}
        />
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <DashboardCard
            title="Practice Tests"
            description="Improve specific skills with targeted practice"
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            to="/practice"
          />
          
          <DashboardCard
            title="Simulation Tests"
            description="Complete full IELTS simulation exams"
            icon={<BookText className="h-5 w-5 text-primary" />}
            to="/simulation"
          />
          
          <DashboardCard
            title="My Results"
            description="View detailed reports of your past tests"
            icon={<BarChart className="h-5 w-5 text-primary" />}
            to="/results"
          />
        </div>
      </div>
      
      {/* Module Progress */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Module Progress</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {moduleProgress.map((module) => (
            <DashboardCard
              key={module.module}
              title={module.module.charAt(0).toUpperCase() + module.module.slice(1)}
              description={`${module.counts.total} tests completed`}
              className="h-full"
            >
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Average score:</span>
                  <span className="font-semibold text-gray-900">
                    {module.averages.overall}
                  </span>
                </div>
                
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div 
                    className="h-full bg-primary" 
                    style={{ 
                      width: `${(parseFloat(module.averages.overall) / 9) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex flex-col gap-1 pt-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Academic:</span>
                    <span className="font-medium">{module.averages.academic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>General:</span>
                    <span className="font-medium">{module.averages.general}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Link href={`/practice?module=${module.module}`}>
                  <a className="inline-flex items-center text-xs font-medium text-primary hover:underline">
                    Practice now
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Link>
              </div>
            </DashboardCard>
          ))}
        </div>
      </div>
      
      {/* Recent Tests */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Test Results</h2>
          <Link href="/results">
            <a className="text-sm font-medium text-primary hover:underline">
              View all
            </a>
          </Link>
        </div>
        
        {recentTests.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Test Type</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Reading</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Listening</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Writing</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Speaking</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500">Overall</th>
                  <th className="border-b border-gray-200 px-6 py-3 text-left font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 px-6 py-4 font-medium">
                      {formatDate(test.completedAt)}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4">
                      {formatTestType(test.testType)}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4">
                      {test.scores?.reading?.toFixed(1) || '-'}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4">
                      {test.scores?.listening?.toFixed(1) || '-'}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4">
                      {test.scores?.writing?.toFixed(1) || '-'}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4">
                      {test.scores?.speaking?.toFixed(1) || '-'}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 font-medium text-gray-900">
                      {test.scores?.overall?.toFixed(1) || '-'}
                    </td>
                    <td className="border-b border-gray-200 px-6 py-4 text-right">
                      <Link href={`/results/${test.id}`}>
                        <a className="font-medium text-primary hover:underline">
                          Details
                        </a>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No test results yet</h3>
            <p className="mt-2 text-gray-500">
              Take practice tests or simulations to see your results here.
            </p>
            <div className="mt-6">
              <Link href="/practice">
                <a className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                  Start practicing
                </a>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Study Tips */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">Study Tips</h2>
        <DashboardCard
          title="Improve your IELTS score"
          description="Quick tips to help you boost your performance"
          gradient
          bordered={false}
          icon={<Zap className="h-5 w-5 text-white" />}
        >
          <div className="mt-4 space-y-4">
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-white">
                1
              </div>
              <p className="text-sm text-white">
                Practice regularly with variety of topics to expand your vocabulary and improve comprehension.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-white">
                2
              </div>
              <p className="text-sm text-white">
                Time yourself during practice to build speed and accuracy under exam conditions.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-white">
                3
              </div>
              <p className="text-sm text-white">
                Review your mistakes and understand the reasons behind your incorrect answers.
              </p>
            </div>
            
            {showAll && (
              <>
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-white">
                    4
                  </div>
                  <p className="text-sm text-white">
                    Focus on your weakest areas and allocate more practice time to them.
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-white">
                    5
                  </div>
                  <p className="text-sm text-white">
                    Develop your writing skills by planning your essays before you start writing.
                  </p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 text-sm font-medium text-white underline"
          >
            {showAll ? "Show less" : "Show more tips"}
          </button>
        </DashboardCard>
      </div>
    </PageLayout>
  );
}