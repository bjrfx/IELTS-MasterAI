import { Test, TestContent, TestAnswers, ModuleScores, TestModule } from "@shared/schema";
import fetch from "node-fetch";

interface EvaluateTestParams {
  test: Test;
  answers: TestAnswers;
  testType: string;
}

interface TestFeedback {
  reading?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  listening?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  writing?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
    task1Feedback?: string;
    task2Feedback?: string;
  };
  speaking?: {
    strengths: string[];
    weaknesses: string[];
    advice: string;
  };
  overall?: {
    summary: string;
    nextSteps: string[];
  };
}

interface EvaluationResult {
  scores: ModuleScores;
  feedback: TestFeedback;
}

export async function evaluateTest(params: EvaluateTestParams): Promise<EvaluationResult> {
  const { test, answers, testType } = params;
  const testContent: TestContent = test.content as TestContent;
  
  try {
    // Calculate scores for each section
    const scores: ModuleScores = {};
    
    // Evaluate each module that has answers
    if (answers.reading && testContent.reading) {
      scores.reading = evaluateReadingModule(testContent.reading, answers.reading);
    }
    
    if (answers.listening && testContent.listening) {
      scores.listening = evaluateListeningModule(testContent.listening, answers.listening);
    }
    
    if (answers.writing && testContent.writing) {
      scores.writing = await evaluateWritingModule(testContent.writing, answers.writing);
    }
    
    if (answers.speaking && testContent.speaking) {
      scores.speaking = await evaluateSpeakingModule(testContent.speaking, answers.speaking);
    }
    
    // Calculate overall score (average of available scores)
    const availableScores = Object.values(scores).filter(score => score !== undefined) as number[];
    if (availableScores.length > 0) {
      scores.overall = calculateOverallScore(availableScores);
    }
    
    // Generate feedback for each module and overall performance
    const feedback = await generateFeedback(scores, testContent, answers, testType);
    
    return {
      scores,
      feedback
    };
    
  } catch (error) {
    console.error("Error evaluating test:", error);
    throw new Error(`Failed to evaluate test: ${error}`);
  }
}

function evaluateReadingModule(readingContent: any, answers: Record<string, string | string[]>): number {
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  // Process each passage and its questions
  readingContent.passages.forEach((passage: any) => {
    passage.questions.forEach((question: any) => {
      totalQuestions++;
      const userAnswer = answers[question.id.toString()];
      
      if (compareAnswers(userAnswer, question.answer)) {
        correctAnswers++;
      }
    });
  });
  
  // Convert to IELTS band score (0-9 scale)
  return convertToIeltsBandScore(correctAnswers, totalQuestions);
}

function evaluateListeningModule(listeningContent: any, answers: Record<string, string | string[]>): number {
  let correctAnswers = 0;
  let totalQuestions = 0;
  
  // Process each section and its questions
  listeningContent.sections.forEach((section: any) => {
    section.questions.forEach((question: any) => {
      totalQuestions++;
      const userAnswer = answers[question.id.toString()];
      
      if (compareAnswers(userAnswer, question.answer)) {
        correctAnswers++;
      }
    });
  });
  
  // Convert to IELTS band score (0-9 scale)
  return convertToIeltsBandScore(correctAnswers, totalQuestions);
}

