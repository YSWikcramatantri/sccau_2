
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Question, Registration, Submission } from '../types';

interface AppContextType {
  isQuizOpen: boolean;
  quizQuestions: Question[];
  registrations: Registration[];
  submissions: Submission[];
  isAdmin: boolean;
  currentParticipantId: string | null;
  toggleQuizStatus: () => void;
  setQuizQuestions: (questions: Question[]) => void;
  addRegistration: (registration: Omit<Registration, 'id' | 'password'>) => string;
  addSubmission: (submission: Omit<Submission, 'score' | 'submittedAt'>) => void;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  loginParticipant: (password: string) => boolean;
  logoutParticipant: () => void;
  getParticipantName: (id: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(() => getInitialState('SAU_QUIZ_OPEN', false));
  const [quizQuestions, setQuizQuestionsState] = useState<Question[]>(() => getInitialState('SAU_QUIZ_QUESTIONS', []));
  const [registrations, setRegistrations] = useState<Registration[]>(() => getInitialState('SAU_REGISTRATIONS', []));
  const [submissions, setSubmissions] = useState<Submission[]>(() => getInitialState('SAU_SUBMISSIONS', []));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => sessionStorage.getItem('SAU_IS_ADMIN') === 'true');
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(() => sessionStorage.getItem('SAU_PARTICIPANT_ID'));

  useEffect(() => { localStorage.setItem('SAU_QUIZ_OPEN', JSON.stringify(isQuizOpen)); }, [isQuizOpen]);
  useEffect(() => { localStorage.setItem('SAU_QUIZ_QUESTIONS', JSON.stringify(quizQuestions)); }, [quizQuestions]);
  useEffect(() => { localStorage.setItem('SAU_REGISTRATIONS', JSON.stringify(registrations)); }, [registrations]);
  useEffect(() => { localStorage.setItem('SAU_SUBMISSIONS', JSON.stringify(submissions)); }, [submissions]);
  useEffect(() => { sessionStorage.setItem('SAU_IS_ADMIN', String(isAdmin)); }, [isAdmin]);
  useEffect(() => { 
    if (currentParticipantId) {
      sessionStorage.setItem('SAU_PARTICIPANT_ID', currentParticipantId);
    } else {
      sessionStorage.removeItem('SAU_PARTICIPANT_ID');
    }
  }, [currentParticipantId]);

  const toggleQuizStatus = () => setIsQuizOpen(prev => !prev);

  const setQuizQuestions = (questions: Question[]) => setQuizQuestionsState(questions);

  const addRegistration = (registration: Omit<Registration, 'id' | 'password'>): string => {
    const prefixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let prefix = '';
    for (let i = 0; i < 3; i++) {
        prefix += prefixChars.charAt(Math.floor(Math.random() * prefixChars.length));
    }
    const suffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const password = `${prefix}-${suffix}`;
    
    const newRegistration: Registration = {
      ...registration,
      id: `reg-${Date.now()}`,
      password,
    };
    setRegistrations(prev => [...prev, newRegistration]);
    return password;
  };
  
  const addSubmission = useCallback((submission: Omit<Submission, 'score' | 'submittedAt'>) => {
    const score = submission.answers.reduce((acc, answer, index) => {
        if (quizQuestions[index] && answer === quizQuestions[index].correctAnswerIndex) {
            return acc + 1;
        }
        return acc;
    }, 0);

    const newSubmission: Submission = {
        ...submission,
        score,
        submittedAt: new Date().toISOString(),
    };
    setSubmissions(prev => [...prev, newSubmission]);
  }, [quizQuestions]);

  const loginAdmin = (password: string): boolean => {
    if (password === 'sivaliAdmin2024!') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };
  
  const logoutAdmin = () => setIsAdmin(false);

  const loginParticipant = (password: string): boolean => {
    const registration = registrations.find(r => r.password === password);
    if (!registration) return false;
    
    const hasSubmitted = submissions.some(s => s.registrationId === registration.id);
    if (hasSubmitted) return false;

    setCurrentParticipantId(registration.id);
    return true;
  };
  
  const logoutParticipant = () => setCurrentParticipantId(null);
  
  const getParticipantName = (id: string) => {
    return registrations.find(r => r.id === id)?.name || 'Unknown';
  };

  const value: AppContextType = {
    isQuizOpen,
    quizQuestions,
    registrations,
    submissions,
    isAdmin,
    currentParticipantId,
    toggleQuizStatus,
    setQuizQuestions,
    addRegistration,
    addSubmission,
    loginAdmin,
    logoutAdmin,
    loginParticipant,
    logoutParticipant,
    getParticipantName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
