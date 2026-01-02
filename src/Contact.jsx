import { useState } from 'react'
import Navbar from './Navbar/index'
import Footer from './components/Footer/Footer'

export default function Contact() {
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        // Formspree handles the submission, but we can add some local feedback if we use fetch
        // However, for simplicity and reliability, traditional form submission or a simple fetch is fine.
        // Let's stick to traditional form submission for now or a simple fetch for better UX.
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-dark)',
            color: 'var(--text-main)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
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

            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Navbar>
                    <Navbar.Logo>crashNotes</Navbar.Logo>
                    <Navbar.Links>
                        <Navbar.Link to="/">Home</Navbar.Link>
                        <Navbar.Link to="/contact">Contact Us</Navbar.Link>
                    </Navbar.Links>
                </Navbar>

                <main style={{
                    maxWidth: '600px',
                    margin: '60px auto',
                    padding: '0 20px',
                    textAlign: 'center',
                    flex: 1
                }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '800',
                        marginBottom: '30px',
                        background: 'linear-gradient(135deg, var(--text-main) 0%, var(--primary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Contact Us
                    </h1>

                    <div style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        backdropFilter: 'blur(var(--glass-blur))',
                        borderRadius: '24px',
                        padding: '40px',
                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                        textAlign: 'left'
                    }}>
                        <p style={{ marginBottom: '30px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            Have feedback or questions? Send us a message and we'll get back to you!
                        </p>

                        <form
                            action="https://formspree.io/f/mqeabbaz"
                            method="POST"
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="name" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Your Name"
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-main)',
                                        outline: 'none',
                                        transition: 'border-color 0.3s'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    placeholder="yourname@example.com"
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-main)',
                                        outline: 'none',
                                        transition: 'border-color 0.3s'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label htmlFor="message" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    placeholder="Your message here..."
                                    rows="5"
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-main)',
                                        outline: 'none',
                                        transition: 'border-color 0.3s',
                                        resize: 'none'
                                    }}
                                />
                            </div>

                            <button type="submit" style={{
                                marginTop: '10px',
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
                                Send Message
                            </button>
                        </form>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    )
}