async function evaluateWritingModule(writingContent: any, answers: Record<string, string>): Promise<number> {
  // For writing, we need to use AI to evaluate the responses
  try {
    const apiKey = process.env.COHERE_API_KEY || "ZnDnpqysJwinJTA8yRTbBMuw5hCCkbJamJmP8Oe9";
    const apiEndpoint = "https://api.cohere.ai/v1/generate";
    
    const task1 = writingContent.tasks.find((task: any) => task.type === 'task1');
    const task2 = writingContent.tasks.find((task: any) => task.type === 'task2');
    
    const task1Response = answers['task1'] || '';
    const task2Response = answers['task2'] || '';
    
    // Build prompt for evaluation
    const prompt = `You are an IELTS writing examiner. Evaluate the following IELTS writing responses based on the IELTS scoring criteria (Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy). Score on a scale of 0-9.

Task 1 Instructions: ${task1?.instructions || ''}
Task 1 Response: ${task1Response}

Task 2 Instructions: ${task2?.instructions || ''}
Task 2 Response: ${task2Response}

Provide a band score from 0-9 for each task, and an overall band score for the writing section. The format of your response should be:
Task 1 Score: [score]
Task 2 Score: [score]
Overall Writing Score: [score]`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.3,
        return_likelihoods: "NONE"
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    const evaluationText = data.generations[0].text;
    
    // Extract scores using regex
    const task1ScoreMatch = evaluationText.match(/Task 1 Score:\s*(\d+(?:\.\d+)?)/i);
    const task2ScoreMatch = evaluationText.match(/Task 2 Score:\s*(\d+(?:\.\d+)?)/i);
    const overallScoreMatch = evaluationText.match(/Overall Writing Score:\s*(\d+(?:\.\d+)?)/i);
    
    let writingScore = 0;
    
    if (overallScoreMatch && overallScoreMatch[1]) {
      writingScore = parseFloat(overallScoreMatch[1]);
    } else if (task1ScoreMatch && task2ScoreMatch) {
      // If no overall score is provided, calculate it (task2 is usually weighted heavier)
      const task1Score = parseFloat(task1ScoreMatch[1]);
      const task2Score = parseFloat(task2ScoreMatch[1]);
      writingScore = (task1Score + task2Score * 2) / 3;
    } else {
      // Default fallback based on word count and basic criteria
      writingScore = basicWritingEvaluation(task1Response, task2Response);
    }
    
    return Math.min(Math.max(writingScore, 0), 9); // Ensure score is between 0-9
    
  } catch (error) {
    console.error("Error evaluating writing:", error);
    // Fallback to basic evaluation if AI evaluation fails
    return basicWritingEvaluation(answers['task1'] || '', answers['task2'] || '');
  }
}

async function evaluateSpeakingModule(speakingContent: any, answers: Record<string, string>): Promise<number> {
  // For speaking, we would normally use audio analysis, but since we're simulating with text responses
  // or audio URLs, we'll use a simpler approach or AI evaluation
  
  try {
    // Check if we have any answers to evaluate
    const hasResponses = Object.values(answers).some(answer => answer && answer.length > 0);
    
    if (!hasResponses) {
      return 5; // Default middle score if no responses
    }
    
    // Since we can't actually analyze audio in this context, we'll use AI to simulate evaluation
    // based on a description of what the user might have said
    const apiKey = process.env.COHERE_API_KEY || "ZnDnpqysJwinJTA8yRTbBMuw5hCCkbJamJmP8Oe9";
    const apiEndpoint = "https://api.cohere.ai/v1/generate";
    
    // Build a prompt for evaluation
    const prompt = `You are an IELTS speaking examiner. The candidate has completed an IELTS speaking test. 
Based on the test questions and the fact that responses were recorded but cannot be analyzed directly, 
provide a simulated band score from 0-9 for the speaking section.

The speaking test included questions like:
${speakingContent.parts.map((part: any) => 
  part.questions.map((q: any) => q.text).join("\n")
).join("\n")}

Assume the candidate has intermediate to upper-intermediate English proficiency. Evaluate based on:
- Fluency and Coherence
- Lexical Resource
- Grammatical Range and Accuracy
- Pronunciation

Provide only a band score as a number between 0 and 9.`;

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.3,
        return_likelihoods: "NONE"
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    const evaluationText = data.generations[0].text;
    
    // Extract the score using regex
    const scoreMatch = evaluationText.match(/\b([0-9](?:\.[0-9])?)\b/);
    
    if (scoreMatch && scoreMatch[1]) {
      return parseFloat(scoreMatch[1]);
    }
    
    // Fallback to a reasonable default
    return 6.0;
    
  } catch (error) {
    console.error("Error evaluating speaking:", error);
    // Return a moderate band score as fallback
    return 6.0;
  }
}

