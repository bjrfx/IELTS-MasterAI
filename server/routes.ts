import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateTest } from "./ai/testGenerator";
import { evaluateTest } from "./ai/testEvaluator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test generation route
  app.post("/api/ai/generate-test", async (req, res) => {
    try {
      const { 
        title, 
        type, 
        apiProvider, 
        sections, 
        createdBy 
      } = req.body;

      if (!title || !type || !apiProvider) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const testData = await generateTest({
        title,
        type,
        apiProvider,
        sections,
        createdBy: createdBy || "admin"
      });

      // Save the test to storage
      const savedTest = await storage.createTest(testData);

      res.status(201).json(savedTest);
    } catch (error: any) {
      console.error("Error generating test:", error);
      res.status(500).json({ 
        message: "Failed to generate test", 
        error: error.message 
      });
    }
  });

  // Test evaluation route
  app.post("/api/evaluate-test", async (req, res) => {
    try {
      const { testId, userId, answers, testType } = req.body;

      if (!testId || !userId || !answers) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the test from storage
      const test = await storage.getTest(parseInt(testId));
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }

      // Evaluate the test
      const result = await evaluateTest({
        test,
        answers,
        testType: testType || test.type,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error evaluating test:", error);
      res.status(500).json({ 
        message: "Failed to evaluate test", 
        error: error.message 
      });
    }
  });

  // Get all tests
  app.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getAllTests();
      res.status(200).json(tests);
    } catch (error: any) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ 
        message: "Failed to fetch tests", 
        error: error.message 
      });
    }
  });

  // Get a single test
  app.get("/api/tests/:id", async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const test = await storage.getTest(testId);
      
      if (!test) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.status(200).json(test);
    } catch (error: any) {
      console.error("Error fetching test:", error);
      res.status(500).json({ 
        message: "Failed to fetch test", 
        error: error.message 
      });
    }
  });

  // Delete a test
  app.delete("/api/tests/:id", async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      await storage.deleteTest(testId);
      res.status(200).json({ message: "Test deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting test:", error);
      res.status(500).json({ 
        message: "Failed to delete test", 
        error: error.message 
      });
    }
  });

  // Update test status
  app.patch("/api/tests/:id/status", async (req, res) => {
    try {
      const testId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedTest = await storage.updateTestStatus(testId, status);
      res.status(200).json(updatedTest);
    } catch (error: any) {
      console.error("Error updating test status:", error);
      res.status(500).json({ 
        message: "Failed to update test status", 
        error: error.message 
      });
    }
  });

  // Get test results for a user
  app.get("/api/users/:userId/results", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const results = await storage.getTestResultsByUser(userId);
      res.status(200).json(results);
    } catch (error: any) {
      console.error("Error fetching user results:", error);
      res.status(500).json({ 
        message: "Failed to fetch user results", 
        error: error.message 
      });
    }
  });

  // Get a specific test result
  app.get("/api/results/:id", async (req, res) => {
    try {
      const resultId = parseInt(req.params.id);
      const result = await storage.getTestResult(resultId);
      
      if (!result) {
        return res.status(404).json({ message: "Test result not found" });
      }
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error fetching test result:", error);
      res.status(500).json({ 
        message: "Failed to fetch test result", 
        error: error.message 
      });
    }
  });

  // Save a test result
  app.post("/api/results", async (req, res) => {
    try {
      const resultData = req.body;
      const savedResult = await storage.createTestResult(resultData);
      res.status(201).json(savedResult);
    } catch (error: any) {
      console.error("Error saving test result:", error);
      res.status(500).json({ 
        message: "Failed to save test result", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
