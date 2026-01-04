import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Calendar,
  CheckCircle,
  Bell,
  Star,
  ArrowRight,
  UserPlus,
  Building,
  Clock,
} from "lucide-react";
import Button from "../components/common/Button";

const HowItWorks = () => {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === "admin") return "/admin";
    return "/dashboard";
  };

  const customerSteps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Create Your Account",
      description:
        "Sign up in seconds with your email or Google account. Verify your email to unlock all features.",
    },
    {
      step: 2,
      icon: Search,
      title: "Find a Business",
      description:
        "Browse our directory of businesses or search for specific services in your area.",
    },
    {
      step: 3,
      icon: Calendar,
      title: "Book an Appointment",
      description:
        "Select your preferred date, time, and service. See real-time availability instantly.",
    },
    {
      step: 4,
      icon: Bell,
      title: "Get Reminders",
      description:
        "Receive email confirmations and reminders before your appointment.",
    },
    {
      step: 5,
      icon: Star,
      title: "Rate & Review",
      description:
        "After your appointment, leave a review to help other customers.",
    },
  ];

  const businessSteps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Register as Customer",
      description:
        "Start by creating a customer account and verifying your email address.",
    },
    {
      step: 2,
      icon: Building,
      title: "Set Up Your Business",
      description:
        "Click 'Set Up Your Business' from your dashboard at anytime and complete the onboarding process.",
    },
    {
      step: 3,
      icon: Clock,
      title: "Configure Services",
      description:
        "Add your services, set pricing, and define your working hours and availability.",
    },
    {
      step: 4,
      icon: Calendar,
      title: "Accept Bookings",
      description:
        "Start receiving bookings from customers. Manage them all from your admin dashboard.",
    },
    {
      step: 5,
      icon: CheckCircle,
      title: "Grow Your Business",
      description:
        "Build your reputation with customer reviews and track your performance with analytics.",
    },
  ];

  const faqs = [
    {
      q: "Is Slotify free to use?",
      a: "Yes! Creating an account and booking appointments is completely free for customers. Businesses can set up their profile and start accepting bookings at no cost.",
    },
    {
      q: "Do I need to verify my email?",
      a: "Yes, email verification is required to book appointments. This helps ensure secure communication and prevents spam.",
    },
    {
      q: "Can I reschedule or cancel appointments?",
      a: "Yes, you can reschedule or cancel appointments from your dashboard. Cancellation policies vary by business.",
    },
    {
      q: "How do I set up a business?",
      a: "First, create a customer account. Then, from your dashboard, click 'Set Up Your Business' and follow the onboarding steps.",
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. We use industry-standard encryption, secure authentication, and never share your data without consent.",
    },
  ];

  return (
    <div className="bg-secondary-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How Slotify Works
          </h1>
          <p className="text-xl text-primary-100/80 max-w-3xl mx-auto mb-8">
            Whether you're a customer looking to book appointments or a business
            owner managing your schedule, Slotify makes it simple.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            </div>
          )}
          {isAuthenticated && (
            <Link to={getDashboardLink()}>
              <Button variant="white" size="large">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* For Customers */}
      <div className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary-100 text-primary-600 font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full mb-4">
              For Customers
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Book Appointments in Minutes
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Finding and booking services has never been easier
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Center Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200 transform -translate-x-1/2"></div>

            <div className="space-y-12 md:space-y-16">
              {customerSteps.map((step, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div key={step.step} className="relative">
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center">
                      {/* Left Side */}
                      <div className="w-[calc(50%-40px)] pr-8">
                        {isLeft ? (
                          <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow text-right border border-secondary-200">
                            <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-3">
                              Step {step.step}
                            </span>
                            <h3 className="text-xl font-bold text-dark-900 mb-2">
                              {step.title}
                            </h3>
                            <p className="text-dark-500">{step.description}</p>
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>

                      {/* Center Icon */}
                      <div className="w-20 flex justify-center">
                        <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl text-white shadow-lg">
                          <step.icon className="w-7 h-7" />
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="w-[calc(50%-40px)] pl-8">
                        {!isLeft ? (
                          <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow text-left border border-secondary-200">
                            <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-3">
                              Step {step.step}
                            </span>
                            <h3 className="text-xl font-bold text-dark-900 mb-2">
                              {step.title}
                            </h3>
                            <p className="text-dark-500">{step.description}</p>
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="md:hidden flex items-start gap-4">
                      <div className="relative">
                        <div className="flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl text-white shadow-lg">
                          <step.icon className="w-6 h-6" />
                        </div>
                        {index < customerSteps.length - 1 && (
                          <div className="absolute left-1/2 top-14 w-0.5 h-12 bg-primary-200 transform -translate-x-1/2"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <span className="inline-block text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full mb-2">
                          Step {step.step}
                        </span>
                        <h3 className="text-lg font-bold text-dark-900 mb-1">
                          {step.title}
                        </h3>
                        <p className="text-dark-500 text-sm">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* For Businesses */}
      <div className="py-20 bg-secondary-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block bg-dark-900 text-white font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full mb-4">
              For Businesses
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Manage Your Business Effortlessly
            </h2>
            <p className="text-xl text-dark-500 max-w-2xl mx-auto">
              Set up your business and start accepting bookings today
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {businessSteps.map((step) => (
              <div
                key={step.step}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-card-hover transition-shadow border border-secondary-200"
              >
                <div className="w-14 h-14 bg-dark-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-semibold text-dark-900 bg-secondary-100 px-2 py-1 rounded-full inline-block mb-3">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-bold text-dark-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-dark-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-dark-500">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-secondary-100 rounded-2xl p-6 hover:bg-white hover:shadow-card transition-all border border-transparent hover:border-secondary-200"
              >
                <h3 className="font-bold text-dark-900 mb-2 text-lg">
                  {faq.q}
                </h3>
                <p className="text-dark-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-dark-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {isAuthenticated ? "Ready to Book?" : "Ready to Get Started?"}
          </h2>
          <p className="text-xl text-dark-300 mb-8">
            {isAuthenticated
              ? "Browse businesses and book your next appointment"
              : "Join Slotify today and experience seamless appointment booking"}
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

export default HowItWorks;