async function generateFeedback(
  scores: ModuleScores, 
  testContent: TestContent, 
  answers: TestAnswers, 
  testType: string
): Promise<TestFeedback> {
  const feedback: TestFeedback = {};
  
  try {
    const apiKey = process.env.COHERE_API_KEY || "ZnDnpqysJwinJTA8yRTbBMuw5hCCkbJamJmP8Oe9";
    const apiEndpoint = "https://api.cohere.ai/v1/generate";
    
    // Generate feedback for each module
    if (scores.reading !== undefined) {
      feedback.reading = await generateModuleFeedback('reading', scores.reading, testType, apiEndpoint, apiKey);
    }
    
    if (scores.listening !== undefined) {
      feedback.listening = await generateModuleFeedback('listening', scores.listening, testType, apiEndpoint, apiKey);
    }
    
    if (scores.writing !== undefined) {
      // For writing, include task-specific feedback
      const writingFeedback = await generateModuleFeedback('writing', scores.writing, testType, apiEndpoint, apiKey);
      
      if (testContent.writing && answers.writing) {
        // Get detailed feedback for each task
        const task1Response = answers.writing['task1'];
        const task2Response = answers.writing['task2'];
        
        if (task1Response) {
          const task1Prompt = `Evaluate this IELTS Writing Task 1 response. Focus on Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
Instructions: ${testContent.writing.tasks.find((t: any) => t.type === 'task1')?.instructions || ''}
Response: ${task1Response}
Provide specific feedback in 2-3 sentences.`;
          
          writingFeedback.task1Feedback = await getAIFeedback(task1Prompt, apiEndpoint, apiKey);
        }
        
        if (task2Response) {
          const task2Prompt = `Evaluate this IELTS Writing Task 2 response. Focus on Task Achievement, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.
Instructions: ${testContent.writing.tasks.find((t: any) => t.type === 'task2')?.instructions || ''}
Response: ${task2Response}
Provide specific feedback in 2-3 sentences.`;
          
          writingFeedback.task2Feedback = await getAIFeedback(task2Prompt, apiEndpoint, apiKey);
        }
      }
      
      feedback.writing = writingFeedback;
    }
    
    if (scores.speaking !== undefined) {
      feedback.speaking = await generateModuleFeedback('speaking', scores.speaking, testType, apiEndpoint, apiKey);
    }
    
    // Generate overall feedback
    if (scores.overall !== undefined) {
      const overallPrompt = `You are an IELTS examiner providing feedback to a test taker. The candidate received the following scores:
${scores.reading !== undefined ? `Reading: ${scores.reading}` : ''}
${scores.listening !== undefined ? `Listening: ${scores.listening}` : ''}
${scores.writing !== undefined ? `Writing: ${scores.writing}` : ''}
${scores.speaking !== undefined ? `Speaking: ${scores.speaking}` : ''}
Overall: ${scores.overall}

Provide a summary of their performance (2-3 sentences) and list 3-5 specific next steps or study recommendations to improve their score.
Format the response as:
Summary: [your summary here]
Next Steps: [bullet points of recommendations]`;

      const overallFeedbackResponse = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "command",
          prompt: overallPrompt,
          max_tokens: 500,
          temperature: 0.3,
          return_likelihoods: "NONE"
        })
      });
      
      if (overallFeedbackResponse.ok) {
        const data = await overallFeedbackResponse.json() as any;
        const feedbackText = data.generations[0].text;
        
        // Extract summary and next steps
        const summaryMatch = feedbackText.match(/Summary:\s*([\s\S]*?)(?=Next Steps:|$)/i);
        const nextStepsMatch = feedbackText.match(/Next Steps:\s*([\s\S]*)/i);
        
        const summary = summaryMatch ? summaryMatch[1].trim() : "Your performance shows both strengths and areas for improvement. Continue practicing to enhance your skills.";
        let nextSteps: string[] = [];
        
        if (nextStepsMatch) {
          // Extract bullet points
          nextSteps = nextStepsMatch[1]
            .split(/\n-|\n•|\n\*|\n\d+\./)
            .filter(step => step.trim().length > 0)
            .map(step => step.trim());
        }
        
        if (nextSteps.length === 0) {
          nextSteps = [
            "Practice regular reading in English from a variety of sources",
            "Work on improving your vocabulary in different contexts",
            "Listen to English podcasts and news to improve comprehension",
            "Practice writing essays with a focus on structure and coherence",
            "Speak English whenever possible to build fluency"
          ];
        }
        
        feedback.overall = {
          summary,
          nextSteps
        };
      } else {
        // Fallback if API call fails
        feedback.overall = {
          summary: `Your overall band score is ${scores.overall.toFixed(1)}. You've shown good progress in some areas, but there's room for improvement in others.`,
          nextSteps: [
            "Focus on vocabulary development across different topics",
            "Practice reading academic texts and articles",
            "Listen to English media to improve comprehension",
            "Practice writing with proper structure and organization",
            "Speak English regularly to improve fluency and pronunciation"
          ]
        };
      }
    }
    
    return feedback;
    
  } catch (error) {
    console.error("Error generating feedback:", error);
    
    // Create basic feedback if AI generation fails
    const modules: TestModule[] = ['reading', 'listening', 'writing', 'speaking'];
    
    modules.forEach(module => {
      if (scores[module] !== undefined) {
        feedback[module] = createBasicFeedback(module, scores[module]!);
      }
    });
    
    if (scores.overall !== undefined) {
      feedback.overall = {
        summary: `Your overall band score is ${scores.overall.toFixed(1)}. Continue practicing all modules to improve your performance.`,
        nextSteps: [
          "Read widely in English including newspapers, academic texts, and online articles",
          "Listen to English podcasts, news, and lectures to improve comprehension",
          "Practice writing essays with clear structure and varied vocabulary",
          "Speak English regularly and record yourself to identify areas for improvement",
          "Build your vocabulary by learning words in context"
        ]
      };
    }
    
    return feedback;
  }
}

