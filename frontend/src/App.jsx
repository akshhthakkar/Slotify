import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import {
  ProtectedRoute,
  RoleProtectedRoute,
  PublicRoute,
} from "./components/auth/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import EmailVerificationBanner from "./components/common/EmailVerificationBanner";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import AuthCallback from "./pages/AuthCallback";

// Customer Pages
import CustomerDashboard from "./pages/CustomerDashboard";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import RescheduleAppointment from "./pages/RescheduleAppointment";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import BusinessPublicProfile from "./pages/BusinessPublicProfile";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import ServicesManagement from "./pages/ServicesManagement";
import StaffManagement from "./pages/StaffManagement";
import BusinessSettings from "./pages/BusinessSettings";

// Staff Pages
import StaffDashboard from "./pages/StaffDashboard";
import StaffAvailability from "./pages/StaffAvailability";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <EmailVerificationBanner />

          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route
                path="/business/:slug"
                element={<BusinessPublicProfile />}
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book/:businessId"
                element={
                  <ProtectedRoute>
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-appointments"
                element={
                  <ProtectedRoute>
                    <MyAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reschedule/:appointmentId"
                element={
                  <ProtectedRoute>
                    <RescheduleAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Business Onboarding - accessible by any authenticated user */}
              <Route
                path="/business-onboarding"
                element={
                  <ProtectedRoute>
                    <BusinessOnboarding />
                  </ProtectedRoute>
                }
              />

              {/* Business Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/services"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ServicesManagement />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <StaffManagement />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <BusinessSettings />
                  </RoleProtectedRoute>
                }
              />

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <RoleProtectedRoute allowedRoles={["staff"]}>
                    <StaffDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/staff/availability"
                element={
                  <RoleProtectedRoute allowedRoles={["staff"]}>
                    <StaffAvailability />
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </main>

          <Footer />
        </div>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
