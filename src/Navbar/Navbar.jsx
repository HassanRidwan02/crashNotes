import { createContext, useContext } from "react";

const NavbarContext = createContext();

export default function Navbar({ children }) {
    const value = {

    };

    return (
        <NavbarContext.Provider value={value}>
            <nav style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(var(--glass-blur))',
                borderBottom: '1px solid var(--glass-border)',
                height: 'var(--nav-height)',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {children}
                </div>
            </nav>
        </NavbarContext.Provider>
    );
}

export function useNavbar() {
    return useContext(NavbarContext);
}
