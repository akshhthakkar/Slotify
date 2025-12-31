import { Link } from "react-router-dom";
import { Cookie, Shield, Key, Clock, ChevronLeft } from "lucide-react";

const CookiePolicy = () => {
  const storageItems = [
    {
      name: "refreshToken",
      type: "HTTP-Only Cookie",
      purpose: "Keeps you logged in securely between sessions",
      duration: "7 days",
      icon: Key,
    },
    {
      name: "accessToken",
      type: "Local Storage",
      purpose: "Authenticates your requests to the server",
      duration: "Until logout",
      icon: Shield,
    },
    {
      name: "user",
      type: "Local Storage",
      purpose: "Stores your profile information for quick access",
      duration: "Until logout",
      icon: Shield,
    },
    {
      name: "emailResendCooldown",
      type: "Local Storage",
      purpose: "Prevents spam when resending verification emails",
      duration: "60 seconds",
      icon: Clock,
    },
    {
      name: "cookiePreferences",
      type: "Local Storage",
      purpose: "Remembers that you have viewed this policy",
      duration: "Permanent",
      icon: Cookie,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Cookie className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cookie & Storage Policy
              </h1>
              <p className="text-gray-600">
                How Slotify stores data in your browser
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">About Our Data Storage</h2>
          <p className="text-gray-600 mb-4">
            Slotify uses cookies and browser local storage to provide you with a
            secure and seamless experience. All storage we use is{" "}
            <strong>essential</strong> for the application to function properly.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <Shield className="w-5 h-5" />
              <span className="font-medium">
                We do not use any tracking, analytics, or marketing cookies.
              </span>
            </div>
          </div>
        </div>

        {/* Storage Items */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-6">What We Store</h2>
          <div className="space-y-4">
            {storageItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded font-mono">
                        {item.name}
                      </code>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{item.purpose}</p>
                    <p className="text-xs text-gray-500">
                      <strong>Duration:</strong> {item.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How to Clear */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">How to Clear Your Data</h2>
          <p className="text-gray-600 mb-4">
            You can clear all Slotify data from your browser at any time:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>
              Open your browser's Developer Tools (F12 or Right Click → Inspect)
            </li>
            <li>Go to the "Application" or "Storage" tab</li>
            <li>Clear "Local Storage" for this site</li>
            <li>Clear "Cookies" for this site</li>
          </ol>
          <p className="text-gray-600 mt-4">
            Alternatively, simply <strong>log out</strong> from Slotify to clear
            your session data.
          </p>
        </div>

        {/* Third Party */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Third-Party Services</h2>
          <p className="text-gray-600">
            Slotify uses the following third-party services that may store their
            own data:
          </p>
          <ul className="list-disc list-inside mt-3 space-y-1 text-gray-600">
            <li>
              <strong>Cloudinary</strong> - For image storage (profile pictures,
              business images)
            </li>
            <li>
              <strong>Google OAuth</strong> - If you sign in with Google
            </li>
          </ul>
          <p className="text-gray-600 mt-3">
            These services have their own privacy policies that govern their use
            of your data.
          </p>
        </div>

        {/* Contact */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about our cookie and storage practices,
            please contact us at{" "}
            <a
              href="mailto:slotifyappointments@gmail.com"
              className="text-primary-600 hover:underline"
            >
              slotifyappointments@gmail.com
            </a>
          </p>
        </div>

        {/* Last Updated */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500">
          Last updated: December 2024
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
