import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Protected route component for admin pages
 * Checks if user is authenticated before rendering children
 */
const AdminProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      const authenticated = sessionStorage.getItem("admin_authenticated") === "true";
      const loginTime = parseInt(sessionStorage.getItem("admin_login_time") || "0");
      const now = Date.now();
      
      // Session expires after 8 hours
      const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
      
      if (authenticated && (now - loginTime) < SESSION_DURATION) {
        setIsAuthenticated(true);
      } else {
        // Clear expired session
        sessionStorage.removeItem("admin_authenticated");
        sessionStorage.removeItem("admin_login_time");
        setIsAuthenticated(false);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default AdminProtectedRoute;

