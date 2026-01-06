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

    // TTS State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [utterance, setUtterance] = useState(null);

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
            let textToCopy = "";
            if (typeof story === 'string') {
                textToCopy = story;
            } else {
                textToCopy += `# ${story.title || 'Course'}\n\n`;
                textToCopy += `${story.overview}\n\n`;
                story.sections?.forEach(s => {
                    textToCopy += `## ${s.heading}\n${s.content}\n\n`;
                });
                if (story.resources) {
                    textToCopy += `## Recommended Resources\n`;
                    story.resources.forEach(r => {
                        textToCopy += `- [${r.name}](${r.url})\n`;
                    });
                }
            }

            await navigator.clipboard.writeText(textToCopy);
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
                                        text: `Create a comprehensive "Crash Course" on "${topicToUse}". Return the result STRICTLY as valid JSON with the following structure:
{
  "title": "Course Title (string)",
  "overview": "Brief introduction (string)",
  "sections": [
    { "heading": "Section Heading (string)", "content": "Detailed explanation (string, markdown allowed)" }
  ],
  "resources": [
    { "name": "Resource Name", "url": "URL or description" }
  ]
}
Do not return any markdown formatting outside the JSON structure. just return the JSON object.`
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
                let content = data.candidates[0].content.parts[0].text;

                // Try to parse as JSON
                try {
                    // Remove code blocks if present
                    const jsonStr = content.replace(/```json\n?|\n?```/g, '');
                    content = JSON.parse(jsonStr);
                } catch (e) {
                    console.warn("Failed to parse response as JSON, using raw text", e);
                    // content remains string
                }

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
        if (!element) return;

        const opt = {
            margin: [15, 15],
            filename: `CrashCourse_${topic.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const originalStyle = element.style.cssText;
        element.style.color = '#333333';
        element.style.background = '#ffffff';
        element.style.padding = '20px';

        // Ensure all details are open for PDF
        const details = element.querySelectorAll('details');
        details.forEach(d => d.setAttribute('open', 'true'));

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.cssText = originalStyle;
        });
    };

    // TTS Handlers
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const handleSpeak = () => {
        if (!story) return;

        // Build text for speech
        let cleanText = "";

        if (typeof story === 'string') {
            cleanText = story;
        } else {
            // Build text from object
            cleanText += (story.title || "") + ". ";
            cleanText += (story.overview || "") + ". ";
            story.sections?.forEach(s => {
                cleanText += (s.heading || "") + ". ";
                cleanText += (s.content || "") + ". ";
            });
        }

        // Clean text for speech
        cleanText = cleanText
            .replace(/[*#`]/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1');

        const u = new SpeechSynthesisUtterance(cleanText);
        u.pitch = 1;
        u.rate = 1;
        u.volume = 1;

        u.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };

        u.onerror = (e) => {
            console.error('Speech error', e);
            setIsSpeaking(false);
            setIsPaused(false);
        };

        setUtterance(u);
        window.speechSynthesis.cancel(); // Stop any previous
        window.speechSynthesis.speak(u);
        setIsSpeaking(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        if (window.speechSynthesis.speaking) {
            if (isPaused) {
                window.speechSynthesis.resume();
                setIsPaused(false);
            } else {
                window.speechSynthesis.pause();
                setIsPaused(true);
            }
        }
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
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
                                placeholder="Enter course name or topic (e.g. Data Structures)"
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
                                {isLoading ? 'Thinking...' : 'Generate Crash Notes'}
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

                            {!isLoading && story && (
                                <div style={{ marginBottom: '30px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                    {/* TTS Controls */}
                                    {!isSpeaking ? (
                                        <button
                                            onClick={handleSpeak}
                                            style={{
                                                padding: '12px 24px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: 'var(--text-main)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '15px',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                            title="Listen to Note"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                            </svg>
                                            Listen
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handlePause}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    color: 'var(--text-main)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '15px',
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                                title={isPaused ? "Resume" : "Pause"}
                                            >
                                                {isPaused ? (
                                                    <>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                        </svg>
                                                        Resume
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="6" y="4" width="4" height="16"></rect>
                                                            <rect x="14" y="4" width="4" height="16"></rect>
                                                        </svg>
                                                        Pause
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleStop}
                                                style={{
                                                    padding: '12px 24px',
                                                    background: 'rgba(239, 68, 68, 0.2)', // Red tint
                                                    color: '#fca5a5',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '15px',
                                                    fontSize: '1rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                                title="Stop Speaking"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                </svg>
                                                Stop
                                            </button>
                                        </>

                                    )}
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
                            ) : null}

                            {!isLoading && story && (
                                <div id="note-content" style={{ display: 'block', textAlign: 'left' }}>
                                    {typeof story === 'string' ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ marginBottom: '10px', color: 'var(--primary)', fontSize: '2.5rem', fontWeight: '800' }}>{story.title}</h2>
                                            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>{story.overview}</p>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {story.sections?.map((section, idx) => (
                                                    <details key={idx} open style={{
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        border: '1px solid var(--glass-border)',
                                                        borderRadius: '20px',
                                                        overflow: 'hidden',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        <summary style={{
                                                            padding: '25px',
                                                            cursor: 'pointer',
                                                            fontSize: '1.4rem',
                                                            fontWeight: '700',
                                                            color: 'var(--secondary)',
                                                            outline: 'none',
                                                            listStyle: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            userSelect: 'none'
                                                        }}>
                                                            {section.heading}
                                                            <span style={{ fontSize: '1rem', opacity: 0.7 }}>▼</span>
                                                        </summary>
                                                        <div style={{ padding: '0 25px 30px 25px', lineHeight: '1.8', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                                                            <ReactMarkdown
                                                                components={{
                                                                    strong: ({ node, ...props }) => <strong style={{ color: 'var(--primary)', fontWeight: '700' }} {...props} />,
                                                                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '20px', marginBottom: '10px' }} {...props} />,
                                                                    li: ({ node, ...props }) => <li style={{ marginBottom: '8px' }} {...props} />,
                                                                }}
                                                            >
                                                                {section.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>

                                            {story.resources && (
                                                <div style={{ marginTop: '50px' }}>
                                                    <h3 style={{ color: 'var(--accent)', marginBottom: '25px', fontSize: '1.5rem' }}>Recommended Resources</h3>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                                        {story.resources.map((res, idx) => (
                                                            <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                padding: '20px',
                                                                background: 'rgba(255, 255, 255, 0.05)',
                                                                border: '1px solid var(--glass-border)',
                                                                borderRadius: '16px',
                                                                color: 'var(--text-main)',
                                                                textDecoration: 'none',
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(-5px)'; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                            >
                                                                <span style={{ fontWeight: '700', marginBottom: '8px', fontSize: '1.1rem' }}>{res.name}</span>
                                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>View Resource →</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}


                        </div>
                    )}
                </main>
                <Footer />
            </div >

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
        </div >
    )
}
