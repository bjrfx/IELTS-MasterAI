import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, FacebookAuthProvider, signOut as firebaseSignOut, User, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import firebaseConfig from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signInWithFacebook = () => {
  const provider = new FacebookAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = () => {
  return firebaseSignOut(auth);
};

// Firestore collections - using strings for collection paths to avoid TypeScript errors with queries
const TESTS_COLLECTION = "tests";
const RESULTS_COLLECTION = "results";
const PROGRESS_COLLECTION = "progress";
const USERS_COLLECTION = "users";
const CHAT_MESSAGES_COLLECTION = "chatMessages";
const CHAT_SESSIONS_COLLECTION = "chatSessions";

export const testsCollection = collection(db, TESTS_COLLECTION);
export const userResultsCollection = collection(db, RESULTS_COLLECTION);
export const userProgressCollection = collection(db, PROGRESS_COLLECTION);
export const usersCollection = collection(db, USERS_COLLECTION);
export const chatMessagesCollection = collection(db, CHAT_MESSAGES_COLLECTION);
export const chatSessionsCollection = collection(db, CHAT_SESSIONS_COLLECTION);

// Test operations
export const createTest = async (testData: any) => {
  return await addDoc(testsCollection, {
    ...testData,
    createdAt: Timestamp.now()
  });
};

export const getTest = async (id: string) => {
  const docRef = doc(db, "tests", id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

export const updateTest = async (id: string, data: any) => {
  const docRef = doc(db, "tests", id);
  await updateDoc(docRef, data);
  return { id, ...data };
};

export const deleteTest = async (id: string) => {
  const docRef = doc(db, "tests", id);
  await deleteDoc(docRef);
};

export const getAllTests = async (filter?: { type?: string, status?: string }) => {
  let queryRef;
  
  if (filter) {
    const conditions = [];
    
    if (filter.type) {
      conditions.push(where("type", "==", filter.type));
    }
    
    if (filter.status) {
      conditions.push(where("status", "==", filter.status));
    }
    
    if (conditions.length > 0) {
      queryRef = query(testsCollection, ...conditions, orderBy("createdAt", "desc"));
    } else {
      queryRef = query(testsCollection, orderBy("createdAt", "desc"));
    }
  } else {
    queryRef = query(testsCollection, orderBy("createdAt", "desc"));
  }
  
  const snapshot = await getDocs(queryRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Test result operations
export const saveTestResult = async (userId: string, result: any) => {
  return await addDoc(userResultsCollection, {
    userId,
    ...result,
    completedAt: Timestamp.now()
  });
};

export const getUserTestResults = async (userId: string) => {
  const q = query(
    userResultsCollection,
    where("userId", "==", userId),
    orderBy("completedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// User progress operations
export const getUserProgress = async (userId: string) => {
  const docRef = doc(db, "progress", userId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  
  return null;
};

export const updateUserProgress = async (userId: string, data: any) => {
  const docRef = doc(db, "progress", userId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    await updateDoc(docRef, {
      ...data,
      lastActivity: Timestamp.now()
    });
  } else {
    await setDoc(docRef, {
      userId,
      ...data,
      lastActivity: Timestamp.now()
    });
  }
  
  return { userId, ...data };
};

// User profile operations with proper types
export interface UserProfile {
  id: string;
  email?: string | null;
  displayName?: string;
  photoURL?: string | null;
  isAdmin: boolean;
  isPaidUser: boolean;
  testsCompleted: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any; // Allow other properties
}

export const createUserProfile = async (userId: string, userData: any): Promise<UserProfile> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  return { 
    id: userId, 
    ...userData,
    isAdmin: userData.isAdmin || false,
    isPaidUser: userData.isPaidUser || false,
    testsCompleted: userData.testsCompleted || 0
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(userRef);
  
  if (snapshot.exists()) {
    const data = snapshot.data();
    return { 
      id: snapshot.id, 
      ...data,
      isAdmin: data.isAdmin || false,
      isPaidUser: data.isPaidUser || false,
      testsCompleted: data.testsCompleted || 0
    };
  }
  
  return null;
};

export const updateUserProfile = async (userId: string, data: any): Promise<Partial<UserProfile>> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  await updateDoc(userRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
  
  return { id: userId, ...data };
};

// Admin operations
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(usersCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      isAdmin: data.isAdmin || false,
      isPaidUser: data.isPaidUser || false,
      testsCompleted: data.testsCompleted || 0
    };
  });
};

export const setUserPaidStatus = async (userId: string, isPaid: boolean): Promise<Partial<UserProfile>> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  await updateDoc(userRef, {
    isPaidUser: isPaid,
    updatedAt: Timestamp.now()
  });
  
  return { id: userId, isPaidUser: isPaid };
};

export const setUserAsAdmin = async (userId: string, isAdmin: boolean): Promise<Partial<UserProfile>> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  await updateDoc(userRef, {
    isAdmin: isAdmin,
    updatedAt: Timestamp.now()
  });
  
  return { id: userId, isAdmin: isAdmin };
};