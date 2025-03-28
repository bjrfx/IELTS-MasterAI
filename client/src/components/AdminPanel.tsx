import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAllTests, deleteTest } from "@/lib/firebase";
import { 
  RefreshCw, 
  Eye, 
  Edit as EditIcon, 
  Trash, 
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
  const [filterType, setFilterType] = useState("all");
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
        <p className="text-gray-600 mb-6">Manage IELTS tests</p>

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
