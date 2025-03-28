import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import TestTimer from '@/components/TestTimer';
import { useTest } from '@/contexts/TestContext';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';

// Mock function for text-to-speech as we don't have real audio files
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower than normal
    window.speechSynthesis.speak(utterance);
    return utterance;
  }
  return null;
};

export default function ListeningTest() {
  const { currentTest, updateAnswer, answers } = useTest();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canNavigate, setCanNavigate] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();
  
  const sections = currentTest?.listening?.sections || [];
  const currentSection = sections[currentSectionIndex];
  
  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCanNavigate(true);
      return;
    }
    
    setIsPlaying(true);
    setCanNavigate(false);
    toast({
      title: "Audio started",
      description: "Please listen carefully and answer the questions.",
    });
    
    const utterance = speakText(currentSection.audioText);
    if (utterance) {
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCanNavigate(true);
        toast({
          title: "Audio finished",
          description: "You can now answer the questions or navigate to the next section.",
        });
      };
    }
  };
  
  const handleNextSection = () => {
    if (!canNavigate) return;
    
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePreviousSection = () => {
    if (!canNavigate) return;
    
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleInputAnswer = (questionId: number, value: string) => {
    updateAnswer('listening', `${questionId}`, value);
  };
  
  const handleRadioAnswer = (questionId: number, value: string) => {
    updateAnswer('listening', `${questionId}`, value);
  };
  
  const handleTimeUp = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    
    toast({
      title: "Time's up!",
      description: "Your answers have been automatically submitted.",
      variant: "destructive",
    });
    // Here you would trigger submission of answers
  };
  
  const getQuestionValue = (questionId: number): string => {
    return (answers.listening && answers.listening[`${questionId}`]) as string || '';
  };
  
  if (!currentTest || !currentTest.listening) {
    return (
      <div className="text-center p-8">
        <p>No listening test data available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Listening Test</h2>
            <p className="text-sm text-gray-600">Complete all sections in 30 minutes</p>
          </div>
          <TestTimer module="listening" onTimeUp={handleTimeUp} />
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Section {currentSectionIndex + 1}: {currentSection?.title}</h3>
            
            <Card className="bg-gray-50 mb-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Volume2 className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-sm font-medium">Audio for Section {currentSectionIndex + 1}</span>
                  </div>
                  <Button 
                    onClick={handlePlayAudio}
                    variant={isPlaying ? "destructive" : "default"}
                    className="flex items-center"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Audio
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play Audio
                      </>
                    )}
                  </Button>
                </div>
                
                {isPlaying && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Audio is playing. Please listen carefully.</p>
                    <p className="mt-1">You cannot navigate until the audio is complete.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <h4 className="font-semibold mb-4">
                Questions {currentSection?.questions[0]?.id} - {currentSection?.questions[currentSection.questions.length - 1]?.id}
              </h4>
              
              {currentSection?.questions.map((question) => (
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
                              onchange="this.dispatchEvent(new CustomEvent('listening-answer-changed', {bubbles: true, detail: {id: ${question.id}, value: this.value}}))"
                            />`
                          ) 
                        }} />
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
                              <RadioGroupItem value={option} id={`lq${question.id}-opt${i}`} />
                              <Label htmlFor={`lq${question.id}-opt${i}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePreviousSection} 
              disabled={currentSectionIndex === 0 || !canNavigate}
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous Section
            </Button>
            
            <Button 
              onClick={handleNextSection} 
              disabled={currentSectionIndex === sections.length - 1 || !canNavigate}
              className="flex items-center"
            >
              Next Section
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Listen for custom events from the HTML in dangerouslySetInnerHTML */}
      <div style={{ display: 'none' }} id="listening-event-listener" 
        onAnswerChanged={(e: any) => {
          const { id, value } = e.detail;
          handleInputAnswer(id, value);
        }}
      />
    </div>
  );
}

// Add event listener to document for the custom event
document.addEventListener('listening-answer-changed', (e: any) => {
  const eventListener = document.getElementById('listening-event-listener');
  if (eventListener && eventListener.onAnswerChanged) {
    eventListener.onAnswerChanged(e);
  }
});
