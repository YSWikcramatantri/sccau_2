import React, { useState } from 'react';
// Use useNavigate for v6/v7 compatibility
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const QuizLoginPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginParticipant, isQuizOpen } = useAppContext();
    // Use useNavigate hook
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isQuizOpen) {
            setError('Submissions are currently closed. Please check back later.');
            setIsLoading(false);
            return;
        }
        
        const success = await loginParticipant(password);

        if (success) {
            navigate('/quiz/start');
        } else {
            setError('Invalid password, or this password has already been used to submit a quiz.');
        }
        setIsLoading(false);
    };

    if (isQuizOpen === null) {
        return <div className="text-center text-gray-300">Loading quiz status...</div>;
    }

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
                        disabled={!isQuizOpen || isLoading}
                        className="w-full py-3 px-4 text-lg font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/40 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        {isLoading ? 'Logging In...' : (isQuizOpen ? 'Start Quiz' : 'Submissions Closed')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuizLoginPage;
