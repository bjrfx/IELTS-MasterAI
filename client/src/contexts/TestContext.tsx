import { createContext, useContext, useState, ReactNode } from "react";
import { TestContent, TestModule, TestAnswers, ModuleScores } from "@shared/schema";

interface TestContextProps {
  currentTest: TestContent | null;
  setCurrentTest: (test: TestContent | null) => void;
  currentModule: TestModule | null;
  setCurrentModule: (module: TestModule | null) => void;
  answers: TestAnswers;
  setAnswers: (answers: TestAnswers) => void;
  updateAnswer: (module: TestModule, questionId: string, answer: string | string[]) => void;
  scores: ModuleScores;
  setScores: (scores: ModuleScores) => void;
  timer: {
    minutes: number;
    seconds: number;
  };
  setTimer: (timer: { minutes: number; seconds: number }) => void;
  isTestActive: boolean;
  setIsTestActive: (active: boolean) => void;
  currentTestId: string | null;
  setCurrentTestId: (id: string | null) => void;
  testType: 'academic' | 'general' | null;
  setTestType: (type: 'academic' | 'general' | null) => void;
}

const TestContext = createContext<TestContextProps>({
  currentTest: null,
  setCurrentTest: () => {},
  currentModule: null,
  setCurrentModule: () => {},
  answers: {},
  setAnswers: () => {},
  updateAnswer: () => {},
  scores: {},
  setScores: () => {},
  timer: { minutes: 0, seconds: 0 },
  setTimer: () => {},
  isTestActive: false,
  setIsTestActive: () => {},
  currentTestId: null,
  setCurrentTestId: () => {},
  testType: null,
  setTestType: () => {},
});

export const useTest = () => useContext(TestContext);

interface TestProviderProps {
  children: ReactNode;
}

export const TestProvider = ({ children }: TestProviderProps) => {
  const [currentTest, setCurrentTest] = useState<TestContent | null>(null);
  const [currentModule, setCurrentModule] = useState<TestModule | null>(null);
  const [answers, setAnswers] = useState<TestAnswers>({});
  const [scores, setScores] = useState<ModuleScores>({});
  const [timer, setTimer] = useState({ minutes: 0, seconds: 0 });
  const [isTestActive, setIsTestActive] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [testType, setTestType] = useState<'academic' | 'general' | null>(null);

  const updateAnswer = (module: TestModule, questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [questionId]: answer,
      },
    }));
  };

  const value = {
    currentTest,
    setCurrentTest,
    currentModule,
    setCurrentModule,
    answers,
    setAnswers,
    updateAnswer,
    scores,
    setScores,
    timer,
    setTimer,
    isTestActive,
    setIsTestActive,
    currentTestId,
    setCurrentTestId,
    testType,
    setTestType,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};
