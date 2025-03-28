import { InsertTest, TestContent } from "@shared/schema";
import fetch from "node-fetch";

interface GenerateTestParams {
  title: string;
  type: string;
  apiProvider: string;
  sections: {
    reading: boolean;
    listening: boolean;
    writing: boolean;
    speaking: boolean;
  };
  createdBy?: string;
}

export async function generateTest(params: GenerateTestParams): Promise<InsertTest> {
  const { title, type, apiProvider, sections, createdBy } = params;
  
  // Determine which API to use and set appropriate keys
  let apiKey = '';
  let apiEndpoint = '';
  let apiHeaders = {};
  let apiBody = {};
  
  // Build the prompt based on selected test type and modules
  const prompt = buildTestGenerationPrompt(type, sections);
  
  // Configure API-specific settings
  switch (apiProvider) {
    case "cohere":
      apiKey = process.env.COHERE_API_KEY || "ZnDnpqysJwinJTA8yRTbBMuw5hCCkbJamJmP8Oe9";
      apiEndpoint = "https://api.cohere.ai/v1/generate";
      apiHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };
      apiBody = {
        model: "command",
        prompt: prompt,
        max_tokens: 4000,
        temperature: 0.7,
        return_likelihoods: "NONE"
      };
      break;
      
    case "google":
      apiKey = process.env.GOOGLE_AI_API_KEY || "AIzaSyBcuPiW2QH9eDO-aKLVbBcCnoY2BNmogwU";
      apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
      apiHeaders = {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      };
      apiBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000
        }
      };
      break;
      
    case "deepseek":
      apiKey = process.env.DEEPSEEK_API_KEY || "sk-0fc129fe2fb54f1db6c7b75367438a9a";
      apiEndpoint = "https://api.deepseek.com/v1/chat/completions";
      apiHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      };
      apiBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant specializing in creating IELTS tests. Generate test content in JSON format only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      };
      break;
      
    default:
      throw new Error(`Unknown API provider: ${apiProvider}`);
  }
  
  try {
    // Make the API request
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify(apiBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${apiProvider} API error: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json() as any;
    
    // Parse the generated content as JSON based on the API provider
    let rawContent = '';
    
    if (apiProvider === "cohere") {
      rawContent = data.generations[0].text;
    } else if (apiProvider === "google") {
      // Handle both the v1 and v1beta response formats
      console.log("Google AI raw response:", JSON.stringify(data, null, 2).substring(0, 500) + "...");
      
      if (data.candidates && data.candidates[0]) {
        if (data.candidates[0].content && data.candidates[0].content.parts) {
          // Standard format
          rawContent = data.candidates[0].content.parts[0].text;
        } else if (data.candidates[0].parts) {
          // Alternative format
          rawContent = data.candidates[0].parts[0].text;
        } else if (data.candidates[0].text) {
          // Another possible format
          rawContent = data.candidates[0].text;
        } else {
          console.log("Full Google AI response:", JSON.stringify(data));
          throw new Error("Could not extract text content from Google AI response");
        }
      } else if (data.text) {
        // Legacy API format
        rawContent = data.text;
      } else {
        console.warn("Unexpected Google AI response format:", JSON.stringify(data));
        throw new Error("Unexpected response format from Google AI API");
      }
    } else if (apiProvider === "deepseek") {
      rawContent = data.choices[0].message.content;
    }
    
    // Parse the generated content as JSON
    const testContent = parseGeneratedTestContent(rawContent);
    
    // Validate that we have the required modules based on sections
    validateTestContent(testContent, sections);
    
    // Create the test object
    const test: InsertTest = {
      title,
      type,
      createdBy: createdBy || "admin",
      hasReading: sections.reading,
      hasListening: sections.listening,
      hasWriting: sections.writing,
      hasSpeaking: sections.speaking,
      content: testContent,
      status: "active" as any // Added type assertion to avoid TS error
    };
    
    return test;
    
  } catch (error) {
    console.error("Error generating test content:", error);
    throw new Error(`Failed to generate test: ${error}`);
  }
}

