import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import Note from './Note'
import Contact from './Contact'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/note" element={<Note />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  )
}

export default App
