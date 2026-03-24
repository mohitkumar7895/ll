import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";
import { useAuth } from "./context/useAuth";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import StudentBookingsPage from "./pages/StudentBookingsPage";
import StudentPaymentsPage from "./pages/StudentPaymentsPage";
import MarkAttendancePage from "./pages/MarkAttendancePage";
import StudentProfilePage from "./pages/StudentProfilePage";
import SeatBookingPage from "./pages/SeatBookingPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import Receipt from "./pages/Receipt";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminTodayAttendancePage from "./pages/AdminTodayAttendancePage";
import AdminMarkAttendancePage from "./pages/AdminMarkAttendancePage";
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader label="Loading application..." />;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/seats"
        element={
          <ProtectedRoute role="student">
            <SeatBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/bookings"
        element={
          <ProtectedRoute role="student">
            <StudentBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payments"
        element={
          <ProtectedRoute role="student">
            <StudentPaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/payment-success"
        element={
          <ProtectedRoute role="student">
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/receipt/:paymentId"
        element={
          <ProtectedRoute role="student">
            <Receipt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute role="student">
            <StudentAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/mark-attendance"
        element={
          <ProtectedRoute role="student">
            <MarkAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute role="admin">
            <AdminTodayAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute role="admin">
            <AdminPaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/receipt/:paymentId"
        element={
          <ProtectedRoute role="admin">
            <Receipt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute role="admin">
            <AdminStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mark-attendance"
        element={
          <ProtectedRoute role="admin">
            <AdminMarkAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
