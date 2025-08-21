import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AllProjectsPage from './pages/AllProjectsPage';
import ProjectPage from './pages/ProjectPage';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AddProjectModal from './components/AddProjectModal';
import { useAuth } from './contexts/AuthContext'; 

function App() {
  const { isAuthModalOpen, isAddProjectModalOpen } = useAuth();

  return (
    <div className="bg-black text-white font-inter overflow-x-hidden">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects" element={<AllProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </main>
      <Footer />
      {isAuthModalOpen && <AuthModal />}
      {isAddProjectModalOpen && <AddProjectModal />}
    </div>
  );
}

export default App;
