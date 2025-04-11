import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

interface IELTSTest {
  title: string;
  tags: string[];
  type: 'practice' | 'simulation';
  testType: 'general' | 'academic';
  module: 'reading' | 'writing' | 'listening' | 'speaking';
  hasReading: boolean;
  hasListening: boolean;
  hasWriting: boolean;
  hasSpeaking: boolean;
  status: string;
  content: any; // Allow for more complex content structure
  createdAt?: Date;
  // These fields are optional since they're only for basic tests
  passage?: string;
  questions?: string[];
  answers?: string[];
}

const COLLECTION_NAME = 'tests';

// Helper function to recursively remove undefined values from an object
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined);
  }

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, removeUndefinedValues(v)])
  );
};

export const saveTest = async (test: Omit<IELTSTest, 'createdAt'>) => {
  try {
    // Clean the test object by removing all undefined values
    const cleanedTest = removeUndefinedValues(test);
    
    const testData = {
      ...cleanedTest,
      createdAt: new Date()
    };
    
    console.log('Saving test data:', JSON.stringify(testData));
    const docRef = await addDoc(collection(db, COLLECTION_NAME), testData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving test:', error);
    throw error;
  }
};

export const getTests = async (filters: {
  testType?: 'general' | 'academic';
  type?: 'practice' | 'simulation';
  module?: 'reading' | 'writing' | 'listening' | 'speaking';
}) => {
  try {
    const testsRef = collection(db, COLLECTION_NAME);
    const constraints = [];

    if (filters.testType) {
      constraints.push(where('testType', '==', filters.testType));
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters.module) {
      constraints.push(where('module', '==', filters.module));
    }

    const q = query(testsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tests:', error);
    throw error;
  }
};