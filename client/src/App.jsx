import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Background from './components/Background.jsx';
import Cursor from './components/Cursor.jsx';
import SmoothScroll from './components/SmoothScroll.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { Queue, WhatsNew } from './components/Overlays.jsx';
import Home from './pages/Home.jsx';
import Platform from './pages/Platform.jsx';
import Contact from './pages/Contact.jsx';
import { NotFound, Privacy, Terms } from './pages/Legal.jsx';
import { getQueue } from './api.js';

export default function App() {
  const [queueOpen, setQueueOpen] = useState(false);
  const [count, setCount] = useState(getQueue().length);
  useEffect(() => {
    const sync = () => { setCount(getQueue().length); setQueueOpen(true); };
    window.addEventListener('savely-queue', sync);
    return () => window.removeEventListener('savely-queue', sync);
  }, []);

  return (
    <>
      <Background />
      <Cursor />
      <SmoothScroll />
      <Header onQueue={() => setQueueOpen((v) => !v)} queueCount={count} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/:slug" element={<Platform />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsNew />
      <Queue open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
