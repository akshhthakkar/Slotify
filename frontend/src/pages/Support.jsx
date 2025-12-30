import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Headphones,
  Mail,
  MessageCircle,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
} from "lucide-react";
import Button from "../components/common/Button";
import toast from "react-hot-toast";

const Support = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "How do I book an appointment?",
      a: "To book an appointment, browse our business directory on the homepage, select a business, choose a service, pick an available time slot, and confirm your booking. You'll receive a confirmation email once booked.",
    },
    {
      q: "How do I cancel or reschedule an appointment?",
      a: "Go to 'My Appointments' in your dashboard, find the appointment you want to modify, and click 'Reschedule' or 'Cancel'. Please note that cancellation policies vary by business.",
    },
    {
      q: "Why do I need to verify my email?",
      a: "Email verification ensures secure communication and prevents spam. It's required to book appointments so businesses can reach you with confirmations and reminders.",
    },
    {
      q: "How do I set up my business on Slotify?",
      a: "Create a customer account first, then go to Settings and click 'Setup Your Business'. Follow the onboarding steps to add your business details, services, and availability.",
    },
    {
      q: "Is Slotify free to use?",
      a: "Yes! Creating an account and booking appointments is completely free for customers. Business owners can also set up their profile and accept bookings at no cost.",
    },
    {
      q: "How do I change my password?",
      a: "Go to your Profile page and look for the password section. If you forgot your password, use the 'Forgot Password' link on the login page to reset it.",
    },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append(
        "access_key",
        "520e4088-737d-4c6b-b4ff-050d705bdac5"
      );
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("subject", "Slotify Support Request");
      formDataToSend.append(
        "message",
        `Topic: ${formData.subject}\n\n${formData.message}`
      );
      formDataToSend.append("from_name", "Slotify Support Form");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Support request sent successfully!");
        setFormData({
          name: "",
          email: "",
          subject: "General Inquiry",
          message: "",
        });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-secondary-100 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-dark-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center text-primary-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Support Center</h1>
          </div>
          <p className="text-xl text-primary-100/80 max-w-2xl">
            We're here to help! Find answers to common questions or reach out to
            our support team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - FAQ & Quick Help */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Help Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-dark-900 mb-1">
                  Response Time
                </h3>
                <p className="text-dark-500 text-sm">Usually within 24 hours</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-dark-900 mb-1">
                  Free Support
                </h3>
                <p className="text-dark-500 text-sm">Help is always free</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-dark-900 mb-1">
                  Expert Help
                </h3>
                <p className="text-dark-500 text-sm">Dedicated support team</p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-card border border-secondary-200 overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-dark-900">
                    Frequently Asked Questions
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-secondary-100">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-6">
                    <button
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-dark-900">{faq.q}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="w-5 h-5 text-dark-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-dark-400" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <p className="mt-3 text-dark-500 animate-fade-in">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Helpful Links */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-dark-900">
                  Helpful Resources
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  to="/how-it-works"
                  className="flex items-center p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                >
                  <HelpCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-dark-700">How It Works</span>
                </Link>
                <Link
                  to="/features"
                  className="flex items-center p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-dark-700">Features</span>
                </Link>
                <Link
                  to="/privacy"
                  className="flex items-center p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-dark-700">Privacy Policy</span>
                </Link>
                <Link
                  to="/terms"
                  className="flex items-center p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                >
                  <FileText className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-dark-700">Terms of Service</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card border border-secondary-200 sticky top-24">
              <div className="p-6 border-b border-secondary-200">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-dark-900">
                    Contact Us
                  </h2>
                </div>
                <p className="text-dark-500 text-sm mt-2">
                  Can't find what you're looking for? Send us a message.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Topic
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input"
                  >
                    <option>General Inquiry</option>
                    <option>Account Issue</option>
                    <option>Booking Problem</option>
                    <option>Business Setup Help</option>
                    <option>Technical Support</option>
                    <option>Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="input"
                    placeholder="How can we help you?"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={sending}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>

              <div className="p-6 bg-secondary-50 border-t border-secondary-200 rounded-b-2xl">
                <p className="text-sm text-dark-500 text-center">
                  Or email us directly at{" "}
                  <a
                    href="mailto:slotifyappointments@gmail.com"
                    className="text-primary-600 hover:underline"
                  >
                    slotifyappointments@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
