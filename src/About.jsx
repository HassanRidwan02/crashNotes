import { Link } from 'react-router-dom'

import Navbar from './Navbar/index'
import Footer from './components/Footer/Footer'

export default function About() {
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
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '800px',
                height: '800px',
                background: 'radial-gradient(circle, var(--secondary) 0%, transparent 60%)',
                opacity: 0.1,
                filter: 'blur(100px)',
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
                    margin: '80px auto',
                    padding: '0 20px',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        marginBottom: '30px',
                        background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        About crashNotes
                    </h1>

                    <div style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(var(--glass-blur))',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        textAlign: 'left',
                        fontSize: '1.2rem',
                        lineHeight: '1.7'
                    }}>
                        <p style={{ marginBottom: '20px' }}>
                            CrashNotes is an AI-powered tool designed to help students understand complex topics through storytelling.
                        </p>
                        <p style={{ marginBottom: '20px' }}>
                            By converting dense academic concepts into engaging narratives, we make learning faster, easier, and more memorable.
                        </p>
                        <p>
                            Built with React and powered by Google's Gemini AI.
                        </p>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <Link to="/note">
                            <button style={{
                                padding: '15px 40px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '40px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.3)',
                                transition: 'transform 0.2s ease'
                            }}>
                                Try It Now
                            </button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    )
}
