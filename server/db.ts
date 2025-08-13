// This file acts as a simple in-memory database.
// In a real-world application, this would be replaced with a proper database like PostgreSQL, MongoDB, etc.

export interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Registration {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Submission {
  registrationId: string;
  answers: (number | null)[];
  score: number;
  submittedAt: string;
}

interface AppDatabase {
  registrations: Registration[];
  submissions: Submission[];
  quizQuestions: Question[];
  isQuizOpen: boolean;
  adminPasswordHash: string; // In a real app, never store plain text passwords
}

// Initialize our "database" with default values
export const db: AppDatabase = {
  registrations: [],
  submissions: [],
  quizQuestions: [],
  isQuizOpen: false,
  adminPasswordHash: "sivaliAdmin2024!", // This should be a securely hashed password
};
