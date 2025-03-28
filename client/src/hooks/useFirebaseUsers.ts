import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, usersCollection } from '@/lib/firebase';

export const useFirebaseUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    // Only admin should be able to see all users
    if (!isAdmin) {
      setUsers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Create query for all users, ordered by creation date
    const usersQuery = query(
      usersCollection,
      orderBy("createdAt", "desc")
    );
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(usersQuery, 
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to fetch users. Please try again.");
        setLoading(false);
      }
    );
    
    // Cleanup function to unsubscribe when component unmounts
    return () => unsubscribe();
  }, [isAdmin]);
  
  // Function to update user status (paid/admin)
  const updateUserStatus = async (userId: string, updates: { isPaidUser?: boolean, isAdmin?: boolean }) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updates);
      return true;
    } catch (err) {
      console.error("Error updating user status:", err);
      return false;
    }
  };
  
  // Function to get a single user with real-time updates
  const getUser = (userId: string, callback: (user: any) => void) => {
    const userRef = doc(db, "users", userId);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = {
          id: doc.id,
          ...doc.data()
        };
        callback(userData);
      } else {
        console.error("User not found");
        callback(null);
      }
    });
  };

  return { 
    users, 
    loading, 
    error,
    updateUserStatus,
    getUser
  };
};