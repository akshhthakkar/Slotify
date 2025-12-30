import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  Users,
  Clock,
  Bell,
  Shield,
  Smartphone,
  BarChart3,
  Mail,
  Globe,
  Settings,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
} from "lucide-react";
import Button from "../components/common/Button";

const Features = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin/dashboard";
    return "/dashboard";
  };

  const mainFeatures = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description:
        "Book appointments instantly with real-time availability. Our intelligent scheduling system ensures no double bookings and optimal time management.",
      benefits: [
        "Real-time availability",
        "Automatic conflict detection",
        "Multiple time zone support",
        "Recurring appointments",
      ],
    },
    {
      icon: Users,
      title: "Business Management",
      description:
        "Complete toolkit for businesses to manage their services, staff, and customer relationships all in one place.",
      benefits: [
        "Service catalog management",
        "Staff scheduling",
        "Customer database",
        "Business analytics",
      ],
    },
    {
      icon: Bell,
      title: "Automated Reminders",
      description:
        "Never miss an appointment with automated email and in-app notifications for both customers and service providers.",
      benefits: [
        "Email notifications",
        "In-app alerts",
        "Customizable timing",
        "Cancellation notices",
      ],
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security to protect your data. Email verification, secure authentication, and data encryption.",
      benefits: [
        "Email verification",
        "Secure login",
        "Data encryption",
        "Privacy controls",
      ],
    },
  ];

  const additionalFeatures = [
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description:
        "Fully responsive design works perfectly on all devices - desktop, tablet, and mobile.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Track your business performance with detailed analytics and insights.",
    },
    {
      icon: Mail,
      title: "Email Integration",
      description:
        "Automated emails for bookings, confirmations, and reminders.",
    },
    {
      icon: Globe,
      title: "Public Business Pages",
      description:
        "Get a beautiful public profile page for your business that customers can discover.",
    },
    {
      icon: Settings,
      title: "Customizable Settings",
      description:
        "Tailor the platform to your needs with flexible business settings.",
    },
    {
      icon: Star,
      title: "Reviews & Ratings",
      description:
        "Build trust with customer reviews and ratings on your business profile.",
    },
  ];

  const customerBenefits = [
    "Find and book services instantly",
    "Manage all appointments in one place",
    "Get reminders before appointments",
    "Review and rate businesses",
    "Easy rescheduling and cancellation",
    "Secure account with email verification",
  ];

  const businessBenefits = [
    "Reduce no-shows with reminders",
    "Manage your schedule efficiently",
    "Build your online presence",
    "Track business performance",
    "Accept bookings 24/7",
    "Grow with customer reviews",
  ];

  return (
    <div className="bg-secondary-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 mr-2 text-primary-300" />
            <span className="text-sm text-primary-100">Powerful Features</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <br />
            <span className="text-primary-300">Manage Appointments</span>
          </h1>
          <p className="text-xl text-primary-100/80 max-w-3xl mx-auto mb-8">
            Slotify provides all the tools you need to book, manage, and grow
            your appointment-based business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={getDashboardLink()}>
                <Button variant="white" size="large">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
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

      {/* Main Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Core Features
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Powerful tools built for modern appointment management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-secondary-100 rounded-2xl p-8 hover:bg-white hover:shadow-card-hover transition-all border border-transparent hover:border-secondary-200"
              >
                <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-dark-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-500 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center text-dark-600">
                      <CheckCircle className="w-5 h-5 text-primary-600 mr-3 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Features Grid */}
      <div className="py-20 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              And Much More
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Additional features to enhance your experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-card-hover transition-shadow border border-secondary-200"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits for Customers & Businesses */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-dark-500">
              Whether you're a customer or a business owner
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* For Customers */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">For Customers</h3>
              <ul className="space-y-4">
                {customerBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* For Businesses */}
            <div className="bg-dark-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">For Businesses</h3>
              <ul className="space-y-4">
                {businessBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-dark-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isAuthenticated
              ? "Explore Your Dashboard"
              : "Ready to Experience Slotify?"}
          </h2>
          <p className="text-xl text-dark-300 mb-8">
            {isAuthenticated
              ? "Manage your appointments and bookings with ease"
              : "Join thousands of businesses and customers already using Slotify"}
          </p>
          <Link to={isAuthenticated ? getDashboardLink() : "/register"}>
            <Button variant="primary" size="large">
              {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Features;
