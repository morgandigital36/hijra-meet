import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Setup from './pages/Setup';
import Event from './pages/Event';
import Schedule from './pages/Schedule';
import Recordings from './pages/Recordings';
import Settings from './pages/Settings';
import HostAuth from './pages/HostAuth';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/auth" element={<HostAuth />} />
        <Route path="/setup/:id" element={<Setup />} />
        <Route path="/event/:id" element={<Event />} />
        <Route path="/event/:id/host" element={<Event />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/recordings" element={<Recordings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
