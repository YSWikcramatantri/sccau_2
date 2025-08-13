import React from 'react';
import { NavLink } from 'react-router-dom';
import { TelescopeIcon, UsersIcon, BookOpenIcon, RocketIcon } from './icons';

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6 transform hover:-translate-y-2 transition-transform duration-300">
        <div className="flex items-center space-x-4 mb-3">
            <div className="text-blue-400">{icon}</div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300">{children}</p>
    </div>
);

const HomePage: React.FC = () => {
    return (
        <div className="space-y-16 animate-fade-in">
            <section className="text-center py-20">
                <img src={`https://picsum.photos/1200/400?random=1&grayscale&blur=2`} alt="Nebula" className="absolute top-0 left-0 w-full h-full object-cover opacity-20 z-0"/>
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-4" style={{textShadow: '0 0 15px rgba(79, 70, 229, 0.7)'}}>
                        Sivali Astronomy Union
                    </h1>
                    <p className="max-w-3xl mx-auto text-xl text-gray-300 mb-8">
                        Your gateway to the stars. Join our community of explorers, learners, and dreamers as we unravel the mysteries of the cosmos.
                    </p>
                    <NavLink
                        to="/register"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-full hover:bg-indigo-500 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-indigo-600/40"
                    >
                        <RocketIcon className="w-6 h-6 mr-3" />
                        Join the Next Quiz!
                    </NavLink>
                </div>
            </section>

            <section className="grid md:grid-cols-3 gap-8">
                <InfoCard icon={<TelescopeIcon className="w-10 h-10" />} title="Our Mission">
                    To foster a passion for astronomy through observation, education, and community engagement. We aim to make the wonders of the universe accessible to everyone.
                </InfoCard>
                <InfoCard icon={<UsersIcon className="w-10 h-10" />} title="Our Community">
                    We are a diverse group of students, hobbyists, and professionals united by our curiosity. We host regular stargazing nights, workshops, and lectures.
                </InfoCard>
                <InfoCard icon={<BookOpenIcon className="w-10 h-10" />} title="Educational Outreach">
                    Knowledge is meant to be shared. Our outreach programs bring the excitement of astronomy to local schools and public events, inspiring the next generation.
                </InfoCard>
            </section>

            <section className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-400/30 rounded-lg p-8">
                    <h2 className="text-3xl font-bold mb-4 text-white">Featured Gallery</h2>
                    <p className="text-gray-300 mb-6">
                        Discover breathtaking images captured by our members. From distant galaxies to planetary close-ups, our gallery showcases the beauty of the night sky.
                    </p>
                    <button className="text-white font-bold hover:underline">
                        Explore Gallery &rarr;
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <img src="https://picsum.photos/300/300?random=2" alt="Galaxy" className="rounded-lg shadow-lg hover:opacity-80 transition-opacity" />
                    <img src="https://picsum.photos/300/300?random=3" alt="Planet" className="rounded-lg shadow-lg hover:opacity-80 transition-opacity" />
                    <img src="https://picsum.photos/300/300?random=4" alt="Nebula" className="rounded-lg shadow-lg hover:opacity-80 transition-opacity" />
                    <img src="https://picsum.photos/300/300?random=5" alt="Star Cluster" className="rounded-lg shadow-lg hover:opacity-80 transition-opacity" />
                </div>
            </section>
        </div>
    );
};

export default HomePage;
