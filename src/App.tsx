import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LearningProvider } from './context/LearningContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Vocabulary from './pages/Vocabulary';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <LearningProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="learn" element={<Learn />} />
            <Route path="vocabulary" element={<Vocabulary />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LearningProvider>
  );
}
