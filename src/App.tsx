import { NavLink, Route, Routes } from 'react-router-dom';
import UniversitiesPage from './pages/UniversitiesPage';
import UniversityDetailPage from './pages/UniversityDetailPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Manara Scholars</p>
          <h1>University Knowledge Base</h1>
        </div>
        <nav className="main-nav">
          <NavLink to="/" end>
            Directory
          </NavLink>
          <NavLink to="/admin">
            Admin</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<UniversitiesPage />} />
          <Route path="/universities/:id" element={<UniversityDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