function buildTestGenerationPrompt(type: string, sections: any): string {
  const testType = type === "academic" ? "Academic" : "General Training";
  const modulesList = Object.entries(sections)
    .filter(([_, included]) => included)
    .map(([module]) => module.charAt(0).toUpperCase() + module.slice(1))
    .join(", ");
  
  const includeReading = sections.reading ? true : false;
  const includeListening = sections.listening ? true : false;
  const includeWriting = sections.writing ? true : false;
  const includeSpeaking = sections.speaking ? true : false;
  
  // Build a complete example JSON structure based on the required sections
  let exampleJson = "{\n";
  
  if (includeReading) {
    exampleJson += `  "reading": {
    "passages": [
      {
        "title": "The History of Tea",
        "content": "Tea has a long and fascinating history...",
        "questions": [
          {
            "id": 1,
            "type": "multiple-choice",
            "text": "What is the main focus of the passage?",
            "options": ["The cultivation of tea", "The history of tea", "Tea drinking customs"],
            "answer": "The history of tea"
          }
        ]
      }
    ]
  }`;
    
    if (includeListening || includeWriting || includeSpeaking) {
      exampleJson += ",\n";
    } else {
      exampleJson += "\n";
    }
  }
  
  if (includeListening) {
    exampleJson += `  "listening": {
    "sections": [
      {
        "title": "Conversation between students",
        "audioText": "Person A: Hi, I was wondering if you could help me with...",
        "questions": [
          {
            "id": 1,
            "type": "fill-blank",
            "text": "The student needs help with _____.",
            "answer": "assignment"
          }
        ]
      }
    ]
  }`;
    
    if (includeWriting || includeSpeaking) {
      exampleJson += ",\n";
    } else {
      exampleJson += "\n";
    }
  }
  
  if (includeWriting) {
    exampleJson += `  "writing": {
    "tasks": [
      {
        "type": "task1",
        "instructions": "The graph below shows the population changes in a country...",
        "content": "Description of chart data showing population trends from 1990 to 2020",
        "imageDescription": "Line graph showing population growth trend from 1990 to 2020"
      },
      {
        "type": "task2",
        "instructions": "Some people believe that university education should be free for all students. Others think students should pay for their education. Discuss both views and give your opinion."
      }
    ]
  }`;
    
    if (includeSpeaking) {
      exampleJson += ",\n";
    } else {
      exampleJson += "\n";
    }
  }
  
  if (includeSpeaking) {
    exampleJson += `  "speaking": {
    "parts": [
      {
        "part": 1,
        "questions": [
          {
            "text": "Do you enjoy traveling?",
            "followUpQuestions": ["What kinds of places do you like to visit?", "How often do you travel?"]
          }
        ]
      },
      {
        "part": 2,
        "questions": [
          {
            "text": "Describe a book that you enjoyed reading. You should say: what the book was about, when you read it, why you decided to read it, and explain why you enjoyed it."
          }
        ]
      }
    ]
  }\n`;
  }
  
  exampleJson += "}";
  
  return `Generate a complete IELTS ${testType} test with the following modules: ${modulesList}.

IMPORTANT: Your response must be a single, valid JSON object with no additional text, explanations, or markdown.
Do not include any text outside the JSON structure.
Do not use markdown code blocks or any other formatting around the JSON.
Include only the requested modules: ${modulesList}.

Here is the exact structure I need:
${exampleJson}

Please ensure:
1. All property names are in double quotes
2. All string values are in double quotes
3. No trailing commas in arrays or objects
4. The JSON must be properly nested and correctly formatted
5. Generate realistic IELTS content that's challenging but fair
6. Each section should follow official IELTS test format and difficulty level
7. Content should be appropriate for the ${testType} version of the test

YOUR ENTIRE RESPONSE SHOULD BE ONLY VALID JSON WITH NO OTHER TEXT OR EXPLANATION.`;
}

