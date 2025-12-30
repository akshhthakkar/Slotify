import { Link } from "react-router-dom";
import { Calendar, Mail, Github, Twitter, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <img
                src="/logo_html.png"
                alt="Slotify"
                className="w-10 h-10 object-contain"
              />
              <span className="ml-3 text-xl font-bold font-brand">Slotify</span>
            </div>
            <p className="text-dark-300 text-sm leading-relaxed">
              Your complete appointment booking solution. Simple, fast, and
              reliable scheduling for everyone.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/features"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/register"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/cookies"
                  className="text-dark-300 hover:text-primary-300 text-sm transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-dark-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-dark-400 text-sm flex items-center">
              © {currentYear} Slotify. Made with{" "}
              <Heart className="w-4 h-4 mx-1 text-red-500 fill-red-500" /> for
              better scheduling.
            </p>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href="mailto:slotifyappointments@gmail.com"
                className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-primary-300 hover:bg-dark-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-primary-300 hover:bg-dark-700 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-primary-300 hover:bg-dark-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
