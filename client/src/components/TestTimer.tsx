import { useEffect } from 'react';
import { useTestTimer } from '@/hooks/useTestTimer';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TestTimerProps {
  module: 'reading' | 'writing' | 'listening' | 'speaking';
  onTimeUp?: () => void;
  autoStart?: boolean;
  className?: string;
}

export default function TestTimer({ 
  module, 
  onTimeUp, 
  autoStart = false,
  className = ''
}: TestTimerProps) {
  const { toast } = useToast();
  
  // Set timer duration based on module
  const getModuleDuration = () => {
    switch (module) {
      case 'reading':
        return 60; // 60 minutes
      case 'writing':
        return 60; // 60 minutes
      case 'listening':
        return 30; // 30 minutes
      case 'speaking':
        return 14; // 11-14 minutes (using max)
      default:
        return 60;
    }
  };

  const {
    formattedTime,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    timeLeft
  } = useTestTimer({
    minutes: getModuleDuration(),
    autoStart,
    onTimeUp: () => {
      toast({
        title: "Time's up!",
        description: `Your ${module} test time has ended.`,
        variant: "destructive",
      });
      if (onTimeUp) onTimeUp();
    }
  });

  // Notify when 5 minutes left
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft.total === 300) { // 5 minutes in seconds
      toast({
        title: "5 minutes remaining",
        description: `You have 5 minutes left to complete the ${module} test.`,
        variant: "warning",
      });
    }
  }, [timeLeft.total, isRunning, isPaused, module, toast]);

  return (
    <Card className={`bg-gray-50 rounded-lg px-4 py-2 flex items-center space-x-2 ${className}`}>
      <Clock className="text-amber-500" />
      <span className="text-lg font-medium" data-testid="timer">{formattedTime}</span>
      {!isRunning && !isPaused && (
        <Button variant="outline" size="sm" onClick={start}>
          Start
        </Button>
      )}
      {isRunning && !isPaused && (
        <Button variant="outline" size="sm" onClick={pause}>
          Pause
        </Button>
      )}
      {isPaused && (
        <Button variant="outline" size="sm" onClick={resume}>
          Resume
        </Button>
      )}
    </Card>
  );
}
