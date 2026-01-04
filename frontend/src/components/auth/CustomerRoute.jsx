import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export const CustomerRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user is admin, redirect to admin dashboard
  if (user?.role === "admin") {
    // Avoid showing toast on every redirect if it's automatic
    // toast.error("Please use a customer account to access this page");
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default CustomerRoute;
