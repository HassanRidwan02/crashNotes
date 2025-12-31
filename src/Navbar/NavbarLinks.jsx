import { useNavbar } from "./Navbar";

export default function NavbarLinks({ children }) {
    const { brand } = useNavbar();

    return (
        <div style={{ display: "flex", gap: "2rem", alignItems: 'center' }}>
            {children}
        </div>
    );
}
