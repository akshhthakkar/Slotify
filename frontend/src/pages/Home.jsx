import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Clock,
  Shield,
  ArrowRight,
  MapPin,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Button from "../components/common/Button";
import Loading from "../components/common/Loading";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin";
    return "/dashboard";
  };
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "All",
    "Salon & Spa",
    "Health & Wellness",
    "Professional Services",
    "Fitness",
    "Beauty",
    "Medical",
    "Education",
  ];

  const features = [
    {
      icon: Calendar,
      title: "Easy Scheduling",
      description: "Book appointments in seconds with real-time availability",
    },
    {
      icon: Users,
      title: "Multi-Business",
      description: "One platform for all your service provider needs",
    },
    {
      icon: Clock,
      title: "Automated Reminders",
      description:
        "Never miss an appointment with email and in-app notifications",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security",
    },
  ];

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      navigate("/admin");
      return;
    }
    fetchFeaturedBusinesses();
  }, [isAuthenticated, user, navigate]);

  const fetchFeaturedBusinesses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/business?limit=6&isActive=true");
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchQuery}&category=${selectedCategory}`);
  };

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      !searchQuery ||
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "All" ||
      business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-secondary-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 mr-2 text-primary-300" />
              <span className="text-sm text-primary-100">
                Simple. Fast. Reliable.
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Book Appointments
              <br />
              <span className="text-primary-300">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-primary-100/80 max-w-2xl mx-auto">
              Connect with service providers, book appointments instantly, and
              manage everything in one place
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto mb-8">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services or businesses..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-dark-900 placeholder-dark-400 focus:ring-2 focus:ring-primary-400 focus:outline-none shadow-lg"
                  />
                </div>
                <Button type="submit" variant="white" size="large">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </form>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link to={getDashboardLink()}>
                    <Button variant="white" size="large">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="white" size="large">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="large"
                      className="border-white/50 text-white hover:bg-white hover:text-primary-600"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-secondary-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category === "All" ? "" : category)
                }
                className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  (category === "All" && !selectedCategory) ||
                  selectedCategory === category
                    ? "bg-primary-600 text-white shadow-button"
                    : "bg-secondary-100 text-dark-700 hover:bg-secondary-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Businesses */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-dark-900">
                Featured Businesses
              </h2>
              <p className="text-dark-500 mt-1">
                Discover top-rated service providers
              </p>
            </div>
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 flex items-center font-medium"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loading text="Loading businesses..." />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-dark-900 mb-2">
                No businesses found
              </h3>
              <p className="text-dark-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <Link
                  key={business._id}
                  to={`/business/${business.slug}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 group"
                >
                  {/* Cover Image */}
                  <div className="h-44 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden relative">
                    {business.coverPhoto ? (
                      <img
                        src={business.coverPhoto}
                        alt={business.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-white/50">
                          {business.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Walk-in Badge */}
                    <div className="absolute top-3 right-3">
                      {business.bookingSettings?.allowWalkIns ? (
                        <span className="bg-green-100/90 backdrop-blur-sm text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">
                          Walk-ins Welcome
                        </span>
                      ) : (
                        <span className="bg-orange-100/90 backdrop-blur-sm text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-orange-200">
                          Appointment Only
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Business Info */}
                    <div className="flex items-start gap-3">
                      {business.logo ? (
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-secondary-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-primary-600">
                            {business.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-dark-900 truncate group-hover:text-primary-600 transition-colors">
                          {business.name}
                        </h3>
                        <p className="text-sm text-dark-500 truncate">
                          {business.tagline || business.category}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    {business.address?.city && (
                      <div className="flex items-center text-sm text-dark-500 mt-3">
                        <MapPin className="w-4 h-4 mr-1 text-dark-400" />
                        <span>
                          {business.address.city}, {business.address.state}
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
                      <span className="badge badge-info">
                        {business.category}
                      </span>
                      <span className="text-primary-600 text-sm font-medium group-hover:underline">
                        View Profile →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-dark-500">
              Powerful features for seamless appointment management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-secondary-100 rounded-2xl p-6 text-center hover:bg-white hover:shadow-card transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-dark-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-dark-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isAuthenticated
              ? "Explore Your Dashboard"
              : "Ready to get started?"}
          </h2>
          <p className="text-xl text-dark-300 mb-8">
            {isAuthenticated
              ? "Manage your appointments and explore businesses"
              : "Join thousands of users managing appointments with Slotify"}
          </p>
          <Link to={isAuthenticated ? getDashboardLink() : "/register"}>
            <Button variant="primary" size="large">
              {isAuthenticated ? "Go to Dashboard" : "Create Your Free Account"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Scrollbar hiding style */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Home;
