import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, userResultsCollection } from '@/lib/firebase';

export const useFirebaseResults = (userId?: string) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  // Use either provided userId or current user's id
  const targetUserId = userId || (currentUser ? currentUser.uid : null);

  useEffect(() => {
    if (!targetUserId) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Create query for user's test results
    const resultsQuery = query(
      userResultsCollection,
      where("userId", "==", targetUserId),
      orderBy("completedAt", "desc")
    );
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(resultsQuery, 
      (snapshot) => {
        const resultsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setResults(resultsList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching test results:", err);
        setError("Failed to fetch test results. Please try again.");
        setLoading(false);
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, [targetUserId]);
  
  // Function to get a single result with real-time updates
  const getResult = (resultId: string, callback: (result: any) => void) => {
    const resultRef = doc(db, "results", resultId);
    
    return onSnapshot(resultRef, (doc) => {
      if (doc.exists()) {
        const resultData = {
          id: doc.id,
          ...doc.data()
        };
        callback(resultData);
      } else {
        console.error("Result not found");
        callback(null);
      }
    });
  };

  return { 
    results, 
    loading, 
    error,
    getResult
  };
};