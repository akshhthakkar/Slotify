import { Link } from "react-router-dom";
import {
  Users,
  Target,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Globe,
  Award,
} from "lucide-react";
import Button from "../components/common/Button";

const AboutUs = () => {
  const team = [
    {
      name: "Aksh Thakkar",
      role: "Founder & CEO",
      description: "Project Lead & Full-Stack Developer",
      image: "/team/aksh.png",
    },
    {
      name: "Om Maurya",
      role: "Frontend Developer",
      description: "UI/UX Specialist",
      image: "/team/om.png",
    },
    {
      name: "Daksh Patel",
      role: "Jha2",
      description: "Server Architecture & API Design",
      image: "/team/daksh.png",
    },
    {
      name: "Jainil Patel",
      role: "Database Engineer",
      description: "Database & Integration Specialist",
      image: "/team/jainil.png",
    },
  ];

  const solutions = [
    {
      icon: Clock,
      title: "Smart Scheduling",
      description:
        "Automated booking system that works 24/7 to fill your calendar efficiently.",
    },
    {
      icon: Users,
      title: "Customer Management",
      description:
        "Comprehensive CRM to keep track of customer history and preferences.",
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description:
        "Real-time updates via email to reduce no-shows and keep everyone in loop.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Integrated secure payment processing for seamless transactions.",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Revolutionizing Appointment Booking
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
            Our motto is simple:{" "}
            <span className="font-semibold text-white">
              "Time is precious, book it wisely."
            </span>
            <br />
            We connect service providers with customers through a seamless,
            efficient, and reliable platform.
          </p>
        </div>
      </div>

      {/* Our Mission / Solutions */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-dark-900 mb-4">
            Our Solutions
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            We provide a comprehensive suite of tools designed to streamline
            operations for businesses and simplify booking for customers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {solutions.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-2">
                {item.title}
              </h3>
              <p className="text-dark-500">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-dark-500 max-w-2xl mx-auto">
              The passionate minds behind Slotify who are dedicated to
              delivering the best booking experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-card border border-secondary-200 group hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="aspect-square bg-secondary-100 relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <p className="text-white font-medium">
                      {member.description}
                    </p>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-dark-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-dark-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-dark-300 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses and customers who trust Slotify for
              their scheduling needs.
            </p>
            <Link to="/register">
              <Button variant="primary" size="large">
                Join Slotify Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
