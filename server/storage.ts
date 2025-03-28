import { 
  tests, type Test, type InsertTest, 
  testResults, type TestResult, type InsertTestResult,
  users, type User, type InsertUser
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Test operations
  createTest(test: InsertTest): Promise<Test>;
  getTest(id: number): Promise<Test | undefined>;
  getAllTests(filter?: { type?: string, status?: string }): Promise<Test[]>;
  updateTestStatus(id: number, status: string): Promise<Test>;
  deleteTest(id: number): Promise<void>;
  
  // Test result operations
  createTestResult(result: InsertTestResult): Promise<TestResult>;
  getTestResult(id: number): Promise<TestResult | undefined>;
  getTestResultsByUser(userId: number): Promise<TestResult[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tests: Map<number, Test>;
  private testResults: Map<number, TestResult>;
  private currentUserId: number;
  private currentTestId: number;
  private currentResultId: number;

  constructor() {
    this.users = new Map();
    this.tests = new Map();
    this.testResults = new Map();
    this.currentUserId = 1;
    this.currentTestId = 1;
    this.currentResultId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Test methods
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.currentTestId++;
    const createdAt = new Date();
    const test: Test = { 
      ...insertTest, 
      id, 
      createdAt,
      status: insertTest.status || 'active'
    };
    this.tests.set(id, test);
    return test;
  }

  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async getAllTests(filter?: { type?: string, status?: string }): Promise<Test[]> {
    let tests = Array.from(this.tests.values());
    
    if (filter) {
      if (filter.type) {
        tests = tests.filter(test => test.type === filter.type);
      }
      
      if (filter.status) {
        tests = tests.filter(test => test.status === filter.status);
      }
    }
    
    // Sort by newest first
    return tests.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async updateTestStatus(id: number, status: string): Promise<Test> {
    const test = await this.getTest(id);
    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }
    
    const updatedTest: Test = { ...test, status };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  async deleteTest(id: number): Promise<void> {
    this.tests.delete(id);
  }

  // Test result methods
  async createTestResult(insertResult: InsertTestResult): Promise<TestResult> {
    const id = this.currentResultId++;
    const startedAt = insertResult.startedAt || new Date();
    const result: TestResult = { ...insertResult, id, startedAt };
    this.testResults.set(id, result);
    return result;
  }

  async getTestResult(id: number): Promise<TestResult | undefined> {
    return this.testResults.get(id);
  }

  async getTestResultsByUser(userId: number): Promise<TestResult[]> {
    const results = Array.from(this.testResults.values())
      .filter(result => result.userId === userId);
    
    // Sort by newest completion date first
    return results.sort((a, b) => {
      // If completed dates exist, sort by them
      if (a.completedAt && b.completedAt) {
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
      // If only one has a completed date, put that one first
      if (a.completedAt) return -1;
      if (b.completedAt) return 1;
      // Otherwise sort by start date
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });
  }
}

// Export the storage instance
export const storage = new MemStorage();
