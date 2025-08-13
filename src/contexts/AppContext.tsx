import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Question, Registration, Submission } from '../types';

interface AppContextType {
  isQuizOpen: boolean | null;
  quizQuestions: Question[];
  registrations: Registration[];
  submissions: Submission[];
  isAdmin: boolean;
  currentParticipantId: string | null;
  isLoading: boolean;
  
  fetchInitialData: () => Promise<void>;
  toggleQuizStatus: () => Promise<void>;
  setQuizQuestions: (questions: Question[]) => Promise<void>;
  generateNewQuiz: (topic: string, count: number) => Promise<Question[]>;
  addRegistration: (registration: Omit<Registration, 'id' | 'password'>) => Promise<string>;
  addSubmission: (submission: Omit<Submission, 'score' | 'submittedAt'>) => Promise<void>;
  loginAdmin: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loginParticipant: (password: string) => Promise<boolean>;
  getParticipantName: (id: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isQuizOpen, setIsQuizOpen] = useState<boolean | null>(null);
  const [quizQuestions, setQuizQuestionsState] = useState<Question[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await fetch(url, { ...defaultOptions, ...options, headers: {...defaultOptions.headers, ...options.headers} });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json();
    }
    return response.text();
  };

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
        const data = await apiFetch('/api/state');
        setQuizQuestionsState(data.quizQuestions || []);
        setIsQuizOpen(data.isQuizOpen);
        
        const session = await apiFetch('/api/session');
        if (session.isAdmin) {
            setIsAdmin(true);
            const adminData = await apiFetch('/api/admin/data');
            setRegistrations(adminData.registrations || []);
            setSubmissions(adminData.submissions || []);
        }
        if (session.participantId) {
            setCurrentParticipantId(session.participantId);
        }

    } catch (error) {
        console.error("Error fetching initial data:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const toggleQuizStatus = async () => {
    const data = await apiFetch('/api/admin/quiz/status', { method: 'PUT' });
    setIsQuizOpen(data.isQuizOpen);
  };
  
  const setQuizQuestions = async (questions: Question[]) => {
      await apiFetch('/api/admin/quiz/questions', { method: 'PUT', body: JSON.stringify({ questions }) });
      setQuizQuestionsState(questions);
  };
  
  const generateNewQuiz = async (topic: string, count: number): Promise<Question[]> => {
      const data = await apiFetch('/api/admin/quiz/generate', { method: 'POST', body: JSON.stringify({ topic, count }) });
      setQuizQuestionsState(data.questions);
      return data.questions;
  };
  
  const addRegistration = async (registration: Omit<Registration, 'id' | 'password'>): Promise<string> => {
      const data = await apiFetch('/api/register', { method: 'POST', body: JSON.stringify(registration) });
      return data.password;
  };

  const addSubmission = async (submission: Omit<Submission, 'score' | 'submittedAt'>) => {
      await apiFetch('/api/submit', { method: 'POST', body: JSON.stringify(submission) });
  };
  
  const loginAdmin = async (password: string): Promise<boolean> => {
      try {
          await apiFetch('/api/login/admin', { method: 'POST', body: JSON.stringify({ password }) });
          setIsAdmin(true);
          await fetchInitialData(); // Re-fetch all data as admin
          return true;
      } catch (error) {
          console.error("Admin login failed:", error);
          return false;
      }
  };

  const loginParticipant = async (password: string): Promise<boolean> => {
      try {
        const data = await apiFetch('/api/login/participant', { method: 'POST', body: JSON.stringify({ password }) });
        setCurrentParticipantId(data.participantId);
        return true;
      } catch (error) {
        console.error("Participant login failed:", error);
        return false;
      }
  };
  
  const logout = async () => {
      await apiFetch('/api/logout', { method: 'POST' });
      setIsAdmin(false);
      setCurrentParticipantId(null);
      setRegistrations([]);
      setSubmissions([]);
      // fetch initial data for a logged out user
      await fetchInitialData();
  };

  const getParticipantName = (id: string): string => {
    return registrations.find(r => r.id === id)?.name || 'Unknown';
  };
  
  const value: AppContextType = {
    isQuizOpen, quizQuestions, registrations, submissions, isAdmin, currentParticipantId, isLoading,
    fetchInitialData, toggleQuizStatus, setQuizQuestions, generateNewQuiz, addRegistration, addSubmission,
    loginAdmin, logout, loginParticipant, getParticipantName,
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
