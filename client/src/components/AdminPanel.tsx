import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getAllTests, createTest, updateTest, deleteTest } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { 
  RefreshCw, 
  Eye, 
  Edit as EditIcon, 
  Trash, 
  PlusCircle,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Test {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: any;
  hasReading: boolean;
  hasListening: boolean;
  hasWriting: boolean;
  hasSpeaking: boolean;
}

export default function AdminPanel() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testType, setTestType] = useState("academic");
  const [apiProvider, setApiProvider] = useState("cohere");
  const [testTitle, setTestTitle] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sections, setSections] = useState({
    reading: true,
    listening: true,
    writing: true,
    speaking: true,
  });
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTests();
  }, [filterType]);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const filter = filterType !== "all" ? { type: filterType } : undefined;
      const fetchedTests = await getAllTests(filter);
      setTests(fetchedTests as Test[]);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast({
        title: "Error",
        description: "Failed to load tests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTest = async () => {
    if (!testTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a test title",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/ai/generate-test", {
        title: testTitle,
        type: testType,
        apiProvider,
        sections: {
          reading: sections.reading,
          listening: sections.listening,
          writing: sections.writing,
          speaking: sections.speaking,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate test");
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Test "${testTitle}" has been generated successfully`,
      });
      
      setTestTitle("");
      fetchTests();
    } catch (error) {
      console.error("Error generating test:", error);
      toast({
        title: "Error",
        description: "Failed to generate test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      await deleteTest(id);
      setTests(tests.filter(test => test.id !== id));
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting test:", error);
      toast({
        title: "Error",
        description: "Failed to delete test. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewTest = (test: Test) => {
    setCurrentTest(test);
    // In a real implementation, we would fetch the full test content here
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
        <p className="text-gray-600 mb-6">Generate and manage IELTS tests with AI</p>

        {/* TEST GENERATION SECTION */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Generate New Test</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="test-type">Test Type</Label>
                <Select 
                  value={testType} 
                  onValueChange={(value) => setTestType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="general">General Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="api-provider">AI Provider</Label>
                <Select 
                  value={apiProvider} 
                  onValueChange={(value) => setApiProvider(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cohere">Cohere API</SelectItem>
                    <SelectItem value="google">Google AI Studio</SelectItem>
                    <SelectItem value="deepseek">DeepSeek AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="test-title">Test Title</Label>
              <Input
                id="test-title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g., Academic Test May 2023"
              />
            </div>

            <div className="mb-6">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reading" 
                    checked={sections.reading} 
                    onCheckedChange={(checked) => 
                      setSections({...sections, reading: checked as boolean})
                    }
                  />
                  <Label htmlFor="reading">Reading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="listening" 
                    checked={sections.listening} 
                    onCheckedChange={(checked) => 
                      setSections({...sections, listening: checked as boolean})
                    }
                  />
                  <Label htmlFor="listening">Listening</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="writing" 
                    checked={sections.writing} 
                    onCheckedChange={(checked) => 
                      setSections({...sections, writing: checked as boolean})
                    }
                  />
                  <Label htmlFor="writing">Writing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="speaking" 
                    checked={sections.speaking} 
                    onCheckedChange={(checked) => 
                      setSections({...sections, speaking: checked as boolean})
                    }
                  />
                  <Label htmlFor="speaking">Speaking</Label>
                </div>
              </div>
            </div>

            <Button 
              onClick={generateTest} 
              disabled={isGenerating}
              className="w-full flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Generate New Test</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* TESTS MANAGEMENT SECTION */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Test Management</h3>
            <div className="flex space-x-2">
              <Select 
                value={filterType} 
                onValueChange={(value) => setFilterType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={fetchTests}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p>Loading tests...</p>
              </div>
            ) : tests.length === 0 ? (
              <div className="p-8 text-center">
                <p>No tests found. Generate a new test to get started.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sections
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => (
                    <tr key={test.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {test.id.slice(0, 7)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium">{test.title}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          test.type === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {test.type === 'academic' ? 'Academic' : 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            test.hasReading ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>R</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            test.hasListening ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>L</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            test.hasWriting ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>W</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${
                            test.hasSpeaking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>S</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(test.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          test.status === 'active' ? 'bg-green-100 text-green-800' : 
                          test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-primary hover:text-primary-dark"
                                onClick={() => handleViewTest(test)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Test Details</DialogTitle>
                                <DialogDescription>
                                  View detailed information about this test.
                                </DialogDescription>
                              </DialogHeader>
                              {currentTest && (
                                <div className="grid gap-4 py-4">
                                  <div>
                                    <Label>Title</Label>
                                    <div className="mt-1">{currentTest.title}</div>
                                  </div>
                                  <div>
                                    <Label>Type</Label>
                                    <div className="mt-1">{currentTest.type === 'academic' ? 'Academic' : 'General Training'}</div>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <div className="mt-1">{formatDate(currentTest.createdAt)}</div>
                                  </div>
                                  <div>
                                    <Label>Sections</Label>
                                    <div className="mt-1 flex space-x-2">
                                      {currentTest.hasReading && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Reading</span>}
                                      {currentTest.hasListening && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Listening</span>}
                                      {currentTest.hasWriting && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Writing</span>}
                                      {currentTest.hasSpeaking && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Speaking</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline">Edit</Button>
                                <Button>Preview Test</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the test and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() => handleDeleteTest(test.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {!isLoading && tests.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {tests.length} {tests.length === 1 ? 'test' : 'tests'}
              </span>
              {/* Pagination would go here for larger datasets */}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
