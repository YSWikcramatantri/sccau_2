import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { RocketIcon, StarIcon, TelescopeIcon } from './icons';

const Header: React.FC = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/sivali-admin-portal');

    if (isAdminRoute) return null;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-blue-500/30">
            <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                <NavLink to="/" className="flex items-center space-x-2 text-xl font-bold text-white hover:text-blue-300 transition-colors">
                    <TelescopeIcon className="w-8 h-8 text-blue-400" />
                    <span>Sivali Astronomy Union</span>
                </NavLink>
                <div className="flex items-center space-x-6">
                    <NavLink to="/" className={({ isActive }) => `text-lg transition-colors ${isActive ? 'text-blue-300' : 'text-gray-300 hover:text-white'}`}>Home</NavLink>
                    <NavLink to="/register" className={({ isActive }) => `text-lg transition-colors ${isActive ? 'text-blue-300' : 'text-gray-300 hover:text-white'}`}>Register</NavLink>
                    <NavLink to="/quiz" className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-full transition-transform transform hover:scale-105">
                        <StarIcon className="w-5 h-5" />
                        <span>Take Quiz</span>
                    </NavLink>
                </div>
            </nav>
        </header>
    );
};


const Footer: React.FC = () => {
     const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/sivali-admin-portal');

    if (isAdminRoute) return null;

    return (
        <footer className="bg-black/20 mt-16 py-6 text-center text-gray-400 border-t border-blue-500/20">
            <p>&copy; {new Date().getFullYear()} Sivali Astronomy Union. All rights reserved.</p>
            <p className="text-sm">Exploring the cosmos, together.</p>
        </footer>
    );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-gray-100 font-sans">
             <div className="absolute inset-0 z-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
             <div className="relative z-10">
                <Header />
                <main className="pt-24 pb-8 container mx-auto px-6">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Layout;