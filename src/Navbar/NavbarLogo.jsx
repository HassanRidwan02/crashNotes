import { Link } from 'react-router-dom';

export default function NavbarLogo({ children }) {
    return (
        <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{
                fontSize: "1.5rem",
                fontWeight: "800",
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                cursor: 'pointer'
            }}>
                {children}
            </div>
        </Link>
    );
}
