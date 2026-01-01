import { NavLink } from "react-router-dom";

export default function NavbarLink({ to, children }) {
    return (
        <NavLink
            to={to}
            style={({ isActive }) => ({
                color: isActive ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: isActive ? '700' : '500',
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.3s ease',
                padding: '5px 10px'
            })}
        >
            {({ isActive }) => (
                <>
                    {children}
                    <span style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: isActive ? '100%' : '0%',
                        height: '2px',
                        background: 'var(--primary)',
                        transition: 'width 0.3s ease',
                        borderRadius: '2px'
                    }} />
                </>
            )}
        </NavLink>
    );
}
