import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, BookOpen, Save, AlertCircle, Info, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { generateTest } from '@/lib/services/geminiService';
import { saveTest } from '@/lib/services/testService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/ui/rich-text-editor';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Question types based on IELTS Academic Reading format
type QuestionType = 
  | 'multiple-choice' 
  | 'identifying-information' // True/False/Not Given
  | 'identifying-views' // Yes/No/Not Given
  | 'matching-headings'
  | 'matching-information'
  | 'matching-features'
  | 'matching-sentence-endings'
  | 'sentence-completion'
  | 'summary-completion'
  | 'note-completion'
  | 'table-completion'
  | 'diagram-completion'
  | 'short-answer';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  answer: string;
  instructions?: string;
  subQuestions?: {
    id: string;
    text: string;
    answer: string;
  }[];
}

interface Passage {
  title: string;
  content: string;
  questions: Question[];
  source?: string;
  topic?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface ReadingTest {
  passages: Passage[];
  tags: string[];
  type: 'practice' | 'simulation';
  timeLimit: number;
}

// Helper to create an empty question
const createEmptyQuestion = (id: number, type: QuestionType = 'multiple-choice'): Question => ({
  id,
  text: '',
  type,
  options: type === 'multiple-choice' ? ['', '', '', ''] : [],
  answer: '',
  instructions: '',
  subQuestions: (type.includes('completion') || type === 'short-answer') ? 
    Array(3).fill(null).map((_, i) => ({ id: `${id}.${i+1}`, text: '', answer: '' })) : 
    undefined
});

// Initial distribution of questions across passages - changed to variables for configurability
const DEFAULT_PASSAGE_1_QUESTIONS = 13;
const DEFAULT_PASSAGE_2_QUESTIONS = 13;
const DEFAULT_PASSAGE_3_QUESTIONS = 14;

export default function AcademicReading() {
  const [questionCounts, setQuestionCounts] = useState({
    passage1: DEFAULT_PASSAGE_1_QUESTIONS,
    passage2: DEFAULT_PASSAGE_2_QUESTIONS,
    passage3: DEFAULT_PASSAGE_3_QUESTIONS
  });
  
  const [test, setTest] = useState<ReadingTest>({
    passages: [
      {
        title: 'Academic Passage 1',
        content: '',
        questions: Array(questionCounts.passage1).fill(null).map((_, index) => 
          createEmptyQuestion(index + 1)
        ),
        source: '',
        topic: 'Social Science',
        difficulty: 'basic'
      },
      {
        title: 'Academic Passage 2',
        content: '',
        questions: Array(questionCounts.passage2).fill(null).map((_, index) => 
          createEmptyQuestion(index + questionCounts.passage1 + 1)
        ),
        source: '',
        topic: 'Natural Science',
        difficulty: 'intermediate'
      },
      {
        title: 'Academic Passage 3',
        content: '',
        questions: Array(questionCounts.passage3).fill(null).map((_, index) => 
          createEmptyQuestion(index + questionCounts.passage1 + questionCounts.passage2 + 1)
        ),
        source: '',
        topic: 'Arts/Humanities',
        difficulty: 'advanced'
      }
    ],
    tags: [],
    type: 'practice',
    timeLimit: 60
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePassage, setActivePassage] = useState(0);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      const response = await generateTest({
        testType: 'academic',
        module: 'reading'
      });
      
      if (response && response.passages) {
        setTest(prev => {
          // Ensure we maintain proper structure while updating with AI response
          const updatedTest = {
            ...prev,
            passages: prev.passages.map((passage, index) => {
              const aiPassage = response.passages[index];
              if (!aiPassage) return passage;
              
              return {
                ...passage,
                title: aiPassage.title || passage.title,
                content: aiPassage.content || passage.content,
                questions: Array.isArray(aiPassage.questions)
                  ? aiPassage.questions.map((q: any, qIndex: number) => {
                      const baseId = index === 0 ? qIndex + 1 : 
                                    index === 1 ? qIndex + questionCounts.passage1 + 1 :
                                    qIndex + questionCounts.passage1 + questionCounts.passage2 + 1;
                      return {
                        id: baseId,
                        text: q.text || '',
                        type: q.type || 'multiple-choice',
                        options: Array.isArray(q.options) ? q.options : [],
                        answer: q.answer || '',
                        instructions: q.instructions || '',
                        subQuestions: q.subQuestions || undefined
                      };
                    })
                  : passage.questions,
                source: aiPassage.source || passage.source,
                topic: aiPassage.topic || passage.topic
              };
            }),
            type: response.type || prev.type,
            tags: Array.isArray(response.tags) ? response.tags : prev.tags,
            timeLimit: response.timeLimit || prev.timeLimit
          };
          return updatedTest;
        });
      }
    } catch (error) {
      console.error('Error generating test:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag && !test.tags.includes(currentTag)) {
      setTest(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTest(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveTest = async () => {
    try {
      // Format the test data to match the expected structure in Practice/Simulation pages
      const formattedTest = {
        ...test,
        title: `Academic Reading Test - ${new Date().toLocaleDateString()}`,
        module: 'reading',
        testType: 'academic',
        type: test.type,
        // Add these fields to make it compatible with Practice/Simulation pages
        hasReading: true,
        hasListening: false,
        hasWriting: false,
        hasSpeaking: false,
        status: 'active',
        // Format content to match expected structure
        content: {
          reading: {
            passages: test.passages.map((passage) => ({
              title: passage.title || '',
              content: passage.content || '',
              questions: passage.questions.map(q => ({
                id: q.id,
                text: q.text || '',
                type: q.type || 'multiple-choice',
                options: Array.isArray(q.options) ? q.options : [],
                answer: q.answer || '',
                instructions: q.instructions || '',
                subQuestions: q.subQuestions ? q.subQuestions.map(sq => ({
                  id: sq.id || '',
                  text: sq.text || '',
                  answer: sq.answer || ''
                })) : undefined
              })),
              source: passage.source || '',
              topic: passage.topic || '',
              difficulty: passage.difficulty || 'basic'
            }))
          }
        }
      };

      const testId = await saveTest(formattedTest);
      
      toast({
        title: "Test Saved Successfully",
        description: "Your Academic Reading test has been saved and is now available in the Practice section.",
        variant: "default"
      });
      
      // Redirect to practice page after successful save
      setTimeout(() => {
        window.location.href = '/practice?module=reading';
      }, 2000);
    } catch (error) {
      console.error('Error saving test:', error);
      toast({
        title: "Error Saving Test",
        description: "There was a problem saving your test. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleQuestionTypeChange = (passageIndex: number, questionIndex: number, newType: QuestionType) => {
    setTest(prev => ({
      ...prev,
      passages: prev.passages.map((p, idx) =>
        idx === passageIndex
          ? {
              ...p,
              questions: p.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...createEmptyQuestion(q.id, newType as QuestionType),
                      text: q.text // preserve question text
                    }
                  : q
              )
            }
          : p
      )
    }));
  };

  const addSubQuestion = (passageIndex: number, questionIndex: number) => {
    setTest(prev => {
      const question = prev.passages[passageIndex].questions[questionIndex];
      const newSubQuestions = [...(question.subQuestions || [])];
      const newId = `${question.id}.${newSubQuestions.length + 1}`;
      
      newSubQuestions.push({
        id: newId,
        text: '',
        answer: ''
      });
      
      return {
        ...prev,
        passages: prev.passages.map((p, idx) =>
          idx === passageIndex
            ? {
                ...p,
                questions: p.questions.map((q, qIdx) =>
                  qIdx === questionIndex
                    ? { ...q, subQuestions: newSubQuestions }
                    : q
                )
              }
            : p
        )
      };
    });
  };

  const removeSubQuestion = (passageIndex: number, questionIndex: number, subQuestionIndex: number) => {
    setTest(prev => {
      const question = prev.passages[passageIndex].questions[questionIndex];
      if (!question.subQuestions) return prev;
      
      const newSubQuestions = question.subQuestions.filter((_, idx) => idx !== subQuestionIndex);
      
      return {
        ...prev,
        passages: prev.passages.map((p, idx) =>
          idx === passageIndex
            ? {
                ...p,
                questions: p.questions.map((q, qIdx) =>
                  qIdx === questionIndex
                    ? { ...q, subQuestions: newSubQuestions }
                    : q
                )
              }
            : p
        )
      };
    });
  };

  const getDifficultyBadge = (difficulty: 'basic' | 'intermediate' | 'advanced') => {
    switch(difficulty) {
      case 'basic': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Basic</Badge>;
      case 'intermediate': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Intermediate</Badge>;
      case 'advanced': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Advanced</Badge>;
      default: return null;
    }
  };

  const renderQuestionEditor = (passage: Passage, passageIndex: number, question: Question, questionIndex: number) => {
    const isExpanded = expandedQuestion === question.id;
    
    return (
      <Card key={question.id} className="mb-4 overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
        style={{
          borderLeftColor: passageIndex === 0 ? '#4ade80' : 
                          passageIndex === 1 ? '#facc15' : '#f87171'
        }}
      >
        <div className="flex items-center justify-between p-4 cursor-pointer"
             onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{question.id}</Badge>
            <h4 className="font-medium truncate max-w-md">
              {question.text || `Question ${question.id} (${question.type.replace(/-/g, ' ')})`}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{question.type.replace(/-/g, ' ')}</Badge>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 pt-0 border-t">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Label htmlFor={`question-${question.id}-text`}>Question Text</Label>
                  <Input
                    id={`question-${question.id}-text`}
                    value={question.text}
                    onChange={(e) => setTest(prev => ({
                      ...prev,
                      passages: prev.passages.map((p, idx) =>
                        idx === passageIndex
                          ? {
                              ...p,
                              questions: p.questions.map((q, qIdx) =>
                                qIdx === questionIndex
                                  ? { ...q, text: e.target.value }
                                  : q
                              )
                            }
                          : p
                      )
                    }))}
                    placeholder="Enter question text"
                  />
                </div>
                <div>
                  <Label htmlFor={`question-${question.id}-type`}>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => handleQuestionTypeChange(passageIndex, questionIndex, value as QuestionType)}
                  >
                    <SelectTrigger id={`question-${question.id}-type`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="identifying-information">True/False/Not Given</SelectItem>
                      <SelectItem value="identifying-views">Yes/No/Not Given</SelectItem>
                      <SelectItem value="matching-headings">Matching Headings</SelectItem>
                      <SelectItem value="matching-information">Matching Information</SelectItem>
                      <SelectItem value="matching-features">Matching Features</SelectItem>
                      <SelectItem value="matching-sentence-endings">Matching Sentence Endings</SelectItem>
                      <SelectItem value="sentence-completion">Sentence Completion</SelectItem>
                      <SelectItem value="summary-completion">Summary Completion</SelectItem>
                      <SelectItem value="table-completion">Table/Note Completion</SelectItem>
                      <SelectItem value="diagram-completion">Diagram Completion</SelectItem>
                      <SelectItem value="short-answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor={`question-${question.id}-instructions`}>Instructions (Optional)</Label>
                <Input
                  id={`question-${question.id}-instructions`}
                  value={question.instructions || ''}
                  onChange={(e) => setTest(prev => ({
                    ...prev,
                    passages: prev.passages.map((p, idx) =>
                      idx === passageIndex
                        ? {
                            ...p,
                            questions: p.questions.map((q, qIdx) =>
                              qIdx === questionIndex
                                ? { ...q, instructions: e.target.value }
                                : q
                            )
                          }
                        : p
                    )
                  }))}
                  placeholder="Enter specific instructions for this question"
                />
              </div>
              
              {/* Multiple Choice Options */}
              {question.type === 'multiple-choice' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                        {String.fromCharCode(65 + optionIndex)}
                      </Badge>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[optionIndex] = e.target.value;
                          setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, options: newOptions }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }));
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      />
                      {(question.options || []).length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = (question.options || []).filter(
                              (_, idx) => idx !== optionIndex
                            );
                            setTest(prev => ({
                              ...prev,
                              passages: prev.passages.map((p, idx) =>
                                idx === passageIndex
                                  ? {
                                      ...p,
                                      questions: p.questions.map((q, qIdx) =>
                                        qIdx === questionIndex
                                          ? { ...q, options: newOptions }
                                          : q
                                      )
                                    }
                                  : p
                              )
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {(question.options || []).length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = [...(question.options || []), ''];
                        setTest(prev => ({
                          ...prev,
                          passages: prev.passages.map((p, idx) =>
                            idx === passageIndex
                              ? {
                                  ...p,
                                  questions: p.questions.map((q, qIdx) =>
                                    qIdx === questionIndex
                                      ? { ...q, options: newOptions }
                                      : q
                                  )
                                }
                              : p
                          )
                        }));
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>
              )}
              
              {/* True/False/Not Given or Yes/No/Not Given */}
              {(question.type === 'identifying-information' || question.type === 'identifying-views') && (
                <div>
                  <Label>Answer Options</Label>
                  <div className="flex gap-2 mt-1">
                    {question.type === 'identifying-information' ? (
                      <>
                        <Badge 
                          variant={question.answer === 'TRUE' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'TRUE' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          TRUE
                        </Badge>
                        <Badge 
                          variant={question.answer === 'FALSE' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'FALSE' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          FALSE
                        </Badge>
                        <Badge 
                          variant={question.answer === 'NOT GIVEN' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NOT GIVEN' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          NOT GIVEN
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Badge 
                          variant={question.answer === 'YES' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'YES' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          YES
                        </Badge>
                        <Badge 
                          variant={question.answer === 'NO' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NO' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          NO
                        </Badge>
                        <Badge 
                          variant={question.answer === 'NOT GIVEN' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex
                                ? {
                                    ...p,
                                    questions: p.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NOT GIVEN' }
                                        : q
                                    )
                                  }
                                : p
                            )
                          }))}
                        >
                          NOT GIVEN
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Matching questions */}
              {question.type.startsWith('matching') && (
                <div className="space-y-4">
                  <div>
                    <Label>Matching Options</Label>
                    <Textarea
                      value={(question.options || []).join('\n')}
                      onChange={(e) => {
                        const options = e.target.value.split('\n').filter(option => option.trim() !== '');
                        setTest(prev => ({
                          ...prev,
                          passages: prev.passages.map((p, idx) =>
                            idx === passageIndex
                              ? {
                                  ...p,
                                  questions: p.questions.map((q, qIdx) =>
                                    qIdx === questionIndex
                                      ? { ...q, options }
                                      : q
                                  )
                                }
                              : p
                          )
                        }));
                      }}
                      placeholder="Enter one option per line (e.g., A. Description)"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <Input
                      value={question.answer}
                      onChange={(e) => setTest(prev => ({
                        ...prev,
                        passages: prev.passages.map((p, idx) =>
                          idx === passageIndex
                            ? {
                                ...p,
                                questions: p.questions.map((q, qIdx) =>
                                  qIdx === questionIndex
                                    ? { ...q, answer: e.target.value }
                                    : q
                                )
                              }
                            : p
                        )
                      }))}
                      placeholder="Correct match (e.g., B)"
                    />
                  </div>
                </div>
              )}
              
              {/* Completion and Short Answer questions */}
              {(question.type.includes('completion') || question.type === 'short-answer') && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Sub-questions</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSubQuestion(passageIndex, questionIndex)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Sub-question
                      </Button>
                    </div>
                    
                    {(question.subQuestions || []).length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        No sub-questions added yet. Click the button above to add one.
                      </p>
                    )}
                    
                    {(question.subQuestions || []).map((subQ, subIndex) => (
                      <div key={subQ.id} className="border p-3 rounded-md mb-3 grid grid-cols-12 gap-2">
                        <div className="col-span-1 flex items-center justify-center">
                          <Badge variant="outline">{subQ.id}</Badge>
                        </div>
                        <div className="col-span-6">
                          <Input
                            value={subQ.text}
                            onChange={(e) => {
                              if (!question.subQuestions) return;
                              const newSubQuestions = [...question.subQuestions];
                              newSubQuestions[subIndex] = {
                                ...newSubQuestions[subIndex],
                                text: e.target.value
                              };
                              
                              setTest(prev => ({
                                ...prev,
                                passages: prev.passages.map((p, idx) =>
                                  idx === passageIndex
                                    ? {
                                        ...p,
                                        questions: p.questions.map((q, qIdx) =>
                                          qIdx === questionIndex
                                            ? { ...q, subQuestions: newSubQuestions }
                                            : q
                                        )
                                      }
                                    : p
                                )
                              }));
                            }}
                            placeholder="Sub-question text"
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            value={subQ.answer}
                            onChange={(e) => {
                              if (!question.subQuestions) return;
                              const newSubQuestions = [...question.subQuestions];
                              newSubQuestions[subIndex] = {
                                ...newSubQuestions[subIndex],
                                answer: e.target.value
                              };
                              
                              setTest(prev => ({
                                ...prev,
                                passages: prev.passages.map((p, idx) =>
                                  idx === passageIndex
                                    ? {
                                        ...p,
                                        questions: p.questions.map((q, qIdx) =>
                                          qIdx === questionIndex
                                            ? { ...q, subQuestions: newSubQuestions }
                                            : q
                                        )
                                      }
                                    : p
                                )
                              }));
                            }}
                            placeholder="Answer"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubQuestion(passageIndex, questionIndex, subIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Answer for single-answer questions */}
              {!question.type.includes('completion') && 
                question.type !== 'short-answer' && 
                !question.type.startsWith('matching') && 
                question.type !== 'identifying-information' && 
                question.type !== 'identifying-views' && (
                <div>
                  <Label>Correct Answer</Label>
                  <Input
                    value={question.answer}
                    onChange={(e) => setTest(prev => ({
                      ...prev,
                      passages: prev.passages.map((p, idx) =>
                        idx === passageIndex
                          ? {
                              ...p,
                              questions: p.questions.map((q, qIdx) =>
                                qIdx === questionIndex
                                  ? { ...q, answer: e.target.value }
                                  : q
                              )
                            }
                          : p
                      )
                    }))}
                    placeholder="Correct answer"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const updatePassageQuestionCount = (passageIndex: number, newCount: number) => {
    setQuestionCounts(prev => {
      const newCounts = { ...prev };
      if (passageIndex === 0) newCounts.passage1 = newCount;
      if (passageIndex === 1) newCounts.passage2 = newCount;
      if (passageIndex === 2) newCounts.passage3 = newCount;
      return newCounts;
    });

    // Update the test with the new question counts, ensuring question IDs remain consistent
    setTest(prev => {
      // Create a new passages array with the updated questions
      const newPassages = [...prev.passages];
      
      // Update the specified passage with the new question count
      if (passageIndex === 0) {
        newPassages[0] = {
          ...newPassages[0],
          questions: Array(newCount).fill(null).map((_, index) => 
            createEmptyQuestion(index + 1)
          )
        };
      } else if (passageIndex === 1) {
        newPassages[1] = {
          ...newPassages[1],
          questions: Array(newCount).fill(null).map((_, index) => 
            createEmptyQuestion(index + questionCounts.passage1 + 1)
          )
        };
      } else if (passageIndex === 2) {
        newPassages[2] = {
          ...newPassages[2],
          questions: Array(newCount).fill(null).map((_, index) => 
            createEmptyQuestion(index + questionCounts.passage1 + questionCounts.passage2 + 1)
          )
        };
      }
      
      return {
        ...prev,
        passages: newPassages
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">IELTS Academic Reading Test Creator</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a complete 40-question IELTS Academic Reading test with 3 passages
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-sm max-w-xs">
                  Academic Reading typically contains 3 passages with 40 questions in total.
                  The texts are authentic and taken from academic journals, books, and newspapers.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button onClick={handleGenerateTest} disabled={isGenerating} variant="outline">
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
          <Button onClick={handleSaveTest} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Test
          </Button>
        </div>
      </div>
      
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Academic Reading Format</AlertTitle>
        <AlertDescription>
          Academic Reading consists of 3 passages of increasing difficulty with a total of 40 questions. Texts are longer and more complex than General Training, focusing on academic topics from journals, books, magazines, and newspapers.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs defaultValue="passage-0" className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="passage-0" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Passage 1 ({questionCounts.passage1} questions)
              </TabsTrigger>
              <TabsTrigger value="passage-1" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Passage 2 ({questionCounts.passage2} questions)
              </TabsTrigger>
              <TabsTrigger value="passage-2" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Passage 3 ({questionCounts.passage3} questions)
              </TabsTrigger>
            </TabsList>
            
            {test.passages.map((passage, passageIndex) => (
              <TabsContent key={passageIndex} value={`passage-${passageIndex}`} className="mt-0">
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-5 w-5" />
                        <h2 className="text-xl font-semibold">{passage.title}</h2>
                        {getDifficultyBadge(passage.difficulty)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {passage.topic} 
                        {passageIndex === 0 
                          ? ` (Questions 1-${questionCounts.passage1})` 
                          : passageIndex === 1 
                            ? ` (Questions ${questionCounts.passage1 + 1}-${questionCounts.passage1 + questionCounts.passage2})` 
                            : ` (Questions ${questionCounts.passage1 + questionCounts.passage2 + 1}-${questionCounts.passage1 + questionCounts.passage2 + questionCounts.passage3})`
                        }
                      </p>
                    </div>
                    <div>
                      <Badge variant="outline" className="font-normal">
                        {passage.questions.length} Questions
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor={`passage-${passageIndex}-title`}>Passage Title</Label>
                        <Input
                          id={`passage-${passageIndex}-title`}
                          value={passage.title}
                          onChange={(e) => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex ? { ...p, title: e.target.value } : p
                            )
                          }))}
                          placeholder="Enter title for this passage"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`passage-${passageIndex}-topic`}>Topic/Subject Area</Label>
                        <Input
                          id={`passage-${passageIndex}-topic`}
                          value={passage.topic}
                          onChange={(e) => setTest(prev => ({
                            ...prev,
                            passages: prev.passages.map((p, idx) =>
                              idx === passageIndex ? { ...p, topic: e.target.value } : p
                            )
                          }))}
                          placeholder="e.g., Environment, Science, History"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`passage-${passageIndex}-source`}>Source (Optional)</Label>
                      <Input
                        id={`passage-${passageIndex}-source`}
                        value={passage.source || ''}
                        onChange={(e) => setTest(prev => ({
                          ...prev,
                          passages: prev.passages.map((p, idx) =>
                            idx === passageIndex ? { ...p, source: e.target.value } : p
                          )
                        }))}
                        placeholder="e.g., Academic Journal, Research Paper, Textbook"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`passage-${passageIndex}-content`}>Passage Content</Label>
                      <RichTextEditor
                        value={passage.content}
                        onChange={(value) => setTest(prev => ({
                          ...prev,
                          passages: prev.passages.map((p, idx) =>
                            idx === passageIndex ? { ...p, content: value } : p
                          )
                        }))}
                        placeholder="Enter reading passage text (800-1000 words)"
                        height="250px"
                        label=""
                      />
                    </div>
                  </div>
                  
                  <Accordion
                    type="multiple" 
                    value={expandedSections}
                    onValueChange={setExpandedSections}
                    className="mb-4"
                  >
                    <AccordionItem value={`passage-${passageIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <span className="text-base font-medium">Questions ({passage.questions.length})</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-4">
                          {passage.questions.map((question, questionIndex) => 
                            renderQuestionEditor(passage, passageIndex, question, questionIndex)
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <div className="md:col-span-1">
          <Card className="p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Test Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Test Type</Label>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="test-type" className={test.type === 'practice' ? 'font-medium text-primary' : 'text-muted-foreground'}>
                      Practice Test
                    </Label>
                  </div>
                  <Switch
                    id="test-type"
                    checked={test.type === 'simulation'}
                    onCheckedChange={(checked) => 
                      setTest(prev => ({ ...prev, type: checked ? 'simulation' : 'practice' }))
                    }
                  />
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="test-type" className={test.type === 'simulation' ? 'font-medium text-primary' : 'text-muted-foreground'}>
                      Simulation Test
                    </Label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Time Limit (minutes)</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={test.timeLimit}
                    onChange={(e) => setTest(prev => ({ 
                      ...prev, 
                      timeLimit: parseInt(e.target.value) || 60 
                    }))}
                    min={1}
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Standard IELTS Academic Reading time is 60 minutes
                </p>
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 flex-wrap mb-2 mt-2">
                  {test.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                  {test.tags.length === 0 && (
                    <span className="text-xs text-gray-500 italic">No tags added yet</span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button variant="outline" onClick={handleAddTag} disabled={!currentTag}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Question Counts</Label>
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="passage1-count" className="text-xs">Passage 1:</Label>
                    <Input
                      id="passage1-count"
                      type="number"
                      value={questionCounts.passage1}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updatePassageQuestionCount(0, newCount);
                      }}
                      min={1}
                      max={20}
                      className="h-8"
                    />
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="passage2-count" className="text-xs">Passage 2:</Label>
                    <Input
                      id="passage2-count"
                      type="number"
                      value={questionCounts.passage2}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updatePassageQuestionCount(1, newCount);
                      }}
                      min={1}
                      max={20}
                      className="h-8"
                    />
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="passage3-count" className="text-xs">Passage 3:</Label>
                    <Input
                      id="passage3-count"
                      type="number"
                      value={questionCounts.passage3}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updatePassageQuestionCount(2, newCount);
                      }}
                      min={1}
                      max={20}
                      className="h-8"
                    />
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-medium">Total Questions:</span>
                    <Badge variant="outline">
                      {questionCounts.passage1 + questionCounts.passage2 + questionCounts.passage3}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-700 mb-2">IELTS Academic Reading Tips</h4>
                <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
                  <li>3 passages of increasing difficulty</li>
                  <li>40 questions total across all passages</li>
                  <li>13-14 questions per passage</li>
                  <li>Each passage: 800-1000 words</li>
                  <li>Time: 60 minutes (20 mins per passage)</li>
                  <li>Texts contain complex vocabulary and concepts</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}