import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

interface IELTSTest {
  passage: string;
  questions: string[];
  answers: string[];
  tags: string[];
  type: 'practice' | 'simulation';
  testType: 'general' | 'academic';
  module: 'reading' | 'writing' | 'listening' | 'speaking';
  createdAt: Date;
}

const COLLECTION_NAME = 'ielts_tests';

export const saveTest = async (test: Omit<IELTSTest, 'createdAt'>) => {
  try {
    const testData = {
      ...test,
      createdAt: new Date()
    };
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