import React, { useState } from 'react';
// Use useNavigate for v6/v7 compatibility
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const QuizLoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginParticipant, isQuizOpen, registrations, submissions } = useAppContext();
    // Use useNavigate hook
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isQuizOpen) {
            setError('Submissions are currently closed. Please check back later.');
            return;
        }
        
        const registration = registrations.find(r => r.password === password);
        if (registration && submissions.some(s => s.registrationId === registration.id)) {
            setError('This password has already been used to submit a quiz.');
            return;
        }

        if (loginParticipant(password)) {
            // Use navigate for navigation
            navigate('/quiz/start');
        } else {
            setError('Invalid password or you have already submitted.');
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-gray-800/60 backdrop-blur-md border border-blue-500/40 rounded-xl p-8 shadow-2xl shadow-blue-900/20">
                <h2 className="text-4xl font-bold text-center text-white mb-2">Quiz Login</h2>
                <p className="text-center text-gray-300 mb-8">Enter the password you received during registration.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Quiz Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-4 py-3 text-white tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="SAU-XXXXXX"
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={!isQuizOpen}
                        className="w-full py-3 px-4 text-lg font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/40 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {isQuizOpen ? 'Start Quiz' : 'Submissions Closed'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuizLoginPage;
