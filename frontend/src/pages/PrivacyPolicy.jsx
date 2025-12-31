import { Link } from "react-router-dom";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  Database,
  Cookie,
  Users,
  FileText,
  ArrowLeft,
} from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: December 29, 2024</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold">Introduction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Slotify is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our appointment booking platform. Please
              read this privacy policy carefully. If you do not agree with the
              terms of this privacy policy, please do not access the platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold">Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Account credentials (email and encrypted password)</li>
                  <li>Profile information including profile picture</li>
                  <li>Appointment history and booking preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Business Information
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Business name, address, and contact details</li>
                  <li>Services offered and pricing</li>
                  <li>Staff member information</li>
                  <li>Working hours and availability</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Automatically Collected Information
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and interaction data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-semibold">
                How We Use Your Information
              </h2>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide and maintain our appointment booking services</li>
              <li>To process and manage your appointments</li>
              <li>To send confirmation emails and appointment reminders</li>
              <li>To communicate with you about updates and changes</li>
              <li>To improve our platform and user experience</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold">
                Data Sharing & Disclosure
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information in the following
              circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>With Service Providers:</strong> When you book an
                appointment, relevant details are shared with the business
              </li>
              <li>
                <strong>For Legal Compliance:</strong> When required by law or
                to protect our rights
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly
                authorize sharing
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with mergers
                or acquisitions
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-semibold">Data Security</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your
              personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Passwords are encrypted using bcrypt hashing (10 rounds)</li>
              <li>All data transmission is encrypted using HTTPS/TLS</li>
              <li>JWT tokens with limited expiration for authentication</li>
              <li>HTTP-only cookies for secure session management</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-semibold">Cookies & Tracking</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies to maintain your session and remember
              your preferences. These cookies are necessary for the platform to
              function properly. We do not use third-party tracking cookies for
              advertising purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-semibold">Your Privacy Rights</h2>
            </div>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a readable
                format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing
                communications
              </li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please visit your Settings page or
              contact us at{" "}
              <a
                href="mailto:slotifyappointments@gmail.com"
                className="text-primary-600 hover:underline"
              >
                slotifyappointments@gmail.com
              </a>
            </p>
          </section>

          {/* Contact */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If you have questions or concerns about this Privacy Policy,
              please contact us at:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Slotify Support Team</strong>
                <br />
                Email: slotifyappointments@gmail.com
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center pt-8 border-t">
            <p className="text-gray-500 text-sm">
              By using Slotify, you agree to this Privacy Policy.
            </p>
            <Link
              to="/terms"
              className="text-primary-600 hover:underline text-sm"
            >
              View Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
