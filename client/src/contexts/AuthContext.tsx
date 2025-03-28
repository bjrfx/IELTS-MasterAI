import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, getUserProfile, createUserProfile, UserProfile } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Define the shape of our context
interface AuthContextProps {
  currentUser: User | null;
  userProfile: any;
  isLoading: boolean;
  isAdmin: boolean;
  isPaidUser: boolean;
  logout: () => Promise<void>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextProps>({
  currentUser: null,
  userProfile: null,
  isLoading: true,
  isAdmin: false,
  isPaidUser: false,
  logout: async () => {},
});

// Hook for easy context consumption
export const useAuth = () => useContext(AuthContext);

// Types for our component props
interface AuthProviderProps {
  children: ReactNode;
}

// The provider component that wraps our app
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  // Handle user profile data
  const handleUserProfile = async (user: User) => {
    try {
      // Get user profile from Firestore
      let profile = await getUserProfile(user.uid);
      
      // If profile doesn't exist, create a new one
      if (!profile) {
        const userData = {
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL,
          isAdmin: false,
          isPaidUser: false,
          testsCompleted: 0
        };
        
        profile = await createUserProfile(user.uid, userData);
      }
      
      setUserProfile(profile);
      // Use optional chaining and nullish coalescing to safely handle potentially undefined properties
      setIsAdmin(profile?.isAdmin ?? false);
      setIsPaidUser(profile?.isPaidUser ?? false);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // Set default values in case of error
      setIsAdmin(false);
      setIsPaidUser(false);
    }
  };

  // Subscribe to auth state changes
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await handleUserProfile(user);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setIsPaidUser(false);
      }
      
      setIsLoading(false);
    });
    
    // Cleanup subscription
    return unsubscribe;
  }, []);
  
  // Logout function
  const logout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };
  
  // Context value
  const value = {
    currentUser,
    userProfile,
    isLoading,
    isAdmin,
    isPaidUser,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};