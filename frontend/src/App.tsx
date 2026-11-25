import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AcademyProvider, useAcademy } from './context/AcademyContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LessonPage } from './pages/LessonPage';
import { ExamCenterPage } from './pages/ExamCenterPage';
import { ReviewPage } from './pages/ReviewPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { LabsAndProjectPage } from './pages/LabsAndProjectPage';

const AppRoutes: React.FC = () => {
  const { loading, error } = useAcademy();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Carregant l’Acadèmia d’Intel·ligència Artificial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-xs">
          <h1 className="text-lg font-bold text-rose-900">Error carregant el contingut</h1>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/lliço/:conceptId" element={<LessonPage />} />
        <Route path="/examens" element={<ExamCenterPage />} />
        <Route path="/repas" element={<ReviewPage />} />
        <Route path="/pla-estudi" element={<StudyPlanPage />} />
        <Route path="/laboratoris" element={<LabsAndProjectPage />} />
        <Route path="/glossari" element={<GlossaryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AcademyProvider>
        <AppRoutes />
      </AcademyProvider>
    </BrowserRouter>
  );
};

export default App;
