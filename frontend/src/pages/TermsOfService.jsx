import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Gavel,
  Mail,
  ArrowLeft,
  CreditCard,
  Ban,
} from "lucide-react";

const TermsOfService = () => {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: December 29, 2024</p>
        </div>

        <div className="space-y-8">
          {/* Acceptance */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold">Acceptance of Terms</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Slotify ("the Platform"), you accept and
              agree to be bound by these Terms of Service. If you do not agree
              to these terms, you must not use the Platform. We reserve the
              right to modify these terms at any time, and continued use of the
              Platform constitutes acceptance of any changes.
            </p>
          </section>

          {/* User Accounts */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold">
                User Accounts & Security
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Account Creation
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>
                    You must be at least 18 years old to create an account
                  </li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>
                    One account per person unless authorized for business use
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Email Verification
                </h3>
                <p className="text-gray-700">
                  You must verify your email address to access certain features,
                  including booking appointments. Unverified accounts have
                  limited functionality.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Account Termination
                </h3>
                <p className="text-gray-700">
                  We reserve the right to suspend or terminate accounts that
                  violate these terms or engage in fraudulent activity.
                </p>
              </div>
            </div>
          </section>

          {/* Booking Policies */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-semibold">
                Booking & Cancellation Policies
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Booking Appointments
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Bookings are subject to availability</li>
                  <li>You must provide accurate contact information</li>
                  <li>
                    Confirmation emails will be sent to your registered email
                  </li>
                  <li>
                    Some businesses may require approval before confirmation
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Cancellation & Rescheduling
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Cancellation policies vary by business provider</li>
                  <li>
                    Default cancellation window is 24 hours before appointment
                  </li>
                  <li>
                    Late cancellations may incur fees as set by the business
                  </li>
                  <li>
                    Rescheduling limits may apply (typically 2 times per
                    appointment)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">No-Shows</h3>
                <p className="text-gray-700">
                  Failure to attend a scheduled appointment without prior
                  cancellation may result in restrictions on future bookings or
                  account penalties.
                </p>
              </div>
            </div>
          </section>

          {/* Provider Responsibilities */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-semibold">
                Provider Responsibilities
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Business providers using Slotify agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>
                Provide accurate business information and service descriptions
              </li>
              <li>Maintain up-to-date availability and pricing</li>
              <li>
                Honor confirmed appointments or provide reasonable notice of
                changes
              </li>
              <li>Handle customer data in accordance with privacy laws</li>
              <li>Respond to customer inquiries in a timely manner</li>
              <li>Maintain professional standards of service</li>
            </ul>
          </section>

          {/* Customer Responsibilities */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-semibold">
                Customer Responsibilities
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              Customers using Slotify agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Arrive on time for scheduled appointments</li>
              <li>Provide accurate contact information</li>
              <li>Cancel appointments within the required notice period</li>
              <li>Treat service providers with respect and courtesy</li>
              <li>Pay for services as agreed with the provider</li>
              <li>Not misuse the platform or engage in fraudulent activity</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-semibold">Prohibited Activities</h2>
            </div>
            <p className="text-gray-700 mb-4">
              The following activities are strictly prohibited:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Creating fake accounts or providing false information</li>
              <li>
                Scraping, harvesting, or collecting user data without consent
              </li>
              <li>
                Attempting to bypass security measures or access restricted
                areas
              </li>
              <li>Transmitting malware, spam, or malicious content</li>
              <li>Impersonating other users or businesses</li>
              <li>Using the platform for illegal purposes</li>
              <li>Harassing, threatening, or abusing other users</li>
            </ul>
          </section>

          {/* Payments */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-semibold">Payments & Fees</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Slotify facilitates booking between customers and service
              providers. Payment terms are determined by individual businesses.
              Slotify is not responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Disputes over service quality or pricing</li>
              <li>Refunds for services rendered</li>
              <li>Payment collection between customers and providers</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Future payment integration features will have separate terms and
              conditions.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-semibold">
                Limitation of Liability
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Slotify provides the platform "as is" without warranties of any
              kind. We are not liable for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Quality or outcome of services provided by businesses</li>
              <li>Disputes between customers and service providers</li>
              <li>
                Losses resulting from platform downtime or technical issues
              </li>
              <li>
                Unauthorized access to your account if proper security was not
                maintained
              </li>
              <li>Third-party actions or content</li>
            </ul>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Our total liability is limited to the
                amount paid to us, if any, in the 12 months preceding any claim.
              </p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-semibold">Dispute Resolution</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these terms or use of the Platform shall
              first be addressed through our customer support. If unresolved,
              disputes will be subject to binding arbitration in accordance with
              applicable laws. Users may not participate in class action
              lawsuits against Slotify.
            </p>
          </section>

          {/* Contact */}
          <section className="card">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms of Service, please contact us at:
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
              By using Slotify, you agree to these Terms of Service.
            </p>
            <Link
              to="/privacy"
              className="text-primary-600 hover:underline text-sm"
            >
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
