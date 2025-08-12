
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { generateQuizQuestions } from '../services/geminiService';
import type { Question } from '../types';

const AdminLoginPage: React.FC<{ onLogin: (password: string) => boolean }> = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onLogin(password)) {
            setError('Invalid password.');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
            <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-white mb-6">Admin Access</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="admin-password" className="sr-only">Password</label>
                        <input
                            type="password"
                            id="admin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Password"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <button type="submit" className="w-full py-3 text-lg font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

const QuestionEditModal: React.FC<{
    question: Question;
    onSave: (question: Question) => void;
    onClose: () => void;
    isNew: boolean;
}> = ({ question: initialQuestion, onSave, onClose, isNew }) => {
    const [question, setQuestion] = useState(initialQuestion);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setQuestion({ ...question, questionText: e.target.value });
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        setQuestion({ ...question, options: newOptions });
    };
    
    const handleCorrectAnswerChange = (index: number) => {
        setQuestion({ ...question, correctAnswerIndex: index });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.questionText.trim() || question.options.some(opt => !opt.trim())) {
            alert('Please fill out the question text and all four options.');
            return;
        }
        onSave(question);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSave} className="space-y-6">
                    <h3 className="text-2xl font-bold text-white">{isNew ? 'Add New Question' : 'Edit Question'}</h3>
                    <div>
                        <label htmlFor="questionText" className="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
                        <textarea
                            id="questionText"
                            value={question.questionText}
                            onChange={handleTextChange}
                            rows={3}
                            className="w-full bg-gray-700 rounded-md p-2 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Options & Correct Answer</label>
                        <div className="space-y-3">
                            {question.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={question.correctAnswerIndex === index}
                                        onChange={() => handleCorrectAnswerChange(index)}
                                        className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-500 bg-gray-600"
                                    />
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="w-full bg-gray-700 rounded-md p-2 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={`Option ${index + 1}`}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="py-2 px-6 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">
                            Save Question
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            active
                ? 'bg-gray-800 text-blue-300 border-b-2 border-blue-400'
                : 'text-gray-400 hover:bg-gray-700/50'
        }`}
    >
        {children}
    </button>
);


const AdminDashboard: React.FC = () => {
    const { 
        isQuizOpen, 
        toggleQuizStatus, 
        quizQuestions, 
        registrations, 
        submissions, 
        setQuizQuestions, 
        getParticipantName,
        logoutAdmin
    } = useAppContext();
    
    const [activeTab, setActiveTab] = useState('summary');
    const [topic, setTopic] = useState('Solar System Planets');
    const [numQuestions, setNumQuestions] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

    const handleGenerateQuiz = async () => {
        setIsLoading(true);
        setError('');
        try {
            const questions: Question[] = await generateQuizQuestions(topic, numQuestions);
            setQuizQuestions(questions);
            alert('New quiz generated successfully!');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEditModal = (question: Question, index: number) => {
        setEditingQuestion({ ...question, options: [...question.options] });
        setEditingQuestionIndex(index);
        setIsModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingQuestion({ questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 });
        setEditingQuestionIndex(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingQuestion(null);
        setEditingQuestionIndex(null);
    };

    const handleSaveQuestion = (question: Question) => {
        const newQuestions = [...quizQuestions];
        if (editingQuestionIndex !== null) {
            newQuestions[editingQuestionIndex] = question;
        } else {
            newQuestions.push(question);
        }
        setQuizQuestions(newQuestions);
        handleCloseModal();
    };

    const handleDeleteQuestion = (index: number) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            const newQuestions = quizQuestions.filter((_, i) => i !== index);
            setQuizQuestions(newQuestions);
        }
    };
    
    const averageScore = submissions.length > 0
        ? (submissions.reduce((acc, sub) => acc + sub.score, 0) / submissions.length).toFixed(2)
        : 'N/A';

    const renderTabContent = () => {
        switch (activeTab) {
            case 'summary':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Stats */}
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-center items-center">
                                <h3 className="text-5xl font-bold text-blue-400">{registrations.length}</h3>
                                <p className="text-gray-400 mt-2">Total Registrations</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-center items-center">
                                <h3 className="text-5xl font-bold text-blue-400">{submissions.length}</h3>
                                <p className="text-gray-400 mt-2">Total Submissions</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg flex flex-col justify-center items-center">
                                <h3 className="text-5xl font-bold text-blue-400">{averageScore}</h3>
                                <p className="text-gray-400 mt-2">Average Score</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3 text-blue-300">Quiz Status</h3>
                                <button onClick={toggleQuizStatus} className={`w-full px-6 py-3 font-bold rounded-md transition-colors ${isQuizOpen ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                    Submissions are {isQuizOpen ? 'OPEN - Click to Close' : 'CLOSED - Click to Open'}
                                </button>
                            </div>
                             <div className="bg-gray-800 p-6 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3 text-blue-300">AI Quiz Generator</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                                        <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-300 mb-1">Number of Questions</label>
                                        <input type="number" id="numQuestions" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-full bg-gray-700 rounded-md p-2 text-white border border-gray-600 focus:ring-blue-500 focus:border-blue-500"/>
                                    </div>
                                    <button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full py-3 font-bold bg-blue-600 hover:bg-blue-500 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed">
                                        {isLoading ? 'Generating...' : 'Generate New Quiz'}
                                    </button>
                                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'submissions':
                return (
                     <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-gray-800">
                                    <tr>
                                        <th className="p-3 border-b border-gray-700">Participant</th>
                                        <th className="p-3 border-b border-gray-700">Score</th>
                                        <th className="p-3 border-b border-gray-700">Submitted At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.length > 0 ? submissions.map(sub => (
                                        <tr key={sub.registrationId} className="hover:bg-gray-700/50">
                                            <td className="p-3 border-b border-gray-700/50">{getParticipantName(sub.registrationId)}</td>
                                            <td className="p-3 border-b border-gray-700/50">{sub.score} / {quizQuestions.length}</td>
                                            <td className="p-3 border-b border-gray-700/50">{new Date(sub.submittedAt).toLocaleString()}</td>
                                        </tr>
                                    )) : <tr><td colSpan={3} className="text-center p-4 text-gray-400">No submissions yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'registrations':
                 return (
                     <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="max-h-[60vh] overflow-y-auto">
                           <table className="w-full text-left">
                                <thead className="sticky top-0 bg-gray-800">
                                    <tr>
                                        <th className="p-3 border-b border-gray-700">Name</th>
                                        <th className="p-3 border-b border-gray-700">Email</th>
                                        <th className="p-3 border-b border-gray-700">Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.length > 0 ? registrations.map(reg => (
                                        <tr key={reg.id} className="hover:bg-gray-700/50">
                                            <td className="p-3 border-b border-gray-700/50">{reg.name}</td>
                                            <td className="p-3 border-b border-gray-700/50">{reg.email}</td>
                                            <td className="p-3 border-b border-gray-700/50 font-mono">{reg.password}</td>
                                        </tr>
                                    )) : <tr><td colSpan={3} className="text-center p-4 text-gray-400">No registrations yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'quiz':
                return (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-blue-300">Manage Quiz Questions</h3>
                            <button onClick={handleOpenAddModal} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                <span>Add New Question</span>
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-6">
                           {quizQuestions.length > 0 ? quizQuestions.map((q, qIndex) => (
                               <div key={qIndex} className="border-b border-gray-700 pb-4">
                                   <div className="flex justify-between items-start">
                                       <h4 className="font-bold text-lg text-blue-300 mb-2">Q{qIndex + 1}: {q.questionText}</h4>
                                       <div className="flex space-x-2 flex-shrink-0 ml-4">
                                            <button onClick={() => handleOpenEditModal(q, qIndex)} className="text-yellow-400 hover:text-yellow-300 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                            <button onClick={() => handleDeleteQuestion(qIndex)} className="text-red-500 hover:text-red-400 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                       </div>
                                   </div>
                                   <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
                                       {q.options.map((opt, oIndex) => (
                                           <li key={oIndex} className={`${oIndex === q.correctAnswerIndex ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
                                               {opt} {oIndex === q.correctAnswerIndex && '(Correct)'}
                                           </li>
                                       ))}
                                   </ul>
                               </div>
                           )) : <p className="text-center text-gray-400 py-8">No quiz questions have been generated or added yet. Go to the Summary tab to generate a quiz with AI, or click 'Add New Question'.</p>}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="text-white min-h-screen bg-gray-900 p-4 sm:p-8">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 pb-4 border-b border-gray-700">
                <h1 className="text-4xl font-bold mb-4 sm:mb-0">Admin Dashboard</h1>
                <button onClick={logoutAdmin} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors self-start sm:self-center">Logout</button>
            </header>

            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                   <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Summary</TabButton>
                   <TabButton active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')}>Submissions ({submissions.length})</TabButton>
                   <TabButton active={activeTab === 'registrations'} onClick={() => setActiveTab('registrations')}>Registrations ({registrations.length})</TabButton>
                   <TabButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')}>Quiz Questions ({quizQuestions.length})</TabButton>
                </nav>
            </div>
            
            <main>
                {renderTabContent()}
            </main>

            {isModalOpen && editingQuestion && (
                <QuestionEditModal 
                    question={editingQuestion}
                    onSave={handleSaveQuestion}
                    onClose={handleCloseModal}
                    isNew={editingQuestionIndex === null}
                />
            )}
        </div>
    );
};

const AdminPage: React.FC = () => {
    const { isAdmin, loginAdmin } = useAppContext();

    if (!isAdmin) {
        return <AdminLoginPage onLogin={loginAdmin} />;
    }

    return <AdminDashboard />;
};

export default AdminPage;
