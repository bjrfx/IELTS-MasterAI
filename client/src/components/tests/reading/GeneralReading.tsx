import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, FileText, Briefcase, BookOpen, ChevronDown, ChevronUp, Save, Trash2 } from 'lucide-react';
import { generateTest } from '@/lib/services/geminiService';
import { saveTest } from '@/lib/services/testService';
import { toast } from '@/hooks/use-toast';
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RichTextEditor from '@/components/ui/rich-text-editor';

// Question types based on IELTS format
type QuestionType = 
  | 'multiple-choice' 
  | 'matching-headings' 
  | 'matching-features'
  | 'matching-paragraphs'
  | 'true-false-not-given'
  | 'yes-no-not-given'
  | 'sentence-completion'
  | 'summary-completion'
  | 'table-completion'
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

interface Section {
  title: string;
  content: string;
  questions: Question[];
  sources: string[];
  purpose: string;
}

interface ReadingTest {
  sections: [
    // Section 1: Social Survival
    {
      title: string;
      content: string;
      questions: Question[];
      sources: string[];
      purpose: string;
    },
    // Section 2: Workplace Survival
    {
      title: string;
      content: string;
      questions: Question[];
      sources: string[];
      purpose: string;
    },
    // Section 3: General Reading
    {
      title: string;
      content: string;
      questions: Question[];
      sources: string[];
      purpose: string;
    }
  ];
  tags: string[];
  type: 'practice' | 'simulation';
  timeLimit: number; // in minutes
}

// Helper to create an empty question
const createEmptyQuestion = (id: number, type: QuestionType = 'multiple-choice'): Question => ({
  id,
  text: '',
  type,
  options: type === 'multiple-choice' ? ['', '', '', ''] : [],
  answer: '',
  instructions: '',
  subQuestions: type.includes('completion') || type === 'short-answer' ? 
    Array(3).fill(null).map((_, i) => ({ id: `${id}.${i+1}`, text: '', answer: '' })) : 
    undefined
});

// Initial distribution of questions across sections - changed to variables for configurability
const DEFAULT_SECTION_1_QUESTIONS = 14;
const DEFAULT_SECTION_2_QUESTIONS = 13;
const DEFAULT_SECTION_3_QUESTIONS = 13;

