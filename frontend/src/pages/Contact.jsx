import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Mail,
  MapPin,
  Building,
  Users,
  MessageSquare,
  Send,
  ArrowLeft,
  FileText,
  Heart,
  Globe,
} from "lucide-react";
import Button from "../components/common/Button";
import toast from "react-hot-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    inquiryType: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

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
      formDataToSend.append(
        "subject",
        `Slotify Inquiry: ${formData.inquiryType}`
      );
      formDataToSend.append(
        "message",
        `Company: ${formData.company || "N/A"}\nInquiry Type: ${
          formData.inquiryType
        }\n\n${formData.message}`
      );
      formDataToSend.append("from_name", "Slotify Contact Form");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Message sent! We'll get back to you soon.");
        setFormData({
          name: "",
          email: "",
          company: "",
          inquiryType: "",
          message: "",
        });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const contactReasons = [
    {
      icon: MessageSquare,
      title: "Partnership Opportunities",
      description:
        "Interested in partnering with Slotify? Let's discuss collaboration opportunities.",
    },
    {
      icon: Building,
      title: "Enterprise Solutions",
      description:
        "Need a custom solution for your large organization? We can help.",
    },
    {
      icon: FileText,
      title: "Business Inquiries",
      description:
        "General business questions, media inquiries, or speaking requests.",
    },
    {
      icon: Heart,
      title: "Feedback & Suggestions",
      description: "Share your ideas on how we can improve Slotify.",
    },
  ];

  return (
    <div className="bg-secondary-100 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center text-dark-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          </div>
          <p className="text-xl text-dark-300 max-w-2xl">
            Have a business inquiry, partnership proposal, or feedback? We'd
            love to hear from you.
          </p>
          <p className="text-primary-300 mt-4">
            Looking for technical support?{" "}
            <Link to="/support" className="underline hover:text-white">
              Visit our Support Center →
            </Link>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Contact Reasons */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {contactReasons.map((reason, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200 text-center"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <reason.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-dark-900 mb-2">
                {reason.title}
              </h3>
              <p className="text-dark-500 text-sm">{reason.description}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-card border border-secondary-200 overflow-hidden">
              <div className="p-6 border-b border-secondary-200">
                <h2 className="text-2xl font-bold text-dark-900">
                  Send Us a Message
                </h2>
                <p className="text-dark-500 mt-1">
                  Fill out the form below and we'll get back to you within 1-2
                  business days.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="input"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input"
                      placeholder="john@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className="input"
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inquiryType: e.target.value,
                        })
                      }
                      className="input"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Partnership">
                        Partnership Opportunity
                      </option>
                      <option value="Enterprise">Enterprise Solutions</option>
                      <option value="Business Inquiry">Business Inquiry</option>
                      <option value="Media">Media / Press</option>
                      <option value="Feedback">Feedback & Suggestions</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="input min-h-[150px] resize-y"
                    placeholder="Tell us about your inquiry..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={sending}
                  className="w-full"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Direct Email */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">Email Us</h3>
              </div>
              <a
                href="mailto:slotifyappointments@gmail.com"
                className="text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                slotifyappointments@gmail.com
              </a>
              <p className="text-dark-500 text-sm mt-2">
                For general inquiries and partnership discussions
              </p>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-secondary-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-dark-900 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">
                  About Slotify
                </h3>
              </div>
              <p className="text-dark-500 text-sm leading-relaxed">
                Slotify is a modern appointment booking platform designed to
                help businesses manage their schedules and customers book
                services effortlessly.
              </p>
              <div className="flex items-center gap-2 mt-4 text-dark-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Operating Worldwide</span>
              </div>
            </div>

            {/* Need Support */}
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-6 h-6 text-primary-600" />
                <h3 className="font-bold text-dark-900">Need Help?</h3>
              </div>
              <p className="text-dark-600 text-sm mb-4">
                For account issues, booking problems, or technical questions,
                visit our Support Center.
              </p>
              <Link to="/support">
                <Button variant="primary" size="small" className="w-full">
                  Go to Support Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
