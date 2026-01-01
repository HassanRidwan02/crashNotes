import { Link } from 'react-router-dom'

export default function HeroSection() {
    return (
        <section className="hero">
            <h1>Generate Crash Notes</h1>
            <p>
                Instant storytelling explanations for any topic.
                Understand fast before deep studying.
            </p>
            <Link to="/note">
                <button className="cta-button">Get Started</button>
            </Link>
        </section>
    )
}
