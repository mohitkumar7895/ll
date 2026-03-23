import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Loader from "./Loader";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader label="Restoring your session..." />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
  }

  return children;
};

export default ProtectedRoute;
