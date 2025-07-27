import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Get cookie function
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  const token = getCookie('auth_token');
  const username = getCookie('username');

  if (!token || !username) {
    console.log('No authentication found, redirecting to login');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
