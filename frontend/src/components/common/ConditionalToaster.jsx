import { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";

const ConditionalToaster = () => {
  const location = useLocation();
  const path = location.pathname;

  // Define paths where notifications should be visible
  // We want them on:
  // - All dashboard routes (start with /dashboard, /admin, /staff, /business)
  // - Auth routes (login, register, forgot-password, reset-password) to show errors
  // - Booking flow (/book)
  // - User profile/settings (/profile, /my-appointments, /settings)

  // We want to HIDE them on:
  // - Landing page (/)
  // - Public marketing pages (/about, /contact, /features, /how-it-works)
  // - Legal pages (/privacy, /terms, /cookies)

  const isPublicPage = [
    "/",
    "/about",
    "/contact",
    "/features",
    "/how-it-works",
    "/privacy",
    "/terms",
    "/cookies",
    "/support",
  ].includes(path);

  // Also check for exact public business profile match if needed,
  // currently business/:slug might be public but maybe we want toasts there?
  // The user asked to hide on "non-functional pages", so business profile is probably "functional" enough (booking).

  // If it's a public page, don't render the toaster
  if (isPublicPage) {
    return null;
  }

  return <Toaster position="top-right" limit={1} />;
};

export default ConditionalToaster;
