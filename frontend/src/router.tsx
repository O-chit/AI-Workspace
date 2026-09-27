import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { AiAssistantPage } from './pages/AiAssistantPage.js';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage.js';
import { FlashcardsPage } from './pages/FlashcardsPage.js';
import { QuizModePage } from './pages/QuizModePage.js';
import { SavedNotesPage } from './pages/SavedNotesPage.js';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/assistant" replace />,
      },
      {
        path: 'assistant',
        element: <AiAssistantPage />,
      },
      {
        path: 'documents',
        element: <DocumentLibraryPage />,
      },
      {
        path: 'flashcards',
        element: <FlashcardsPage />,
      },
      {
        path: 'quiz',
        element: <QuizModePage />,
      },
      {
        path: 'notes',
        element: <SavedNotesPage />,
      },
      {
        path: '*',
        element: <Navigate to="/assistant" replace />,
      },
    ],
  },
]);
