export default function NavbarLogo({ children }) {
    return (
        <div style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
        }}>
            {children}
        </div>
    );
}
