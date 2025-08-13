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
