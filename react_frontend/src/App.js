import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Todo from './components/Todo';
import Step from './components/Step';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/todo" element={
            <ProtectedRoute>
              <Todo />
            </ProtectedRoute>
          } />
          <Route path="/todo/:todoId" element={
            <ProtectedRoute>
              <Step />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