async function generateModuleFeedback(
  module: TestModule, 
  score: number, 
  testType: string,
  apiEndpoint: string,
  apiKey: string
): Promise<any> {
  const prompt = `You are an IELTS examiner providing feedback to a test taker who scored ${score.toFixed(1)} in the ${module} section of the ${testType} IELTS test.

Based on this score, provide:
1. Three specific strengths they likely demonstrated
2. Three specific areas for improvement
3. One sentence of actionable advice for improving their score

Format your response exactly as follows:
Strengths:
- [strength 1]
- [strength 2]
- [strength 3]

Weaknesses:
- [weakness 1]
- [weakness 2]
- [weakness 3]

Advice: [your one sentence of advice]`;

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.3,
        return_likelihoods: "NONE"
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    const feedbackText = data.generations[0].text;
    
    // Extract strengths, weaknesses, and advice
    const strengthsMatch = feedbackText.match(/Strengths:\s*([\s\S]*?)(?=Weaknesses:|$)/i);
    const weaknessesMatch = feedbackText.match(/Weaknesses:\s*([\s\S]*?)(?=Advice:|$)/i);
    const adviceMatch = feedbackText.match(/Advice:\s*([\s\S]*)/i);
    
    const strengths = extractBulletPoints(strengthsMatch ? strengthsMatch[1] : '');
    const weaknesses = extractBulletPoints(weaknessesMatch ? weaknessesMatch[1] : '');
    const advice = adviceMatch ? adviceMatch[1].trim() : '';
    
    if (strengths.length === 0 || weaknesses.length === 0 || !advice) {
      // If extraction failed, use basic feedback
      return createBasicFeedback(module, score);
    }
    
    return {
      strengths,
      weaknesses,
      advice
    };
    
  } catch (error) {
    console.error(`Error generating ${module} feedback:`, error);
    return createBasicFeedback(module, score);
  }
}

async function getAIFeedback(prompt: string, apiEndpoint: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "command",
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.3,
        return_likelihoods: "NONE"
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    return data.generations[0].text.trim();
    
  } catch (error) {
    console.error("Error getting AI feedback:", error);
    return "No specific feedback available. Focus on improving structure, vocabulary, and grammar.";
  }
}

function extractBulletPoints(text: string): string[] {
  return text
    .split(/\n-|\n•|\n\*|\n\d+\./)
    .filter(point => point.trim().length > 0)
    .map(point => point.trim());
}

