import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TestTimer from '@/components/TestTimer';
import { useTest } from '@/contexts/TestContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Save,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function SpeakingTest() {
  const { currentTest, updateAnswer, answers } = useTest();
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepTime, setPrepTime] = useState(60); // 1 minute prep time
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime, setMaxRecordingTime] = useState(120); // 2 minutes by default
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const parts = currentTest?.speaking?.parts || [];
  const currentPart = parts[currentPartIndex];
  const currentQuestion = currentPart?.questions[currentQuestionIndex];
  
  // Clean up timers and media recorder on unmount
  useEffect(() => {
    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  // Set up preparation timer
  const startPrepTimer = () => {
    setIsPreparing(true);
    setPrepTime(60);
    
    prepTimerRef.current = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(prepTimerRef.current!);
          setIsPreparing(false);
          toast({
            title: "Preparation time ended",
            description: "You can now start recording your response.",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Record audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Save the audio URL to the answers
        const questionId = `part${currentPart.part}-q${currentQuestionIndex}`;
        updateAnswer('speaking', questionId, audioUrl);
        
        toast({
          title: "Recording saved",
          description: "Your response has been saved.",
        });
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Set up recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxRecordingTime - 1) {
            stopRecording();
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone error",
        description: "Could not access your microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleNextQuestion = () => {
    // Stop any ongoing recording or prep timer
    if (isRecording) {
      stopRecording();
    }
    if (isPreparing && prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      setIsPreparing(false);
    }
    
    if (currentQuestionIndex < currentPart.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentPartIndex < parts.length - 1) {
      setCurrentPartIndex(currentPartIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };
  
  const handlePreviousQuestion = () => {
    // Stop any ongoing recording or prep timer
    if (isRecording) {
      stopRecording();
    }
    if (isPreparing && prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      setIsPreparing(false);
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentPartIndex > 0) {
      setCurrentPartIndex(currentPartIndex - 1);
      const prevPartQuestions = parts[currentPartIndex - 1].questions;
      setCurrentQuestionIndex(prevPartQuestions.length - 1);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getAnswerAudioUrl = (partIndex: number, questionIndex: number): string => {
    const questionId = `part${parts[partIndex].part}-q${questionIndex}`;
    return (answers.speaking && answers.speaking[questionId]) as string || '';
  };
  
  const handleTimeUp = () => {
    toast({
      title: "Time's up!",
      description: "Your speaking test has ended.",
      variant: "destructive",
    });
    // Here you would trigger submission of answers
  };
  
  if (!currentTest || !currentTest.speaking) {
    return (
      <div className="text-center p-8">
        <p>No speaking test data available.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <Card className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Speaking Test</h2>
            <p className="text-sm text-gray-600">Complete all parts in 11-14 minutes</p>
          </div>
          <TestTimer module="speaking" onTimeUp={handleTimeUp} />
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3">Part {currentPart.part}</h3>
            
            <Card className="bg-gray-50 mb-6">
              <CardContent className="p-4">
                <h4 className="font-medium mb-4">Question {currentQuestionIndex + 1}:</h4>
                <p className="text-lg mb-6">{currentQuestion.text}</p>
                
                {currentQuestion.followUpQuestions && currentQuestion.followUpQuestions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Follow-up Questions:</h5>
                    <ul className="list-disc pl-5 space-y-2">
                      {currentQuestion.followUpQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              {/* Preparation Timer */}
              {isPreparing && (
                <Card className="border border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-amber-600" />
                        <span className="font-medium">Preparation Time</span>
                      </div>
                      <span className="text-lg font-bold">{formatTime(prepTime)}</span>
                    </div>
                    <Progress value={(prepTime / 60) * 100} className="h-2" />
                    <p className="text-sm mt-2 text-amber-700">
                      Use this time to think about your answer.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Recording Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Your Response</h4>
                    {isRecording && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
                        <span className="font-medium">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                  
                  {isRecording && (
                    <Progress 
                      value={(recordingTime / maxRecordingTime) * 100} 
                      className="h-2 mb-4"
                    />
                  )}
                  
                  <div className="flex flex-wrap gap-3">
                    {!isPreparing && !isRecording && (
                      <Button 
                        onClick={startPrepTimer}
                        variant="outline"
                        className="flex items-center"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Start Preparation Timer
                      </Button>
                    )}
                    
                    {!isRecording && (
                      <Button 
                        onClick={startRecording}
                        disabled={isPreparing}
                        className="flex items-center bg-red-500 hover:bg-red-600"
                      >
                        <Mic className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    )}
                    
                    {isRecording && (
                      <Button 
                        onClick={stopRecording}
                        variant="destructive"
                        className="flex items-center"
                      >
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                  </div>
                  
                  {/* Recorded Audio Player */}
                  {getAnswerAudioUrl(currentPartIndex, currentQuestionIndex) && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Your recorded response:
                      </label>
                      <audio 
                        src={getAnswerAudioUrl(currentPartIndex, currentQuestionIndex)} 
                        controls 
                        className="w-full"
                      ></audio>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePreviousQuestion} 
              disabled={currentPartIndex === 0 && currentQuestionIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous Question
            </Button>
            
            <Button 
              onClick={handleNextQuestion} 
              disabled={currentPartIndex === parts.length - 1 && currentQuestionIndex === currentPart.questions.length - 1}
              className="flex items-center"
            >
              Next Question
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
