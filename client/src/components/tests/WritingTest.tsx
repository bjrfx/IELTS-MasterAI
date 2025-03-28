import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TestTimer from '@/components/TestTimer';
import { useTest } from '@/contexts/TestContext';
import { useToast } from '@/hooks/use-toast';
import { Save, AlertCircle } from 'lucide-react';

export default function WritingTest() {
  const { currentTest, updateAnswer, answers } = useTest();
  const [activeTab, setActiveTab] = useState('task1');
  const { toast } = useToast();
  const [wordCounts, setWordCounts] = useState({ task1: 0, task2: 0 });
  
  if (!currentTest || !currentTest.writing || !currentTest.writing.tasks) {
    return (
      <div className="text-center p-8">
        <p>No writing test data available.</p>
      </div>
    );
  }
  
  const tasks = currentTest.writing.tasks;
  const task1 = tasks.find(task => task.type === 'task1');
  const task2 = tasks.find(task => task.type === 'task2');
  
  const handleTextChange = (taskType: 'task1' | 'task2', value: string) => {
    updateAnswer('writing', taskType, value);
    
    // Count words
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCounts(prev => ({
      ...prev,
      [taskType]: words.length
    }));
  };
  
  const handleSave = (taskType: 'task1' | 'task2') => {
    toast({
      title: "Response saved",
      description: `Your ${taskType === 'task1' ? 'Task 1' : 'Task 2'} response has been saved.`,
    });
  };
  
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your writing responses have been automatically submitted.",
      variant: "destructive",
    });
    // Here you would trigger submission of answers
  };
  
  const getMinimumWordCount = (taskType: 'task1' | 'task2') => {
    return taskType === 'task1' ? 150 : 250;
  };
  
  const getTaskValue = (taskType: 'task1' | 'task2'): string => {
    return (answers.writing && answers.writing[taskType]) as string || '';
  };
  
  const isWordCountSufficient = (taskType: 'task1' | 'task2') => {
    return wordCounts[taskType] >= getMinimumWordCount(taskType);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Writing Test</h2>
            <p className="text-sm text-gray-600">Complete both tasks in 60 minutes</p>
          </div>
          <TestTimer module="writing" onTimeUp={handleTimeUp} />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="task1">Task 1</TabsTrigger>
              <TabsTrigger value="task2">Task 2</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="task1" className="p-6">
            {task1 && (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Task 1</h3>
                  <div className="prose prose-sm max-w-none text-gray-900 mb-4">
                    <p>{task1.instructions}</p>
                  </div>
                  
                  {task1.content && (
                    <div className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                      <p className="text-sm">{task1.content}</p>
                    </div>
                  )}
                  
                  {task1.imageDescription && (
                    <div className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                      <div className="flex items-center justify-center p-4 bg-gray-200 text-gray-700">
                        [Image description: {task1.imageDescription}]
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="task1-response" className="text-sm font-medium text-gray-700">
                      Your response (minimum {getMinimumWordCount('task1')} words)
                    </label>
                    <span className={`text-sm ${isWordCountSufficient('task1') ? 'text-green-600' : 'text-amber-600'}`}>
                      {wordCounts.task1} words
                    </span>
                  </div>
                  
                  <Textarea
                    id="task1-response"
                    value={getTaskValue('task1')}
                    onChange={(e) => handleTextChange('task1', e.target.value)}
                    placeholder="Write your response here..."
                    className="min-h-[300px]"
                  />
                  
                  {!isWordCountSufficient('task1') && (
                    <div className="flex items-center mt-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Your response should be at least {getMinimumWordCount('task1')} words.</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('task1')} 
                    className="flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Response
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="task2" className="p-6">
            {task2 && (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Task 2</h3>
                  <div className="prose prose-sm max-w-none text-gray-900 mb-4">
                    <p>{task2.instructions}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="task2-response" className="text-sm font-medium text-gray-700">
                      Your response (minimum {getMinimumWordCount('task2')} words)
                    </label>
                    <span className={`text-sm ${isWordCountSufficient('task2') ? 'text-green-600' : 'text-amber-600'}`}>
                      {wordCounts.task2} words
                    </span>
                  </div>
                  
                  <Textarea
                    id="task2-response"
                    value={getTaskValue('task2')}
                    onChange={(e) => handleTextChange('task2', e.target.value)}
                    placeholder="Write your response here..."
                    className="min-h-[400px]"
                  />
                  
                  {!isWordCountSufficient('task2') && (
                    <div className="flex items-center mt-2 text-amber-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Your response should be at least {getMinimumWordCount('task2')} words.</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSave('task2')} 
                    className="flex items-center"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Response
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