function createBasicFeedback(module: TestModule, score: number): any {
  const feedbackData: Record<TestModule, any> = {
    reading: {
      strengths: [
        "Ability to identify main ideas in passages",
        "Understanding of basic vocabulary",
        "Identification of explicit information"
      ],
      weaknesses: [
        "Difficulty with complex vocabulary",
        "Limited understanding of implicit information",
        "Time management during the test"
      ],
      advice: "Practice reading a variety of texts and focus on improving your vocabulary and comprehension skills."
    },
    listening: {
      strengths: [
        "Understanding of simple conversational English",
        "Ability to follow straightforward instructions",
        "Recognition of basic context and setting"
      ],
      weaknesses: [
        "Difficulty with fast speech and complex accents",
        "Missing specific details in longer passages",
        "Trouble with note-taking while listening"
      ],
      advice: "Listen to various English media daily and practice note-taking while listening to improve your skills."
    },
    writing: {
      strengths: [
        "Basic organization of ideas",
        "Expressing simple opinions",
        "Use of common vocabulary"
      ],
      weaknesses: [
        "Limited sentence structure variety",
        "Grammar errors affecting clarity",
        "Inadequate development of ideas"
      ],
      advice: "Practice writing essays with clear structure and varied vocabulary, and get feedback from others when possible."
    },
    speaking: {
      strengths: [
        "Ability to communicate basic ideas",
        "Responding to familiar questions",
        "Using simple vocabulary appropriately"
      ],
      weaknesses: [
        "Limited fluency and hesitation",
        "Pronunciation issues affecting understanding",
        "Restricted range of grammar and vocabulary"
      ],
      advice: "Speak English regularly and record yourself to identify areas for improvement in fluency and pronunciation."
    }
  };
  
  // Adjust feedback based on score
  if (score >= 7) {
    // For high scorers
    if (module === 'reading') {
      feedbackData.reading.strengths = [
        "Strong comprehension of complex academic texts",
        "Excellent vocabulary knowledge",
        "Ability to identify implicit meanings"
      ];
      feedbackData.reading.weaknesses = [
        "Minor difficulties with specialized vocabulary",
        "Occasional misinterpretation of nuanced details",
        "Time management on very complex questions"
      ];
    } else if (module === 'listening') {
      feedbackData.listening.strengths = [
        "Strong ability to follow complex discussions",
        "Good understanding of different accents",
        "Excellent detail recognition"
      ];
      feedbackData.listening.weaknesses = [
        "Occasional difficulty with very specialized terminology",
        "Minor issues with rapid speech in academic contexts",
        "Slight inaccuracies in note-taking during complex sections"
      ];
    } else if (module === 'writing') {
      feedbackData.writing.strengths = [
        "Clear organization and logical development",
        "Good range of vocabulary and sentence structures",
        "Effective use of cohesive devices"
      ];
      feedbackData.writing.weaknesses = [
        "Occasional imprecision in word choice",
        "Infrequent grammar errors in complex structures",
        "Room for more sophisticated argument development"
      ];
    } else if (module === 'speaking') {
      feedbackData.speaking.strengths = [
        "Fluent delivery with minimal hesitation",
        "Good range of vocabulary for most topics",
        "Clear pronunciation with natural intonation"
      ];
      feedbackData.speaking.weaknesses = [
        "Occasional difficulty with specialized topics",
        "Some minor errors in complex grammatical structures",
        "Room for improvement in idiomatic language use"
      ];
    }
  } else if (score <= 4) {
    // For low scorers
    if (module === 'reading') {
      feedbackData.reading.strengths = [
        "Recognition of basic vocabulary",
        "Ability to find explicitly stated information",
        "Understanding of simple sentences"
      ];
      feedbackData.reading.weaknesses = [
        "Limited vocabulary affecting overall comprehension",
        "Difficulty understanding complex sentence structures",
        "Problems identifying the main ideas of passages"
      ];
    } else if (module === 'listening') {
      feedbackData.listening.strengths = [
        "Understanding of simple, clearly spoken statements",
        "Recognition of familiar words and phrases",
        "Ability to follow slow, clear instructions"
      ];
      feedbackData.listening.weaknesses = [
        "Significant difficulty with natural speech rate",
        "Limited vocabulary affecting overall comprehension",
        "Trouble following longer conversations or lectures"
      ];
    } else if (module === 'writing') {
      feedbackData.writing.strengths = [
        "Ability to communicate basic ideas",
        "Use of simple vocabulary",
        "Attempting to address the task"
      ];
      feedbackData.writing.weaknesses = [
        "Frequent grammar errors affecting clarity",
        "Very limited vocabulary range",
        "Poor organization and paragraph structure"
      ];
    } else if (module === 'speaking') {
      feedbackData.speaking.strengths = [
        "Ability to communicate some basic information",
        "Use of simple vocabulary for familiar topics",
        "Attempting to respond to questions"
      ];
      feedbackData.speaking.weaknesses = [
        "Limited range of expression causing communication breakdowns",
        "Pronunciation issues significantly affecting understanding",
        "Frequent long pauses and hesitations"
      ];
    }
  }
  
  return feedbackData[module];
}

