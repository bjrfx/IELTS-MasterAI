import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBcuPiW2QH9eDO-aKLVbBcCnoY2BNmogwU');

interface GenerateTestParams {
  testType: 'general' | 'academic';
  module: 'reading' | 'writing' | 'listening' | 'speaking';
}

export const generateTest = async ({ testType, module }: GenerateTestParams) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate an IELTS ${testType} ${module} test content with the following format:
    1. A passage suitable for ${testType} IELTS ${module} test
    2. A set of questions based on the passage
    3. The correct answers for each question

    Please ensure the content follows official IELTS test patterns and difficulty levels.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the generated content
    const [passage, ...rest] = text.split('\n\n');
    const questionsSection = rest.find(section => section.toLowerCase().includes('question'));
    const answersSection = rest.find(section => section.toLowerCase().includes('answer'));

    const questions = questionsSection
      ?.split('\n')
      .filter(line => line.trim() && !line.toLowerCase().includes('question'))
      .map(q => q.trim()) || [];

    const answers = answersSection
      ?.split('\n')
      .filter(line => line.trim() && !line.toLowerCase().includes('answer'))
      .map(a => a.trim()) || [];

    return {
      passage: passage.trim(),
      questions,
      answers
    };
  } catch (error) {
    console.error('Error generating test content:', error);
    throw error;
  }
};