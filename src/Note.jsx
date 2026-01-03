import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import html2pdf from 'html2pdf.js'
import Navbar from './Navbar/index'
import Footer from './components/Footer/Footer'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function Note() {
    // Animation state
    const [isVisible, setIsVisible] = useState(false);

    // Logic state
    const [topic, setTopic] = useState(() => localStorage.getItem('lastTopic') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false); // Copy state
    const [recentNotes, setRecentNotes] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('recentNotes')) || [];
        } catch (e) {
            return [];
        }
    });

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

    const handleGenerate = async (targetTopic = topic) => {
        const topicToUse = targetTopic.trim();
        if (!topicToUse) return;

        console.log("Using API Key:", API_KEY ? `...${API_KEY.slice(-4)}` : "UNDEFINED");

        if (!API_KEY) {
            setError("API Key is missing. Please ensure VITE_GEMINI_API_KEY is set in .env.local and server is restarted.");
            return;
        }

        setIsLoading(true);
        setStory(null);
        setError(null);
        setTopic(topicToUse);
        localStorage.setItem('lastTopic', topicToUse);

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
                                        text: `Create a comprehensive "Crash Course" on "${topicToUse}". Break it down into 3-5 key concepts using clear, engaging language suitable for a beginner. \n\nCrucially, end with a specific section titled "Recommended Resources" containing 3 unique, high-quality resources (books, videos, or websites) to learn more about ${topicToUse}.`
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
                const content = data.candidates[0].content.parts[0].text;
                setStory(content);

                // Update recent notes
                setRecentNotes(prev => {
                    const filtered = prev.filter(note => note.topic.toLowerCase() !== topicToUse.toLowerCase());
                    const newRecent = [{ topic: topicToUse, content }, ...filtered].slice(0, 5);
                    localStorage.setItem('recentNotes', JSON.stringify(newRecent));
                    return newRecent;
                });
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

    const handleRecentClick = (note) => {
        setTopic(note.topic);
        setStory(note.content);
        localStorage.setItem('lastTopic', note.topic);
        setError(null);
    };

    const handleExportPDF = () => {
        if (!story) return;

        const element = document.getElementById('note-content');
        const opt = {
            margin: [15, 15],
            filename: `CrashCourse_${topic.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Temporary style for PDF generation to ensure readability
        const originalStyle = element.style.cssText;
        element.style.color = '#333333';
        element.style.background = '#ffffff';
        element.style.padding = '20px';

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.cssText = originalStyle;
        });
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
                        <Navbar.Link to="/contact">Contact Us</Navbar.Link>
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
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px',
                            maxWidth: '600px',
                            margin: '0 auto',
                            alignItems: 'stretch'
                        }}>
                            <input
                                type="text"
                                placeholder="Enter a topic (e.g., Quantum Physics...)"
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
                                onClick={() => handleGenerate()}
                                disabled={isLoading || !topic.trim()}
                                style={{
                                    padding: '15px 30px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: isLoading ? 'wait' : 'pointer',
                                    opacity: isLoading || !topic.trim() ? 0.7 : 1,
                                    transition: 'all 0.3s ease',
                                    alignSelf: 'center',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                            >
                                {isLoading ? 'Thinking...' : 'Start Crash Course'}
                            </button>
                        </div>

                        {/* Recent Notes Section */}
                        {recentNotes.length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>Recently Viewed:</p>
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    justifyContent: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    {recentNotes.map((note, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleRecentClick(note)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '20px',
                                                color: 'var(--text-main)',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                        >
                                            {note.topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
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
                                <div style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    display: 'flex',
                                    gap: '10px'
                                }}>
                                    <button
                                        onClick={handleExportPDF}
                                        style={{
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
                                        title="Export to PDF"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        <span style={{ fontSize: '0.9rem' }}>PDF</span>
                                    </button>

                                    <button
                                        onClick={handleCopy}
                                        style={{
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
                                            <>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                <span style={{ fontSize: '0.9rem' }}>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
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
                                <div id="note-content" style={{ lineHeight: '1.8', fontSize: '1.2rem', textAlign: 'left' }}>
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