function parseGeneratedTestContent(text: string): TestContent {
  try {
    console.log("Parsing raw text:", text.substring(0, 100) + "...");
    
    // Find JSON content within the text (it might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                      text.match(/```\n([\s\S]*?)\n```/) || 
                      text.match(/```([\s\S]*?)```/) ||
                      text.match(/{[\s\S]*}/);
    
    let jsonString = jsonMatch ? jsonMatch[0].replace(/```json\n|```\n|```/g, '') : text;
    
    console.log("Extracted JSON string (first 100 chars):", jsonString.substring(0, 100) + "...");

    // Advanced JSON cleanup - multiple steps to handle various edge cases
    // Step 1: Handle common format issues
    
    // Replace any escaped quotes or Unicode quotes with standard double quotes
    jsonString = jsonString.replace(/\\"/g, '"')
                          .replace(/[""]/g, '"')
                          .replace(/['']/g, "'");
    
    // Replace any trailing commas in arrays or objects
    jsonString = jsonString.replace(/,\s*}/g, '}')
                          .replace(/,\s*\]/g, ']');
    
    // Fix property names that are not properly quoted
    jsonString = jsonString.replace(/(\s*)([a-zA-Z0-9_$]+)(\s*):/g, '$1"$2"$3:');
    
    // Clean up control characters
    jsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Handle multi-line strings better
    jsonString = jsonString.replace(/:\s*"([^"]*(?:\\.[^"]*)*)"(\s*[,}])/g, 
      (match, p1, p2) => {
        // Replace newlines in the string with escaped newlines
        const fixedString = p1.replace(/\n/g, '\\n');
        return `: "${fixedString}"${p2}`;
      }
    );
    
    // Step 2: Additional fixes for common Google AI response issues
    
    // Fix missing quotes around string values
    jsonString = jsonString.replace(/:(\s*)([^{}\[\]"'\s][^{}\[\],:]*?)(\s*)(,|}|])/g, ':"$2"$3$4');
    
    // Fix inconsistent use of single and double quotes
    jsonString = jsonString.replace(/'([^']*?)'/g, '"$1"');
    
    // Handle cases where the model outputs Javascript-style comments
    jsonString = jsonString.replace(/\/\/.*?\n/g, '\n');
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Fix incorrect escaping in strings
    jsonString = jsonString.replace(/\\+([^"\\])/g, '\\$1');
    
    // Remove any unexpected characters that might appear in the JSON string
    jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Sometimes the AI adds explanations or notes after the JSON - try to truncate those
    const lastBrace = jsonString.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < jsonString.length - 1) {
      jsonString = jsonString.substring(0, lastBrace + 1);
    }
    
    try {
      console.log("Attempting to parse cleaned JSON");
      return JSON.parse(jsonString);
    } catch (error) {
      const parseError = error as Error;
      console.error("First JSON parse attempt failed:", parseError);
      console.log("Parse error location:", parseError.message);
      
      // If there's a position in the error message, try to analyze and fix that position
      const positionMatch = parseError.message ? parseError.message.match(/position (\d+)/) : null;
      if (positionMatch) {
        const errorPosition = parseInt(positionMatch[1], 10);
        console.log("Error at position:", errorPosition);
        console.log("Context around error:", jsonString.slice(Math.max(0, errorPosition - 20), errorPosition + 20));
        
        // Try to automatically fix common issues at the error position
        // This is a very basic approach and may not work for all cases
        const beforeError = jsonString.slice(0, errorPosition);
        const afterError = jsonString.slice(errorPosition);
        
        // Try to fix missing comma
        if (/["\d}][\s]*["a-zA-Z_]/.test(beforeError.slice(-1) + afterError.slice(0, 1))) {
          jsonString = beforeError + ',' + afterError;
        }
        
        // Try to fix missing quotes around property names
        if (/[{,][\s]*[a-zA-Z_]/.test(beforeError.slice(-1) + afterError.slice(0, 1))) {
          const match = afterError.match(/^([a-zA-Z_][a-zA-Z0-9_]*)[\s]*:/);
          if (match) {
            jsonString = beforeError + '"' + match[1] + '"' + afterError.slice(match[0].length - 1);
          }
        }
        
        try {
          console.log("Trying to parse with targeted fix");
          return JSON.parse(jsonString);
        } catch (err) {
          const e = err as Error;
          console.log("Targeted fix failed:", e.message || String(e));
        }
      }
      
      // Try another approach - sometimes the AI includes explanation text before or after the JSON
      const possibleJsonBlocks: string[] = [];
      let currentBlock = '';
      let braceDepth = 0;
      let inString = false;
      let escapeNext = false;
      
      // Scan the text character by character to find complete JSON objects
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        currentBlock += char;
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === '{') {
            braceDepth++;
          } else if (char === '}') {
            braceDepth--;
            if (braceDepth === 0) {
              // We found a complete JSON object
              possibleJsonBlocks.push(currentBlock);
              currentBlock = '';
            }
          }
        }
      }
      
      // Try to parse each block that looks like a complete JSON object
      for (const block of possibleJsonBlocks) {
        try {
          console.log("Trying to parse block:", block.substring(0, 100) + "...");
          return JSON.parse(block);
        } catch (parseErr) {
          const e = parseErr as Error;
          // If the error is about a specific location, try to fix that issue
          if (e.message && e.message.includes("position")) {
            const matches = e.message.match(/position (\d+)/);
            if (matches && matches[1]) {
              const errorPos = parseInt(matches[1], 10);
              console.log("Error in block at position:", errorPos);
              console.log("Context:", block.slice(Math.max(0, errorPos - 20), errorPos + 20));
              
              // Try basic fixes at the error position
              try {
                // 1. Try removing the character at the error position
                const fixedBlock1 = block.slice(0, errorPos) + block.slice(errorPos + 1);
                console.log("Fixing by removing character");
                return JSON.parse(fixedBlock1);
              } catch (e1) {
                // 2. Try adding a quote if it seems to be missing
                try {
                  const fixedBlock2 = block.slice(0, errorPos) + '"' + block.slice(errorPos);
                  console.log("Fixing by adding quote");
                  return JSON.parse(fixedBlock2);
                } catch (e2) {
                  // 3. Try adding a comma if it seems to be missing
                  try {
                    const fixedBlock3 = block.slice(0, errorPos) + ',' + block.slice(errorPos);
                    console.log("Fixing by adding comma");
                    return JSON.parse(fixedBlock3);
                  } catch (e3) {
                    continue;
                  }
                }
              }
            }
          }
          continue;
        }
      }
      
      // As a final fallback, try to extract just a valid JSON structure
      const jsonObject = extractJsonObject(jsonString);
      if (jsonObject) {
        console.log("Using extracted JSON object");
        return JSON.parse(jsonObject);
      }
      
      // Extreme fallback: try to manually construct a minimal valid TestContent object
      console.log("Attempting to construct a minimal TestContent object from available data");
      const result: TestContent = {};
      
      // Look for reading section
      if (jsonString.includes('"reading"') || jsonString.includes('"passages"')) {
        try {
          // Extract reading passages
          const readingMatch = jsonString.match(/"reading"\s*:\s*{([^}]*"passages"\s*:\s*\[[\s\S]*?\])[^}]*}/);
          if (readingMatch) {
            const readingJson = `{"reading":${readingMatch[0].slice(readingMatch[0].indexOf(':') + 1)}}`;
            try {
              const parsedReading = JSON.parse(readingJson);
              result.reading = parsedReading.reading;
            } catch (e) {
              console.log("Failed to parse reading section:", e);
            }
          }
        } catch (e) {
          console.log("Error extracting reading section:", e);
        }
      }
      
      // Look for listening section
      if (jsonString.includes('"listening"') || jsonString.includes('"sections"')) {
        try {
          const listeningMatch = jsonString.match(/"listening"\s*:\s*{([^}]*"sections"\s*:\s*\[[\s\S]*?\])[^}]*}/);
          if (listeningMatch) {
            const listeningJson = `{"listening":${listeningMatch[0].slice(listeningMatch[0].indexOf(':') + 1)}}`;
            try {
              const parsedListening = JSON.parse(listeningJson);
              result.listening = parsedListening.listening;
            } catch (e) {
              console.log("Failed to parse listening section:", e);
            }
          }
        } catch (e) {
          console.log("Error extracting listening section:", e);
        }
      }
      
      // Look for writing section
      if (jsonString.includes('"writing"') || jsonString.includes('"tasks"')) {
        try {
          const writingMatch = jsonString.match(/"writing"\s*:\s*{([^}]*"tasks"\s*:\s*\[[\s\S]*?\])[^}]*}/);
          if (writingMatch) {
            const writingJson = `{"writing":${writingMatch[0].slice(writingMatch[0].indexOf(':') + 1)}}`;
            try {
              const parsedWriting = JSON.parse(writingJson);
              result.writing = parsedWriting.writing;
            } catch (e) {
              console.log("Failed to parse writing section:", e);
            }
          }
        } catch (e) {
          console.log("Error extracting writing section:", e);
        }
      }
      
      // Look for speaking section
      if (jsonString.includes('"speaking"') || jsonString.includes('"parts"')) {
        try {
          const speakingMatch = jsonString.match(/"speaking"\s*:\s*{([^}]*"parts"\s*:\s*\[[\s\S]*?\])[^}]*}/);
          if (speakingMatch) {
            const speakingJson = `{"speaking":${speakingMatch[0].slice(speakingMatch[0].indexOf(':') + 1)}}`;
            try {
              const parsedSpeaking = JSON.parse(speakingJson);
              result.speaking = parsedSpeaking.speaking;
            } catch (e) {
              console.log("Failed to parse speaking section:", e);
            }
          }
        } catch (e) {
          console.log("Error extracting speaking section:", e);
        }
      }
      
      // If we managed to extract at least one section, return the result
      if (result.reading || result.listening || result.writing || result.speaking) {
        console.log("Created partial TestContent object:", JSON.stringify(result).substring(0, 100) + "...");
        return result;
      }
      
      console.error("All JSON parsing attempts failed");
      throw new Error("Failed to parse generated test content as JSON");
    }
  } catch (error) {
    console.error("Error parsing generated test content:", error);
    throw new Error("Failed to parse generated test content as JSON");
  }
}

// Helper function to extract valid JSON from a string that might contain extra text
function extractJsonObject(text: string): string | null {
  try {
    // Find the outermost balanced { } pair
    let openBraces = 0;
    let startIdx = -1;
    let endIdx = -1;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (openBraces === 0) {
          startIdx = i;
        }
        openBraces++;
      } else if (text[i] === '}') {
        openBraces--;
        if (openBraces === 0) {
          endIdx = i;
          // Found a complete JSON object
          const jsonObj = text.substring(startIdx, endIdx + 1);
          try {
            // Check if it's valid JSON
            JSON.parse(jsonObj);
            return jsonObj;
          } catch (e) {
            // Not valid, continue searching
          }
        }
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function validateTestContent(content: TestContent, sections: any): void {
  // Check that each required section exists
  if (sections.reading && !content.reading) {
    throw new Error("Reading section was requested but not generated");
  }
  
  if (sections.listening && !content.listening) {
    throw new Error("Listening section was requested but not generated");
  }
  
  if (sections.writing && !content.writing) {
    throw new Error("Writing section was requested but not generated");
  }
  
  if (sections.speaking && !content.speaking) {
    throw new Error("Speaking section was requested but not generated");
  }
  
  // Validate basic structure of each section
  if (content.reading && (!content.reading.passages || !Array.isArray(content.reading.passages))) {
    throw new Error("Reading section has invalid format");
  }
  
  if (content.listening && (!content.listening.sections || !Array.isArray(content.listening.sections))) {
    throw new Error("Listening section has invalid format");
  }
  
  if (content.writing && (!content.writing.tasks || !Array.isArray(content.writing.tasks))) {
    throw new Error("Writing section has invalid format");
  }
  
  if (content.speaking && (!content.speaking.parts || !Array.isArray(content.speaking.parts))) {
    throw new Error("Speaking section has invalid format");
  }
}