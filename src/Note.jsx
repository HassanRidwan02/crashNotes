import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import Navbar from './Navbar/index'
import Footer from './components/Footer/Footer'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function Note() {
    // Animation state
    const [isVisible, setIsVisible] = useState(false);

    // Logic state
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false); // Copy state

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopy = async () => {
        if (!story) return;
        try {
            await navigator.clipboard.writeText(story);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    };

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setStory(null);
        setError(null);

        try {
            // We use direct fetch to avoid "node_modules" caching issues with the SDK
            // We try different models via the URL if one fails
            const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

            let data = null;
            let success = false;
            let lastErr = null;

            for (const model of models) {
                try {
                    console.log(`Trying via fetch: ${model}`);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `Create a comprehensive "Crash Course" on "${topic}". Break it down into 3-5 key concepts using clear, engaging language suitable for a beginner. \n\nCrucially, end with a specific section titled "Recommended Resources" containing 3 unique, high-quality resources (books, videos, or websites) to learn more about ${topic}.`
                                    }]
                                }]
                            })
                        }
                    );

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error?.message || response.statusText);
                    }

                    data = await response.json();
                    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        success = true;
                        break;
                    }
                } catch (e) {
                    console.warn(`Model ${model} failed`, e);
                    lastErr = e;
                    continue;
                }
            }

            if (success) {
                setStory(data.candidates[0].content.parts[0].text);
            } else {
                throw lastErr || new Error("Failed to generate content");
            }

        } catch (err) {
            console.error(err);
            setError(`Failed to generate story. Error: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-dark)',
            color: 'var(--text-main)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Gradients */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                opacity: 0.15,
                filter: 'blur(80px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
                opacity: 0.15,
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Navbar>
                    <Navbar.Logo>crashNotes</Navbar.Logo>
                    <Navbar.Links>
                        <Navbar.Link to="/">Home</Navbar.Link>
                        <Navbar.Link to="/about">About</Navbar.Link>
                    </Navbar.Links>
                </Navbar>

                <main style={{
                    maxWidth: '800px',
                    margin: '40px auto',
                    padding: '0 20px',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
                }}>
                    {/* Input Section */}
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h1 style={{
                            fontSize: '3rem',
                            fontWeight: '800',
                            marginBottom: '20px',
                            background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            What do you want to learn?
                        </h1>

                        {error && (
                            <div style={{
                                color: '#ef4444',
                                marginBottom: '20px',
                                fontSize: '0.9rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '10px',
                                borderRadius: '8px',
                                display: 'inline-block'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{
                            position: 'relative',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            <input
                                type="text"
                                placeholder="Enter a topic (e.g., Quantum Physics..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '20px 30px',
                                    borderRadius: '50px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--glass-bg)',
                                    backdropFilter: 'blur(var(--glass-blur))',
                                    color: 'var(--text-main)',
                                    fontSize: '1.2rem',
                                    outline: 'none',
                                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary), 0 8px 32px 0 rgba(0, 0, 0, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.2)';
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            />

                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !topic.trim()}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    padding: '12px 30px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '40px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: isLoading ? 'wait' : 'pointer',
                                    opacity: isLoading || !topic.trim() ? 0.7 : 1,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isLoading ? 'Thinking...' : 'Start Crash Course'}
                            </button>
                        </div>
                    </div>

                    {/* Result Section */}
                    {(story || isLoading) && (
                        <div style={{
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            backdropFilter: 'blur(var(--glass-blur))',
                            borderRadius: '24px',
                            padding: '40px',
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                            animation: 'fadeIn 0.5s ease-out',
                            position: 'relative' // For absolute positioning of copy button
                        }}>
                            {!isLoading && story && (
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        color: 'var(--text-main)',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                    title="Copy Story"
                                >
                                    {copied ? (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4ade80' }}>
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            <span style={{ fontSize: '0.9rem', color: '#4ade80' }}>Copied!</span>
                                        </>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                        </svg>
                                    )}
                                </button>
                            )}
                            {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div className="pulsing-orb" style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'radial-gradient(circle, var(--primary), var(--secondary))',
                                        borderRadius: '50%',
                                        margin: '0 auto',
                                        animation: 'pulse 1.5s infinite ease-in-out'
                                    }} />
                                    <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Hey! I am working on it...</p>
                                </div>
                            ) : (
                                <div style={{ lineHeight: '1.8', fontSize: '1.2rem', textAlign: 'left' }}>
                                    <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Crash course on {topic}</h2>
                                    <ReactMarkdown
                                        components={{
                                            h3: ({ node, ...props }) => <h3 style={{ color: 'var(--secondary)', marginTop: '25px', marginBottom: '15px' }} {...props} />,
                                            strong: ({ node, ...props }) => <strong style={{ color: 'var(--primary)', fontWeight: '700' }} {...props} />,
                                            ul: ({ node, ...props }) => <ul style={{ paddingLeft: '25px', marginBottom: '20px' }} {...props} />,
                                            li: ({ node, ...props }) => <li style={{ marginBottom: '10px' }} {...props} />,
                                            a: ({ node, ...props }) => <a style={{ color: 'var(--primary)', textDecoration: 'underline' }} {...props} />,
                                            p: ({ node, ...props }) => <p style={{ marginBottom: '15px' }} {...props} />
                                        }}
                                    >
                                        {story}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}
                </main>
                <Footer />
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
