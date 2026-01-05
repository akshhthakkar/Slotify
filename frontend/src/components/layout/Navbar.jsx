import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  Calendar,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import Button from "../common/Button";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin";
    return "/dashboard";
  };

  return (
    <nav className="bg-white border-b border-secondary-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={user?.role === "admin" ? "/admin" : "/"}
              className="flex items-center group"
            >
              <img
                src="/logo_html.png"
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="ml-3 text-dark-900 brand-text tracking-tight">
                Slotify
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="medium">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                {user?.role === "customer" && (
                  <Link to="/my-appointments">
                    <Button variant="ghost" size="medium">
                      <Calendar className="w-4 h-4 mr-2" />
                      My Appointments
                    </Button>
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-secondary-100 transition-colors border border-transparent hover:border-secondary-200"
                  >
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-secondary-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-dark-700">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-dark-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-secondary-200 animate-fade-in">
                      <div className="px-4 py-2 border-b border-secondary-100">
                        <p className="text-sm font-medium text-dark-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-dark-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-dark-700 hover:bg-secondary-100 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3 text-dark-500" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2.5 text-sm text-dark-700 hover:bg-secondary-100 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3 text-dark-500" />
                        Settings
                      </Link>
                      <hr className="my-2 border-secondary-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/features">
                  <Button variant="ghost" size="medium">
                    Features
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="ghost" size="medium">
                    How It Works
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="medium">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="medium">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-dark-700 hover:bg-secondary-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-secondary-200 bg-white animate-fade-in">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="flex items-center px-3 py-3 mb-2 bg-secondary-100 rounded-xl">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="font-medium text-dark-900">{user?.name}</p>
                    <p className="text-sm text-dark-500">{user?.email}</p>
                  </div>
                </div>

                <Link
                  to={getDashboardLink()}
                  className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3 text-dark-500" />
                  Dashboard
                </Link>
                {user?.role === "customer" && (
                  <Link
                    to="/my-appointments"
                    className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar className="w-5 h-5 mr-3 text-dark-500" />
                    My Appointments
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="w-5 h-5 mr-3 text-dark-500" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3 text-dark-500" />
                  Settings
                </Link>
                <hr className="my-2 border-secondary-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2.5 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/features"
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="/how-it-works"
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <hr className="my-2 border-secondary-200" />
                <Link
                  to="/login"
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-dark-700 hover:bg-secondary-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
