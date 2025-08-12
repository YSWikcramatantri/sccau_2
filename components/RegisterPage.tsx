
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [error, setError] = useState('');
    const { addRegistration, registrations } = useAppContext();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email) {
            setError('Please fill in both name and email.');
            return;
        }
        if (registrations.some(r => r.email === email)) {
            setError('This email has already been registered.');
            return;
        }
        
        const password = addRegistration({ name, email });
        setGeneratedPassword(password);
        setName('');
        setEmail('');
    };

    const copyToClipboard = () => {
        if(generatedPassword) {
            navigator.clipboard.writeText(generatedPassword);
            alert("Password copied to clipboard!");
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-gray-800/60 backdrop-blur-md border border-blue-500/40 rounded-xl p-8 shadow-2xl shadow-blue-900/20">
                <h2 className="text-4xl font-bold text-center text-white mb-2">Quiz Registration</h2>
                <p className="text-center text-gray-300 mb-8">Register to participate in our next astronomy quiz!</p>
                
                {generatedPassword ? (
                    <div className="text-center bg-green-900/50 border border-green-500 rounded-lg p-6">
                        <h3 className="text-2xl font-bold text-green-300 mb-2">Registration Successful!</h3>
                        <p className="text-gray-200 mb-4">Please save your unique password. You will need it to log in and take the quiz.</p>
                        <div className="bg-gray-900 rounded-md p-4 flex items-center justify-between">
                            <span className="text-2xl font-mono text-yellow-300 tracking-widest">{generatedPassword}</span>
                            <button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors">Copy</button>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">You can now proceed to the quiz login page.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g., Galileo Galilei"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 px-4 text-lg font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-600/40"
                        >
                            Generate My Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
