import { Link } from 'react-router-dom'

export default function HeroSection() {
    return (
        <section className="hero">
            <h1>Crash Notes Before Deep Study</h1>
            <p>
                Get a concise overview of any topic and test your knowledge with AI-generated quizzes before diving into deep study.
            </p>
            <Link to="/note">
                <button className="cta-button">Get Started</button>
            </Link>
        </section>
    )
}
