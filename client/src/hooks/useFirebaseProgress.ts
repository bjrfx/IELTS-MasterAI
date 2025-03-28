import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, userProgressCollection } from '@/lib/firebase';

export const useFirebaseProgress = (userId?: string) => {
  const [progress, setProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  // Use either provided userId or current user's id
  const targetUserId = userId || (currentUser ? currentUser.uid : null);

  useEffect(() => {
    if (!targetUserId) {
      setProgress(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Reference to user's progress document
    const progressRef = doc(db, "progress", targetUserId);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(progressRef, 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const progressData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          
          setProgress(progressData);
        } else {
          // If no progress document exists yet, create default structure
          setProgress({
            userId: targetUserId,
            moduleProgress: {
              reading: { academic: [], general: [] },
              listening: { academic: [], general: [] },
              writing: { academic: [], general: [] },
              speaking: { academic: [], general: [] }
            },
            testsCompleted: 0,
            lastActivity: new Date().toISOString()
          });
        }
        
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching user progress:", err);
        setError("Failed to fetch user progress. Please try again.");
        setLoading(false);
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, [targetUserId]);
  
  // Function to update user progress
  const updateProgress = async (updates: any) => {
    if (!targetUserId) return false;
    
    try {
      const progressRef = doc(db, "progress", targetUserId);
      
      // Check if progress document exists
      const docSnap = await getDoc(progressRef);
      
      if (docSnap.exists()) {
        // Update existing document with new data
        const currentData = docSnap.data();
        const updatedData = {
          ...currentData,
          ...updates,
          lastActivity: new Date().toISOString()
        };
        
        await setDoc(progressRef, updatedData);
      } else {
        // Create new progress document with initial data
        const initialData = {
          userId: targetUserId,
          moduleProgress: {
            reading: { academic: [], general: [] },
            listening: { academic: [], general: [] },
            writing: { academic: [], general: [] },
            speaking: { academic: [], general: [] }
          },
          testsCompleted: 0,
          lastActivity: new Date().toISOString(),
          ...updates
        };
        
        await setDoc(progressRef, initialData);
      }
      
      return true;
    } catch (err) {
      console.error("Error updating user progress:", err);
      return false;
    }
  };

  return { 
    progress, 
    loading, 
    error,
    updateProgress
  };
};