import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false),
  firebaseUid: text("firebase_uid").unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
  firebaseUid: true,
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'academic' or 'general'
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
  firebaseId: text("firebase_id").unique(),
  status: text("status").default("active"), // 'active', 'draft', 'deleted'
  hasReading: boolean("has_reading").default(true),
  hasListening: boolean("has_listening").default(true),
  hasWriting: boolean("has_writing").default(true),
  hasSpeaking: boolean("has_speaking").default(true),
  content: jsonb("content").notNull(), // full test content
});

export const insertTestSchema = createInsertSchema(tests).pick({
  title: true,
  type: true,
  createdBy: true,
  firebaseId: true,
  hasReading: true,
  hasListening: true,
  hasWriting: true,
  hasSpeaking: true,
  content: true,
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testId: integer("test_id").notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  readingScore: integer("reading_score"),
  listeningScore: integer("listening_score"),
  writingScore: integer("writing_score"),
  speakingScore: integer("speaking_score"),
  overallScore: integer("overall_score"),
  answers: jsonb("answers"), // user's answers
  feedback: jsonb("feedback"), // AI feedback
  firebaseId: text("firebase_id").unique(),
});

export const insertTestResultSchema = createInsertSchema(testResults).pick({
  userId: true,
  testId: true,
  completedAt: true,
  readingScore: true,
  listeningScore: true,
  writingScore: true,
  speakingScore: true,
  overallScore: true,
  answers: true,
  feedback: true,
  firebaseId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;

// Test content types
export type TestModule = 'reading' | 'listening' | 'writing' | 'speaking';

export type TestContent = {
  reading?: ReadingContent;
  listening?: ListeningContent;
  writing?: WritingContent;
  speaking?: SpeakingContent;
}

export type ReadingContent = {
  passages: Array<{
    title: string;
    content: string;
    questions: Array<{
      id: number;
      type: 'fill-blank' | 'true-false-ng' | 'multiple-choice' | 'matching';
      text: string;
      options?: string[];
      answer: string | string[];
    }>;
  }>;
}

export type ListeningContent = {
  sections: Array<{
    title: string;
    audioText: string; // This would be spoken by a TTS engine
    questions: Array<{
      id: number;
      type: 'fill-blank' | 'multiple-choice' | 'matching';
      text: string;
      options?: string[];
      answer: string | string[];
    }>;
  }>;
}

export type WritingContent = {
  tasks: Array<{
    type: 'task1' | 'task2';
    instructions: string;
    content?: string;
    imageDescription?: string;
  }>;
}

export type SpeakingContent = {
  parts: Array<{
    part: number;
    questions: Array<{
      text: string;
      followUpQuestions?: string[];
    }>;
  }>;
}

export type ModuleScores = {
  reading?: number;
  listening?: number;
  writing?: number;
  speaking?: number;
  overall?: number;
}

export type TestAnswers = {
  reading?: Record<string, string | string[]>;
  listening?: Record<string, string | string[]>;
  writing?: Record<string, string>;
  speaking?: Record<string, string>;
}