export default function GeneralReading() {
  const [questionCounts, setQuestionCounts] = useState({
    section1: DEFAULT_SECTION_1_QUESTIONS,
    section2: DEFAULT_SECTION_2_QUESTIONS,
    section3: DEFAULT_SECTION_3_QUESTIONS
  });
  
  const [test, setTest] = useState<ReadingTest>({
    sections: [
      {
        title: 'Social Survival',
        content: '',
        questions: Array(questionCounts.section1).fill(null).map((_, index) => 
          createEmptyQuestion(index + 1)
        ),
        sources: ['Notices', 'Advertisements', 'Timetables', 'Leaflets'],
        purpose: 'Factual information like schedules or announcements'
      },
      {
        title: 'Workplace Survival',
        content: '',
        questions: Array(questionCounts.section2).fill(null).map((_, index) => 
          createEmptyQuestion(index + questionCounts.section1 + 1)
        ),
        sources: ['Job descriptions', 'Company policies', 'Workplace manuals', 'Instructions'],
        purpose: 'Information on job roles, company rules, instructions'
      },
      {
        title: 'General Reading',
        content: '',
        questions: Array(questionCounts.section3).fill(null).map((_, index) => 
          createEmptyQuestion(index + questionCounts.section1 + questionCounts.section2 + 1)
        ),
        sources: ['Books', 'Magazines', 'Newspapers', 'Non-academic articles'],
        purpose: 'To test deeper understanding of more complex text'
      }
    ],
    tags: [],
    type: 'practice',
    timeLimit: 60
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // Change from string to array to allow multiple sections to be open simultaneously
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      const response = await generateTest({
        testType: 'general',
        module: 'reading'
      });
      
      if (response && response.sections) {
        setTest(prev => {
          // Ensure we maintain proper structure while updating with AI response
          const updatedTest = {
            ...prev,
            sections: prev.sections.map((section, index) => {
              const aiSection = response.sections[index];
              if (!aiSection) return section;
              
              return {
                ...section,
                title: aiSection.title || section.title,
                content: aiSection.content || section.content,
                questions: Array.isArray(aiSection.questions)
                  ? aiSection.questions.map((q: any, qIndex: number) => {
                      const baseId = index === 0 ? qIndex + 1 : 
                                     index === 1 ? qIndex + questionCounts.section1 + 1 :
                                     qIndex + questionCounts.section1 + questionCounts.section2 + 1;
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
                  : section.questions
              };
            }) as ReadingTest['sections'],
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
        title: `General Reading Test - ${new Date().toLocaleDateString()}`,
        module: 'reading',
        testType: 'general',
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
            passages: test.sections.map((section, index) => ({
              title: section.title || '',
              content: section.content || '',
              questions: section.questions.map(q => ({
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
              difficulty: index === 0 ? 'basic' : index === 1 ? 'intermediate' : 'advanced',
              source: section.sources ? section.sources.join(', ') : '',
              purpose: section.purpose || ''
            }))
          }
        }
      };

      const testId = await saveTest(formattedTest);
      
      toast({
        title: "Test Saved Successfully",
        description: "Your General Reading test has been saved and is now available in the Practice section.",
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

  const handleQuestionTypeChange = (sectionIndex: number, questionIndex: number, newType: QuestionType) => {
    setTest(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) =>
        idx === sectionIndex
          ? {
              ...s,
              questions: s.questions.map((q, qIdx) =>
                qIdx === questionIndex
                  ? {
                      ...createEmptyQuestion(q.id, newType as QuestionType),
                      text: q.text // preserve question text
                    }
                  : q
              )
            }
          : s
      )
    }));
  };

  const addSubQuestion = (sectionIndex: number, questionIndex: number) => {
    setTest(prev => {
      const question = prev.sections[sectionIndex].questions[questionIndex];
      const newSubQuestions = [...(question.subQuestions || [])];
      const newId = `${question.id}.${newSubQuestions.length + 1}`;
      
      newSubQuestions.push({
        id: newId,
        text: '',
        answer: ''
      });
      
      return {
        ...prev,
        sections: prev.sections.map((s, idx) =>
          idx === sectionIndex
            ? {
                ...s,
                questions: s.questions.map((q, qIdx) =>
                  qIdx === questionIndex
                    ? { ...q, subQuestions: newSubQuestions }
                    : q
                )
              }
            : s
        )
      };
    });
  };

  const removeSubQuestion = (sectionIndex: number, questionIndex: number, subQuestionIndex: number) => {
    setTest(prev => {
      const question = prev.sections[sectionIndex].questions[questionIndex];
      if (!question.subQuestions) return prev;
      
      const newSubQuestions = question.subQuestions.filter((_, idx) => idx !== subQuestionIndex);
      
      return {
        ...prev,
        sections: prev.sections.map((s, idx) =>
          idx === sectionIndex
            ? {
                ...s,
                questions: s.questions.map((q, qIdx) =>
                  qIdx === questionIndex
                    ? { ...q, subQuestions: newSubQuestions }
                    : q
                )
              }
            : s
        )
      };
    });
  };

  const getSectionIcon = (index: number) => {
    switch(index) {
      case 0: return <FileText className="mr-2 h-5 w-5" />;
      case 1: return <Briefcase className="mr-2 h-5 w-5" />;
      case 2: return <BookOpen className="mr-2 h-5 w-5" />;
      default: return null;
    }
  };

  const getDifficultyBadge = (index: number) => {
    switch(index) {
      case 0: return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Easy</Badge>;
      case 1: return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Moderate</Badge>;
      case 2: return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Difficult</Badge>;
      default: return null;
    }
  };

  const renderQuestionEditor = (section: Section, sectionIndex: number, question: Question, questionIndex: number) => {
    const isExpanded = expandedQuestion === question.id;
    
    return (
      <Card key={question.id} className="mb-4 overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
        style={{
          borderLeftColor: sectionIndex === 0 ? '#4ade80' : 
                          sectionIndex === 1 ? '#facc15' : '#f87171'
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
                      sections: prev.sections.map((s, idx) =>
                        idx === sectionIndex
                          ? {
                              ...s,
                              questions: s.questions.map((q, qIdx) =>
                                qIdx === questionIndex
                                  ? { ...q, text: e.target.value }
                                  : q
                              )
                            }
                          : s
                      )
                    }))}
                    placeholder="Enter question text"
                  />
                </div>
                <div>
                  <Label htmlFor={`question-${question.id}-type`}>Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => handleQuestionTypeChange(sectionIndex, questionIndex, value as QuestionType)}
                  >
                    <SelectTrigger id={`question-${question.id}-type`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                      <SelectItem value="matching-headings">Matching Headings</SelectItem>
                      <SelectItem value="matching-features">Matching Features</SelectItem>
                      <SelectItem value="matching-paragraphs">Matching Paragraphs</SelectItem>
                      <SelectItem value="true-false-not-given">True/False/Not Given</SelectItem>
                      <SelectItem value="yes-no-not-given">Yes/No/Not Given</SelectItem>
                      <SelectItem value="sentence-completion">Sentence Completion</SelectItem>
                      <SelectItem value="summary-completion">Summary Completion</SelectItem>
                      <SelectItem value="table-completion">Table/Note Completion</SelectItem>
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
                    sections: prev.sections.map((s, idx) =>
                      idx === sectionIndex
                        ? {
                            ...s,
                            questions: s.questions.map((q, qIdx) =>
                              qIdx === questionIndex
                                ? { ...q, instructions: e.target.value }
                                : q
                            )
                          }
                        : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, options: newOptions }
                                        : q
                                    )
                                  }
                                : s
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
                              sections: prev.sections.map((s, idx) =>
                                idx === sectionIndex
                                  ? {
                                      ...s,
                                      questions: s.questions.map((q, qIdx) =>
                                        qIdx === questionIndex
                                          ? { ...q, options: newOptions }
                                          : q
                                      )
                                    }
                                  : s
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
                          sections: prev.sections.map((s, idx) =>
                            idx === sectionIndex
                              ? {
                                  ...s,
                                  questions: s.questions.map((q, qIdx) =>
                                    qIdx === questionIndex
                                      ? { ...q, options: newOptions }
                                      : q
                                  )
                                }
                              : s
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
              {(question.type === 'true-false-not-given' || question.type === 'yes-no-not-given') && (
                <div>
                  <Label>Answer Options</Label>
                  <div className="flex gap-2 mt-1">
                    {question.type === 'true-false-not-given' ? (
                      <>
                        <Badge 
                          variant={question.answer === 'TRUE' ? 'default' : 'outline'} 
                          className="cursor-pointer px-3 py-1"
                          onClick={() => setTest(prev => ({
                            ...prev,
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'TRUE' }
                                        : q
                                    )
                                  }
                                : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'FALSE' }
                                        : q
                                    )
                                  }
                                : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NOT GIVEN' }
                                        : q
                                    )
                                  }
                                : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'YES' }
                                        : q
                                    )
                                  }
                                : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NO' }
                                        : q
                                    )
                                  }
                                : s
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
                            sections: prev.sections.map((s, idx) =>
                              idx === sectionIndex
                                ? {
                                    ...s,
                                    questions: s.questions.map((q, qIdx) =>
                                      qIdx === questionIndex
                                        ? { ...q, answer: 'NOT GIVEN' }
                                        : q
                                    )
                                  }
                                : s
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
                          sections: prev.sections.map((s, idx) =>
                            idx === sectionIndex
                              ? {
                                  ...s,
                                  questions: s.questions.map((q, qIdx) =>
                                    qIdx === questionIndex
                                      ? { ...q, options }
                                      : q
                                  )
                                }
                              : s
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
                        sections: prev.sections.map((s, idx) =>
                          idx === sectionIndex
                            ? {
                                ...s,
                                questions: s.questions.map((q, qIdx) =>
                                  qIdx === questionIndex
                                    ? { ...q, answer: e.target.value }
                                    : q
                                )
                              }
                            : s
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
                        onClick={() => addSubQuestion(sectionIndex, questionIndex)}
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
                                sections: prev.sections.map((s, idx) =>
                                  idx === sectionIndex
                                    ? {
                                        ...s,
                                        questions: s.questions.map((q, qIdx) =>
                                          qIdx === questionIndex
                                            ? { ...q, subQuestions: newSubQuestions }
                                            : q
                                        )
                                      }
                                    : s
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
                                sections: prev.sections.map((s, idx) =>
                                  idx === sectionIndex
                                    ? {
                                        ...s,
                                        questions: s.questions.map((q, qIdx) =>
                                          qIdx === questionIndex
                                            ? { ...q, subQuestions: newSubQuestions }
                                            : q
                                        )
                                      }
                                    : s
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
                            onClick={() => removeSubQuestion(sectionIndex, questionIndex, subIndex)}
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
                question.type !== 'true-false-not-given' && 
                question.type !== 'yes-no-not-given' && (
                <div>
                  <Label>Correct Answer</Label>
                  <Input
                    value={question.answer}
                    onChange={(e) => setTest(prev => ({
                      ...prev,
                      sections: prev.sections.map((s, idx) =>
                        idx === sectionIndex
                          ? {
                              ...s,
                              questions: s.questions.map((q, qIdx) =>
                                qIdx === questionIndex
                                  ? { ...q, answer: e.target.value }
                                  : q
                              )
                            }
                          : s
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

  const updateSectionQuestionCount = (sectionIndex: number, newCount: number) => {
    setQuestionCounts(prev => {
      const newCounts = { ...prev };
      if (sectionIndex === 0) newCounts.section1 = newCount;
      if (sectionIndex === 1) newCounts.section2 = newCount;
      if (sectionIndex === 2) newCounts.section3 = newCount;
      return newCounts;
    });

    setTest(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => {
        if (idx === sectionIndex) {
          const newQuestions = Array(newCount).fill(null).map((_, index) => 
            createEmptyQuestion(index + 1 + (idx === 0 ? 0 : idx === 1 ? questionCounts.section1 : questionCounts.section1 + questionCounts.section2))
          );
          return { ...s, questions: newQuestions };
        }
        return s;
      })
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">IELTS General Reading Test Creator</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a complete 40-question IELTS General Reading test with 3 sections
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleGenerateTest} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
          <Button onClick={handleSaveTest} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Test
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs defaultValue="section-0" className="w-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="section-0" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Section 1
              </TabsTrigger>
              <TabsTrigger value="section-1" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Section 2
              </TabsTrigger>
              <TabsTrigger value="section-2" className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Section 3
              </TabsTrigger>
            </TabsList>
            
            {test.sections.map((section, sectionIndex) => (
              <TabsContent key={sectionIndex} value={`section-${sectionIndex}`} className="mt-0">
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getSectionIcon(sectionIndex)}
                        <h2 className="text-xl font-semibold">{section.title}</h2>
                        {getDifficultyBadge(sectionIndex)}
                      </div>
                      <p className="text-sm text-gray-600">{section.purpose}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="font-normal">
                        {section.questions.length} Questions
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor={`section-${sectionIndex}-title`}>Section Title</Label>
                      <Input
                        id={`section-${sectionIndex}-title`}
                        value={section.title}
                        onChange={(e) => setTest(prev => ({
                          ...prev,
                          sections: prev.sections.map((s, idx) =>
                            idx === sectionIndex ? { ...s, title: e.target.value } : s
                          )
                        }))}
                        placeholder={`Enter title for Section ${sectionIndex + 1}`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor={`section-${sectionIndex}-content`}>Reading Passage</Label>
                        <div className="text-xs text-gray-500">
                          Typical source: {section.sources.join(', ')}
                        </div>
                      </div>
                      <RichTextEditor
                        value={section.content}
                        onChange={(value) => setTest(prev => ({
                          ...prev,
                          sections: prev.sections.map((s, idx) =>
                            idx === sectionIndex ? { ...s, content: value } : s
                          )
                        }))}
                        placeholder={`Enter reading passage for ${section.title}`}
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
                    <AccordionItem value={`section-${sectionIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <span className="text-base font-medium">Questions ({section.questions.length})</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 mt-4">
                          {section.questions.map((question, questionIndex) => 
                            renderQuestionEditor(section, sectionIndex, question, questionIndex)
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
              <div>
                <Label>Test Type</Label>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="test-type"
                      checked={test.type === 'simulation'}
                      onCheckedChange={(checked) => 
                        setTest(prev => ({ ...prev, type: checked ? 'simulation' : 'practice' }))
                      }
                    />
                    <Label htmlFor="test-type" className="cursor-pointer">
                      {test.type === 'simulation' ? 'Simulation Test' : 'Practice Test'}
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
                  Standard IELTS Reading time is 60 minutes
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
                    <Label htmlFor="section1-count" className="text-xs">Section 1:</Label>
                    <Input
                      id="section1-count"
                      type="number"
                      value={questionCounts.section1}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updateSectionQuestionCount(0, newCount);
                      }}
                      min={1}
                      max={20}
                      className="h-8"
                    />
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="section2-count" className="text-xs">Section 2:</Label>
                    <Input
                      id="section2-count"
                      type="number"
                      value={questionCounts.section2}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updateSectionQuestionCount(1, newCount);
                      }}
                      min={1}
                      max={20}
                      className="h-8"
                    />
                    <span className="text-xs text-gray-500">questions</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label htmlFor="section3-count" className="text-xs">Section 3:</Label>
                    <Input
                      id="section3-count"
                      type="number"
                      value={questionCounts.section3}
                      onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        updateSectionQuestionCount(2, newCount);
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
                      {questionCounts.section1 + questionCounts.section2 + questionCounts.section3}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-blue-700 mb-2">IELTS Reading Tips</h4>
                      <ul className="text-xs text-blue-600 list-disc pl-4 space-y-1">
                        <li>Section 1: Easy, factual information</li>
                        <li>Section 2: Moderate, workplace content</li>
                        <li>Section 3: Difficult, general reading</li>
                        <li>Standard time: 60 minutes for 40 questions</li>
                      </ul>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-sm max-w-xs">
                      The IELTS General Reading Test consists of 3 progressively difficult sections with 40 questions total. Each section tests different skills and uses specific types of texts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}