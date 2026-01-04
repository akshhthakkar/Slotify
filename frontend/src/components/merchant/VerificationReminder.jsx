import { useState, useEffect } from "react";
import { AlertCircle, X, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const VerificationReminder = ({ business }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!business) return;

    // Logic: Show if status is 'unverified' AND not dismissed today
    const { verification } = business;
    const isUnverified = verification?.status === "unverified";

    if (isUnverified) {
      const today = new Date().toDateString();
      const dismissedDate = localStorage.getItem(
        "verification_reminder_dismissed"
      );

      if (dismissedDate !== today) {
        setVisible(true);
      }
    }
  }, [business]);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem("verification_reminder_dismissed", today);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow-sm relative animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3 pr-8">
          <p className="text-sm font-medium text-blue-800">
            Verify your business to build customer trust
          </p>
          <p className="mt-1 text-sm text-blue-700">
            Upload your Aadhaar or PAN card to complete your profile. This is
            optional but recommended.
          </p>
          <div className="mt-3">
            <Link
              to="/admin/settings"
              className="text-sm font-medium text-blue-800 hover:text-blue-600 underline decoration-blue-500/30 hover:decoration-blue-500/100 transition-colors"
            >
              Verify Now &rarr;
            </Link>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-blue-400 hover:text-blue-600 transition-colors"
          title="Dismiss for today"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default VerificationReminder;