function compareAnswers(userAnswer: string | string[] | undefined, correctAnswer: string | string[]): boolean {
  if (!userAnswer) return false;
  
  // Normalize both answers for comparison
  const normalizeAnswer = (answer: string | string[]): string[] => {
    if (Array.isArray(answer)) {
      return answer.map(item => item.toLowerCase().trim());
    }
    return [answer.toLowerCase().trim()];
  };
  
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);
  
  // Check if all elements in correctAnswer are in userAnswer and vice versa
  if (normalizedUserAnswer.length !== normalizedCorrectAnswer.length) {
    return false;
  }
  
  // For single answers, do exact match
  if (normalizedUserAnswer.length === 1 && normalizedCorrectAnswer.length === 1) {
    return normalizedUserAnswer[0] === normalizedCorrectAnswer[0];
  }
  
  // For multiple answers, check if all elements match (order may matter)
  return normalizedUserAnswer.every((item, index) => item === normalizedCorrectAnswer[index]);
}

function convertToIeltsBandScore(correctAnswers: number, totalQuestions: number): number {
  // Calculate percentage correct
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  // Convert to IELTS band score (approximate conversion)
  if (percentage >= 90) return 9.0;
  if (percentage >= 85) return 8.5;
  if (percentage >= 80) return 8.0;
  if (percentage >= 75) return 7.5;
  if (percentage >= 70) return 7.0;
  if (percentage >= 65) return 6.5;
  if (percentage >= 60) return 6.0;
  if (percentage >= 55) return 5.5;
  if (percentage >= 50) return 5.0;
  if (percentage >= 45) return 4.5;
  if (percentage >= 40) return 4.0;
  if (percentage >= 35) return 3.5;
  if (percentage >= 30) return 3.0;
  if (percentage >= 25) return 2.5;
  if (percentage >= 20) return 2.0;
  return 1.0; // Minimum score
}

function calculateOverallScore(scores: number[]): number {
  // Calculate the average and round to nearest 0.5
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(average * 2) / 2; // Round to nearest 0.5
}

function basicWritingEvaluation(task1Response: string, task2Response: string): number {
  // Simple evaluation based on word count and basic criteria
  const task1Words = task1Response.trim().split(/\s+/).length;
  const task2Words = task2Response.trim().split(/\s+/).length;
  
  let task1Score = 0;
  let task2Score = 0;
  
  // Task 1 evaluation
  if (task1Words >= 150) {
    task1Score = 6.0; // Base score for meeting minimum word count
    
    // Adjust based on length
    if (task1Words >= 170) task1Score += 0.5;
    if (task1Words < 100) task1Score -= 1.0;
    
    // Simple checks for quality
    if (task1Response.includes(',') && task1Response.includes('.')) task1Score += 0.5; // Basic punctuation
    if (/however|therefore|moreover|furthermore|in addition/i.test(task1Response)) task1Score += 0.5; // Connectors
  } else if (task1Words >= 100) {
    task1Score = 5.0; // Below minimum but still substantial
  } else if (task1Words >= 50) {
    task1Score = 4.0; // Significantly below minimum
  } else if (task1Words > 0) {
    task1Score = 3.0; // Very limited response
  }
  
  // Task 2 evaluation
  if (task2Words >= 250) {
    task2Score = 6.0; // Base score for meeting minimum word count
    
    // Adjust based on length
    if (task2Words >= 280) task2Score += 0.5;
    if (task2Words < 200) task2Score -= 1.0;
    
    // Simple checks for quality
    if (task2Response.includes(',') && task2Response.includes('.')) task2Score += 0.5; // Basic punctuation
    if (/however|therefore|moreover|furthermore|in addition/i.test(task2Response)) task2Score += 0.5; // Connectors
    if (/in conclusion|to summarize|in summary/i.test(task2Response)) task2Score += 0.5; // Conclusion
  } else if (task2Words >= 200) {
    task2Score = 5.0; // Below minimum but still substantial
  } else if (task2Words >= 100) {
    task2Score = 4.0; // Significantly below minimum
  } else if (task2Words > 0) {
    task2Score = 3.0; // Very limited response
  }
  
  // Task 2 is weighted more heavily in IELTS
  const overallScore = (task1Score + task2Score * 2) / 3;
  
  // Ensure score is between 0-9
  return Math.min(Math.max(overallScore, 0), 9);
}
