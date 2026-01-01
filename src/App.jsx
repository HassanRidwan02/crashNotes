import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import Note from './Note'
import About from './About'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/note" element={<Note />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

export default App
