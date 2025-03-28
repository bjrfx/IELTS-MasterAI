import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, testsCollection } from '@/lib/firebase';

interface UseFirebaseTestsProps {
  testType?: 'academic' | 'general';
  fetchOnMount?: boolean;
}

export const useFirebaseTests = ({ testType, fetchOnMount = true }: UseFirebaseTestsProps = {}) => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!fetchOnMount) {
      setLoading(false);
      return () => {};
    }
    
    setLoading(true);
    setError(null);
    
    // Create base query
    let testsQuery = query(testsCollection, orderBy("createdAt", "desc"));
    
    // Add test type filter if specified
    if (testType) {
      testsQuery = query(
        testsCollection,
        where("type", "==", testType),
        orderBy("createdAt", "desc")
      );
    }
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(testsQuery, 
      (snapshot) => {
        const testsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTests(testsList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching tests:", err);
        setError("Failed to fetch tests. Please try again.");
        setLoading(false);
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, [testType, fetchOnMount]);
  
  // Function to get a single test with real-time updates
  const getTest = (testId: string, callback: (test: any) => void) => {
    const testRef = doc(db, "tests", testId);
    
    return onSnapshot(testRef, (doc) => {
      if (doc.exists()) {
        const testData = {
          id: doc.id,
          ...doc.data()
        };
        callback(testData);
      } else {
        console.error("Test not found");
        callback(null);
      }
    });
  };
  
  // Function to delete a test
  const deleteTest = async (testId: string) => {
    try {
      const testRef = doc(db, "tests", testId);
      await deleteDoc(testRef);
      return true;
    } catch (err) {
      console.error("Error deleting test:", err);
      return false;
    }
  };
  
  // Function to update test status
  const updateTestStatus = async (testId: string, status: string) => {
    try {
      const testRef = doc(db, "tests", testId);
      await updateDoc(testRef, { status });
      return true;
    } catch (err) {
      console.error("Error updating test status:", err);
      return false;
    }
  };
  
  // Function to manually fetch tests with filters
  const fetchTests = async (filters?: { type?: string; status?: string; }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create base query
      let baseQuery = testsCollection;
      const queryFilters = [];
      
      // Add filters
      if (filters?.type) {
        queryFilters.push(where("type", "==", filters.type));
      }
      
      if (filters?.status) {
        queryFilters.push(where("status", "==", filters.status));
      }
      
      // Construct query
      const testsQuery = queryFilters.length > 0
        ? query(baseQuery, ...queryFilters, orderBy("createdAt", "desc"))
        : query(baseQuery, orderBy("createdAt", "desc"));
      
      // Execute query
      const snapshot = await getDocs(testsQuery);
      const testsList = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTests(testsList);
      setLoading(false);
      return testsList;
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to fetch tests. Please try again.");
      setLoading(false);
      return [];
    }
  };

  return { 
    tests, 
    loading, 
    error,
    getTest,
    deleteTest,
    updateTestStatus,
    fetchTests
  };
};