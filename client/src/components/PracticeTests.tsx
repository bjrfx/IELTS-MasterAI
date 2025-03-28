import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirebaseTests } from "@/hooks/useFirebaseTests";
import { useLocation } from "wouter";
import { Book, Headphones, Edit, Mic, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTest } from "@/contexts/TestContext";

interface PracticeTestsProps {
  moduleFilter?: 'reading' | 'listening' | 'writing' | 'speaking';
}

export default function PracticeTests({ moduleFilter }: PracticeTestsProps) {
  const { tests, isLoading } = useFirebaseTests();
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { setCurrentTest, setCurrentModule, setCurrentTestId, setTestType } = useTest();
  
  // Filter tests based on the selected module
  const filteredTests = moduleFilter 
    ? tests.filter(test => {
        switch(moduleFilter) {
          case 'reading': return test.hasReading;
          case 'listening': return test.hasListening;
          case 'writing': return test.hasWriting;
          case 'speaking': return test.hasSpeaking;
          default: return true;
        }
      })
    : tests;
    
  // Separate tests by type
  const academicTests = filteredTests.filter(test => test.type === 'academic');
  const generalTests = filteredTests.filter(test => test.type === 'general');

  const handleStartTest = (testId: string, moduleType: 'reading' | 'listening' | 'writing' | 'speaking') => {
    if (!currentUser) {
      setLocation("/login");
      return;
    }
    
    // Find the selected test
    const selectedTest = tests.find(test => test.id === testId);
    if (!selectedTest) return;
    
    // Set test context
    setCurrentTestId(testId);
    setCurrentModule(moduleType);
    setTestType(selectedTest.type as 'academic' | 'general');
    
    // Navigate to the test page
    setLocation(`/test/${testId}?module=${moduleType}&mode=practice`);
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'reading': return <Book className="h-5 w-5 text-primary" />;
      case 'listening': return <Headphones className="h-5 w-5 text-secondary" />;
      case 'writing': return <Edit className="h-5 w-5 text-accent" />;
      case 'speaking': return <Mic className="h-5 w-5 text-error" />;
      default: return <Book className="h-5 w-5 text-primary" />;
    }
  };

  const getModuleTitle = (module: string) => {
    return module.charAt(0).toUpperCase() + module.slice(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
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

  if (filteredTests.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-medium mb-2">No Practice Tests Available</h3>
          <p className="text-gray-500 mb-4">
            {moduleFilter 
              ? `There are no tests available for ${moduleFilter} practice.` 
              : "There are no practice tests available currently."}
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

  // Function to render test cards
  const renderTestCard = (test: any) => (
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
          <div className="flex space-x-1">
            {test.hasReading && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">Reading</span>
            )}
            {test.hasListening && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">Listening</span>
            )}
            {test.hasWriting && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">Writing</span>
            )}
            {test.hasSpeaking && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">Speaking</span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {(!moduleFilter || moduleFilter === 'reading') && test.hasReading && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => handleStartTest(test.id, 'reading')}
            >
              {getModuleIcon('reading')}
              <span className="ml-2">Practice Reading</span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
          
          {(!moduleFilter || moduleFilter === 'listening') && test.hasListening && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => handleStartTest(test.id, 'listening')}
            >
              {getModuleIcon('listening')}
              <span className="ml-2">Practice Listening</span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
          
          {(!moduleFilter || moduleFilter === 'writing') && test.hasWriting && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => handleStartTest(test.id, 'writing')}
            >
              {getModuleIcon('writing')}
              <span className="ml-2">Practice Writing</span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
          
          {(!moduleFilter || moduleFilter === 'speaking') && test.hasSpeaking && (
            <Button 
              variant="outline" 
              className="flex items-center justify-center"
              onClick={() => handleStartTest(test.id, 'speaking')}
            >
              {getModuleIcon('speaking')}
              <span className="ml-2">Practice Speaking</span>
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Academic Tests Section */}
      {academicTests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            Academic Tests
          </h2>
          <div className="space-y-4">
            {academicTests.map(test => renderTestCard(test))}
          </div>
        </div>
      )}

      {/* General Tests Section */}
      {generalTests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
              <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
              <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            General Training Tests
          </h2>
          <div className="space-y-4">
            {generalTests.map(test => renderTestCard(test))}
          </div>
        </div>
      )}
      
      {/* No tests message */}
      {academicTests.length === 0 && generalTests.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Practice Tests Available</h3>
            <p className="text-gray-500 mb-4">
              {moduleFilter 
                ? `There are no tests available for ${moduleFilter} practice.` 
                : "There are no practice tests available currently."}
            </p>
            {currentUser?.isAdmin && (
              <Button onClick={() => setLocation("/admin")} className="mt-2">
                Go to Admin Panel to Create Tests
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
