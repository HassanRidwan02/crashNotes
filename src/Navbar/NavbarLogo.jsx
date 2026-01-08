import { Link } from 'react-router-dom';

export default function NavbarLogo({ children }) {
    return (
        <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="navbar-logo">
                {children}
            </div>
        </Link>
    );
}
