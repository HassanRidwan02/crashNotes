import Navbar from './Navbar/index'
import HeroSection from './components/Hero/HeroSection'

export default function Home() {
    return (
        <div>
            <Navbar>
                <Navbar.Logo>crashNotes</Navbar.Logo>
                <Navbar.Links>
                    <a>Home</a>
                    <a>About</a>
                </Navbar.Links>
            </Navbar>

            <HeroSection />

        </div>
    )
}


