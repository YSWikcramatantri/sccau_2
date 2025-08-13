
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from '@google/genai';
import { db, Question, Submission } from './db';

const app = express();
const port = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cookieParser());

// In-memory session store (for simplicity)
const sessions: Record<string, { userId: string, role: 'participant' | 'admin' }> = {};

// Custom auth middleware
const auth = (roles: Array<'participant' | 'admin'>) => (req: Request, res: Response, next: NextFunction) => {
    const sessionId = (req as any).cookies.sessionId;
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    const session = sessions[sessionId];
    if (!roles.includes(session.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Attach user info to request object
    (req as any).user = { id: session.userId, role: session.role };
    next();
};

// --- API ROUTES ---

// --- PUBLIC ROUTES ---

// Get public state (quiz questions for participants, quiz open status)
app.get('/api/state', (req: Request, res: Response) => {
    res.json({
        isQuizOpen: db.isQuizOpen,
        quizQuestions: db.quizQuestions.map(q => ({ // Don't send correct answers to clients
            questionText: q.questionText,
            options: q.options,
        })),
    });
});

// Check current session status
app.get('/api/session', (req: Request, res: Response) => {
    const sessionId = (req as any).cookies.sessionId;
    if (sessionId && sessions[sessionId]) {
        const session = sessions[sessionId];
        if (session.role === 'admin') {
            return res.json({ loggedIn: true, isAdmin: true });
        }
        return res.json({ loggedIn: true, participantId: session.userId });
    }
    return res.json({ loggedIn: false });
});

// Register a new participant
app.post('/api/register', (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }
    if (db.registrations.some(r => r.email === email)) {
        return res.status(409).json({ message: 'This email has already been registered.' });
    }

    const prefixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let prefix = '';
    for (let i = 0; i < 3; i++) {
        prefix += prefixChars.charAt(Math.floor(Math.random() * prefixChars.length));
    }
    const suffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const password = `${prefix}-${suffix}`;
    
    const newRegistration = { id: `reg-${Date.now()}`, name, email, password };
    db.registrations.push(newRegistration);

    res.status(201).json({ password });
});

// Login for participants
app.post('/api/login/participant', (req: Request, res: Response) => {
    const { password } = req.body;
    const registration = db.registrations.find(r => r.password === password);

    if (!registration) {
        return res.status(401).json({ message: 'Invalid password.' });
    }
    if (db.submissions.some(s => s.registrationId === registration.id)) {
        return res.status(403).json({ message: 'This password has already been used to submit a quiz.' });
    }
    if (!db.isQuizOpen) {
        return res.status(403).json({ message: 'Submissions are currently closed.' });
    }

    const sessionId = `sess-${Date.now()}${Math.random()}`;
    sessions[sessionId] = { userId: registration.id, role: 'participant' };
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' } as any).json({ participantId: registration.id });
});

// Login for admins
app.post('/api/login/admin', (req: Request, res: Response) => {
    const { password } = req.body;
    if (password !== db.adminPasswordHash) {
        return res.status(401).json({ message: 'Invalid password.' });
    }

    const sessionId = `sess-admin-${Date.now()}${Math.random()}`;
    sessions[sessionId] = { userId: 'admin', role: 'admin' };
    res.cookie('sessionId', sessionId, { httpOnly: true, sameSite: 'strict' } as any).json({ message: 'Admin login successful.' });
});

// Logout
app.post('/api/logout', (req: Request, res: Response) => {
    const sessionId = (req as any).cookies.sessionId;
    if (sessionId && sessions[sessionId]) {
        delete sessions[sessionId];
    }
    res.clearCookie('sessionId').json({ message: 'Logged out successfully.' });
});

// --- PARTICIPANT-ONLY ROUTES ---

// Submit a quiz
app.post('/api/submit', auth(['participant']), (req: Request, res: Response) => {
    const participantId = (req as any).user.id;
    const { answers } = req.body;

    if (db.submissions.some(s => s.registrationId === participantId)) {
        return res.status(403).json({ message: 'You have already submitted this quiz.' });
    }

    const score = answers.reduce((acc: number, answer: number | null, index: number) => {
        if (db.quizQuestions[index] && answer === db.quizQuestions[index].correctAnswerIndex) {
            return acc + 1;
        }
        return acc;
    }, 0);

    const newSubmission: Submission = {
        registrationId: participantId,
        answers,
        score,
        submittedAt: new Date().toISOString(),
    };
    db.submissions.push(newSubmission);
    
    const sessionId = (req as any).cookies.sessionId;
    if (sessionId) delete sessions[sessionId];
    res.clearCookie('sessionId').status(201).json({ message: 'Submission successful!' });
});


// --- ADMIN-ONLY ROUTES ---

// Get all admin data
app.get('/api/admin/data', auth(['admin']), (req: Request, res: Response) => {
    res.json({
        registrations: db.registrations,
        submissions: db.submissions,
        quizQuestions: db.quizQuestions,
    });
});

// Toggle quiz status
app.put('/api/admin/quiz/status', auth(['admin']), (req: Request, res: Response) => {
    db.isQuizOpen = !db.isQuizOpen;
    res.json({ message: `Quiz is now ${db.isQuizOpen ? 'OPEN' : 'CLOSED'}` , isQuizOpen: db.isQuizOpen });
});

// Update quiz questions manually
app.put('/api/admin/quiz/questions', auth(['admin']), (req: Request, res: Response) => {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
        return res.status(400).json({ message: 'Request body must include an array of questions.' });
    }
    db.quizQuestions = questions;
    res.json({ message: 'Quiz questions updated successfully.' });
});

// Generate quiz with AI
app.post('/api/admin/quiz/generate', auth(['admin']), async (req: Request, res: Response) => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ message: 'API_KEY environment variable is not set on the server.' });
    }
    
    try {
        const { topic, count } = req.body;
        if (!topic || !count) {
            return res.status(400).json({ message: 'Topic and count are required.' });
        }
        
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const quizSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    questionText: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswerIndex: { type: Type.INTEGER },
                },
                required: ["questionText", "options", "correctAnswerIndex"],
            },
        };
        
        const prompt = `Generate a ${count}-question multiple-choice quiz about "${topic}". Difficulty: astronomy enthusiasts. For each question: question text, exactly 4 options, and the 0-based index of the correct answer.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: quizSchema },
        });

        const questions = JSON.parse(response.text.trim());
        db.quizQuestions = questions as Question[];
        res.json({ message: 'Quiz generated successfully.', questions });

    } catch (error) {
        console.error("Error generating quiz with AI:", error);
        res.status(500).json({ message: 'Failed to generate quiz.', details: (error as Error).message });
    }
});


// --- PRODUCTION STATIC FILE SERVING ---
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../../dist');
    app.use(express.static(clientBuildPath));
    
    // For any other request, serve the index.html file
    app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
