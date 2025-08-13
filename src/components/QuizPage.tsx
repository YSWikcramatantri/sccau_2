import React, { useState, useEffect } from 'react';
// Use useNavigate for v6/v7 compatibility
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

const QuizPage: React.FC = () => {
    const { quizQuestions, currentParticipantId, addSubmission, logout } = useAppContext();
    // Use useNavigate hook
    const navigate = useNavigate();
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [quizFinished, setQuizFinished] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!currentParticipantId) {
            navigate('/quiz');
        } else if (quizQuestions.length > 0) {
            setAnswers(Array(quizQuestions.length).fill(null));
        }
    }, [currentParticipantId, quizQuestions, navigate]);

    const handleAnswerSelect = (optionIndex: number) => {
        setAnswers(prev => {
            const newAnswers = [...prev];
            newAnswers[currentQuestionIndex] = optionIndex;
            return newAnswers;
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (window.confirm("Are you sure you want to submit your answers? This action cannot be undone.")) {
            if (currentParticipantId) {
                setIsSubmitting(true);
                try {
                    await addSubmission({ registrationId: currentParticipantId, answers });
                    setQuizFinished(true);
                    setTimeout(async () => {
                        await logout();
                        navigate('/');
                    }, 3000);
                } catch (error) {
                    console.error("Failed to submit quiz", error);
                    alert("There was an error submitting your quiz. Please try again.");
                    setIsSubmitting(false);
                }
            }
        }
    };

    if (quizFinished) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <div className="bg-gray-800/60 backdrop-blur-md border border-green-500/40 rounded-xl p-8 shadow-2xl shadow-green-900/20">
                    <h2 className="text-4xl font-bold text-green-300 mb-4">Submission Successful!</h2>
                    <p className="text-xl text-gray-200">Your answers have been recorded. Thank you for participating.</p>
                     <p className="text-gray-400 mt-4">Redirecting to the homepage in a few seconds...</p>
                </div>
            </div>
        );
    }
    
    if (quizQuestions.length === 0) {
        return <div className="text-center text-2xl">Loading quiz... Please wait.</div>;
    }

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/60 backdrop-blur-md border border-blue-500/40 rounded-xl p-8 shadow-2xl shadow-blue-900/20">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-blue-300">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        <span className="text-sm font-medium text-blue-300">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Question */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white leading-tight">{currentQuestion.questionText}</h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                                answers[currentQuestionIndex] === index
                                    ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-lg'
                                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-blue-500'
                            }`}
                        >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                            {option}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="mt-10 flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={currentQuestionIndex === 0}
                        className="py-2 px-6 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>
                    
                    {currentQuestionIndex === quizQuestions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="py-3 px-8 text-lg font-bold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors shadow-lg shadow-green-600/30 disabled:bg-gray-600 disabled:cursor-wait"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="py-2 px-6 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;
