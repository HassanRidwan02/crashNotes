export default function Footer() {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginTop: 'auto',
            borderTop: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur))'
        }}>
            <p>&copy; hassanridwan {new Date().getFullYear()}</p>
        </footer>
    );
}
