import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X } from 'lucide-react';
import { generateTest } from '@/lib/services/geminiService';
import { saveTest } from '@/lib/services/testService';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'matching' | 'fill-blank' | 'short-answer';
  options?: string[];
  answer: string;
}

interface Passage {
  title: string;
  content: string;
  questions: Question[];
}

interface ReadingTest {
  passages: Passage[];
  tags: string[];
  type: 'practice' | 'simulation';
}

export default function AcademicReading() {
  const [test, setTest] = useState<ReadingTest>({
    passages: Array(3).fill(null).map(() => ({
      title: '',
      content: '',
      questions: Array(13).fill(null).map((_, index) => ({
        id: index + 1,
        text: '',
        type: 'multiple-choice',
        options: [],
        answer: ''
      }))
    })),
    tags: [],
    type: 'practice'
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);


  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      const response = await generateTest({
        testType: 'academic',
        module: 'reading'
      });
      
      if (response && response.passages) {
        setTest(prev => {
          const updatedTest = {
            ...prev,
            passages: response.passages.map((passage: any, index: number) => ({
              title: passage.title || '',
              content: passage.content || '',
              questions: Array.isArray(passage.questions) 
                ? passage.questions.map((q: any, qIndex: number) => ({
                    id: qIndex + 1,
                    text: q.text || '',
                    type: q.type || 'multiple-choice',
                    options: Array.isArray(q.options) ? q.options : [],
                    answer: q.answer || ''
                  }))
                : prev.passages[index].questions
            })),
            type: response.type || prev.type,
            tags: Array.isArray(response.tags) ? response.tags : prev.tags
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
      setTest(prev => {
        return ({
        ...prev,
        tags: [...prev.tags, currentTag]
      });
      });
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
      await saveTest({
        ...test,
        testType: 'academic',
        module: 'reading'
      });
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Academic Reading Test</h2>
          <p className="text-sm text-gray-600 mt-1">Create test sections and questions</p>
        </div>
        <div className="flex items-center gap-4">

          <Button onClick={handleGenerateTest} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {test.passages.map((passage, passageIndex) => (
          <Card key={passageIndex} className="p-6 space-y-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Section {passageIndex + 1}</h3>
              <Badge variant="outline" className="text-sm">{passageIndex === 0 ? 'Basic' : passageIndex === 1 ? 'Intermediate' : 'Advanced'}</Badge>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Label>Title</Label>
                <Input
                  value={passage.title}
                  onChange={(e) => setTest(prev => ({
                    ...prev,
                    passages: prev.passages.map((p, idx) =>
                      idx === passageIndex ? { ...p, title: e.target.value } : p
                    )
                  }))}
                  placeholder="Enter passage title"
                />
              </div>

              <div>
                <Label>Passage Content</Label>
                <Textarea
                  value={passage.content}
                  onChange={(e) => setTest(prev => ({
                    ...prev,
                    passages: prev.passages.map((p, idx) =>
                      idx === passageIndex ? { ...p, content: e.target.value } : p
                    )
                  }))}
                  placeholder="Enter or generate passage text"
                  className="min-h-[200px]"
                />
              </div>

              <div className="space-y-4">
                <Label>Questions (13-14 questions per passage)</Label>
                {passage.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="space-y-2 border p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Input
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
                        placeholder={`Question ${question.id}`}
                      />
                      <select
                        value={question.type}
                        onChange={(e) => setTest(prev => ({
                          ...prev,
                          passages: prev.passages.map((p, idx) =>
                            idx === passageIndex
                              ? {
                                  ...p,
                                  questions: p.questions.map((q, qIdx) =>
                                    qIdx === questionIndex
                                      ? { ...q, type: e.target.value as Question['type'] }
                                      : q
                                  )
                                }
                              : p
                          )
                        }))}
                        className="border rounded p-2"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="matching">Matching</option>
                        <option value="fill-blank">Fill in the Blank</option>
                        <option value="short-answer">Short Answer</option>
                      </select>
                    </div>

                    {question.type === 'multiple-choice' && (
                      <div className="space-y-2">
                        {(question.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])];
                                newOptions[optionIndex] = e.target.value;
                                setTest(prev => {
        return ({
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
                                });
      });
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newOptions = (question.options || []).filter(
                                  (_, idx) => idx !== optionIndex
                                );
                                setTest(prev => {
        return ({
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
                                });
      });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [...(question.options || []), ''];
                            setTest(prev => {
        return ({
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
                            });
      });
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    <div>
                      <Label>Answer</Label>
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
                  </div>
                ))}
              </div>
            </div>



            </div>
          </Card>
        ))}
        
        <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {test.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag}>Add Tag</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Test Type</Label>
              <div className="flex gap-4">
                <Button
                  variant={test.type === 'practice' ? 'default' : 'outline'}
                  onClick={() => setTest(prev => ({ ...prev, type: 'practice' }))}
                >
                  Practice Test
                </Button>
                <Button
                  variant={test.type === 'simulation' ? 'default' : 'outline'}
                  onClick={() => setTest(prev => ({ ...prev, type: 'simulation' }))}
                >
                  Simulation Test
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveTest} size="lg" className="w-full sm:w-auto">
                Save Complete Test
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}