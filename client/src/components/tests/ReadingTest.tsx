import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import TestTimer from '@/components/TestTimer';
import { useTest } from '@/contexts/TestContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReadingTest() {
  const { currentTest, updateAnswer, answers } = useTest();
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const { toast } = useToast();
  
  const passages = currentTest?.reading?.passages || [];
  const currentPassage = passages[currentPassageIndex];
  
  const handleNextPassage = () => {
    if (currentPassageIndex < passages.length - 1) {
      setCurrentPassageIndex(currentPassageIndex + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePreviousPassage = () => {
    if (currentPassageIndex > 0) {
      setCurrentPassageIndex(currentPassageIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleInputAnswer = (questionId: number, value: string) => {
    updateAnswer('reading', `${questionId}`, value);
  };
  
  const handleRadioAnswer = (questionId: number, value: string) => {
    updateAnswer('reading', `${questionId}`, value);
  };
  
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your answers have been automatically submitted.",
    });
    // Here you would trigger submission of answers
  };
  
  const getQuestionValue = (questionId: number): string => {
    return (answers.reading && answers.reading[`${questionId}`]) as string || '';
  };
  
  if (!currentTest || !currentTest.reading) {
    return (
      <div className="text-center p-8">
        <p>No reading test data available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reading Test</h2>
            <p className="text-sm text-gray-600">Answer all questions in 60 minutes</p>
          </div>
          <TestTimer module="reading" onTimeUp={handleTimeUp} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6">
          {/* Reading Passage */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3">Passage {currentPassageIndex + 1}</h3>
              <h4 className="font-semibold mb-4">{currentPassage?.title}</h4>
              
              <div className="prose prose-sm max-w-none text-gray-900">
                {currentPassage?.content.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Questions */}
          <div className="p-6">
            <h3 className="font-semibold mb-4">
              Questions {currentPassage?.questions[0]?.id} - {currentPassage?.questions[currentPassage.questions.length - 1]?.id}
            </h3>
            
            <div className="space-y-6">
              {currentPassage?.questions.map((question) => (
                <div key={question.id} className="mb-6">
                  {question.type === 'fill-blank' && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">{question.id}.</span>
                      <div className="flex-grow">
                        <div dangerouslySetInnerHTML={{ 
                          __html: question.text.replace(
                            /\[BLANK\]/g, 
                            `<input type="text" 
                              class="border-b border-gray-600 w-24 focus:outline-none focus:border-primary px-1" 
                              value="${getQuestionValue(question.id)}" 
                              onchange="this.dispatchEvent(new CustomEvent('answer-changed', {bubbles: true, detail: {id: ${question.id}, value: this.value}}))"
                            />`
                          ) 
                        }} />
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'true-false-ng' && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">{question.id}.</span>
                      <div className="flex-grow">
                        <p className="mb-2">{question.text}</p>
                        <RadioGroup 
                          value={getQuestionValue(question.id)}
                          onValueChange={(value) => handleRadioAnswer(question.id, value)}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`q${question.id}-true`} />
                            <Label htmlFor={`q${question.id}-true`}>True</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`q${question.id}-false`} />
                            <Label htmlFor={`q${question.id}-false`}>False</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="not-given" id={`q${question.id}-ng`} />
                            <Label htmlFor={`q${question.id}-ng`}>Not Given</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                  
                  {question.type === 'multiple-choice' && (
                    <div className="flex items-start">
                      <span className="font-medium mr-2">{question.id}.</span>
                      <div className="flex-grow">
                        <p className="mb-2">{question.text}</p>
                        <RadioGroup 
                          value={getQuestionValue(question.id)}
                          onValueChange={(value) => handleRadioAnswer(question.id, value)}
                          className="space-y-2"
                        >
                          {question.options?.map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`q${question.id}-opt${i}`} />
                              <Label htmlFor={`q${question.id}-opt${i}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={handlePreviousPassage} 
                disabled={currentPassageIndex === 0}
                className="flex items-center"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              
              <Button 
                onClick={handleNextPassage} 
                disabled={currentPassageIndex === passages.length - 1}
                className="flex items-center"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Listen for custom events from the HTML in dangerouslySetInnerHTML */}
      <div style={{ display: 'none' }} id="event-listener" 
        onAnswerChanged={(e: any) => {
          const { id, value } = e.detail;
          handleInputAnswer(id, value);
        }}
      />
    </div>
  );
}

// Add event listener to document for the custom event
document.addEventListener('answer-changed', (e: any) => {
  const eventListener = document.getElementById('event-listener');
  if (eventListener && eventListener.onAnswerChanged) {
    eventListener.onAnswerChanged(e);
  }
});
