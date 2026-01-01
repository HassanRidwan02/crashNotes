import Navbar from './Navbar/index'
import { Link } from 'react-router-dom'
import HeroSection from './components/Hero/HeroSection'

export default function Home() {
    return (
        <div>
            <Navbar>
                <Navbar.Logo>crashNotes</Navbar.Logo>
                <Navbar.Links>
                    <Navbar.Link to="/">Home</Navbar.Link>
                    <Navbar.Link to="/about">About</Navbar.Link>
                </Navbar.Links>
            </Navbar>

            <HeroSection />

        </div>
    )
}


