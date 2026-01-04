import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  Calendar,
  Lock,
  User,
  LogIn,
  Settings,
} from "lucide-react";
import api from "../utils/api";
import Loading from "../components/common/Loading";
import Button from "../components/common/Button";
import { formatDuration } from "../utils/dateHelpers";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const BusinessPublicProfile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessProfile();
  }, [slug]);

  const fetchBusinessProfile = async () => {
    try {
      setLoading(true);

      // Fetch business details
      const businessRes = await api.get(`/business/slug/${slug}`);
      setBusiness(businessRes.data.business);

      // Fetch services
      const servicesRes = await api.get(
        `/services?businessId=${businessRes.data.business._id}`
      );
      setServices(servicesRes.data.services || []);

      // Fetch staff for authenticated users using public endpoint
      if (isAuthenticated) {
        try {
          const staffRes = await api.get(
            `/staff/public/${businessRes.data.business._id}`
          );
          setStaff(staffRes.data.staff || []);
        } catch (error) {
          console.error("Error fetching staff:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error("Business not found");
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (serviceId = null) => {
    if (!business) return;

    // Check if user is logged in
    if (!isAuthenticated) {
      toast.error("Please sign in to book appointments");
      navigate(
        `/login?redirect=/book/${business._id}${
          serviceId ? `?serviceId=${serviceId}` : ""
        }`
      );
      return;
    }

    // Block business accounts
    if (user?.role === "admin") {
      toast.error(
        "Business accounts cannot book appointments. Please use a personal account."
      );
      return;
    }

    // Check if email is verified
    if (!user?.emailVerified) {
      toast.error("Please verify your email to book appointments");
      return;
    }
    const path = `/book/${business._id}${
      serviceId ? `?serviceId=${serviceId}` : ""
    }`;
    navigate(path);
  };

  const getGoogleMapsUrl = () => {
    if (!business?.address) return "#";

    let query = "";
    if (business.address.fullAddress) {
      query = encodeURIComponent(business.address.fullAddress);
    } else {
      // Construct address from parts
      const parts = [
        business.address.street,
        business.address.city,
        business.address.state,
        business.address.postalCode,
        business.address.country,
      ].filter(Boolean);

      if (parts.length > 0) {
        query = encodeURIComponent(parts.join(", "));
      }
    }

    if (!query) return "#";

    // Use the 'dir' parameter to open directions directly
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  if (loading) return <Loading fullscreen />;
  if (!business)
    return <div className="text-center py-20">Business not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary-400 to-primary-600">
        {business.coverPhoto ? (
          <img
            src={business.coverPhoto}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl font-bold text-white">
              {business.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Business Info */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative">
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            {business.logo && (
              <img
                src={business.logo}
                alt={business.name}
                className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {business.name}
                    </h1>
                    {business.verificationStatus === "verified" && (
                      <span className="badge badge-success flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                  {business.tagline && (
                    <p className="text-lg text-gray-600 mb-3">
                      {business.tagline}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-info">
                      {business.category}
                    </span>
                    {business.subcategory && (
                      <span className="badge bg-gray-100 text-gray-700">
                        {business.subcategory}
                      </span>
                    )}
                    {business.bookingSettings?.allowWalkIns ? (
                      <span className="badge bg-green-100 text-green-800 border-green-200">
                        Walk-ins Welcome
                      </span>
                    ) : (
                      <span className="badge bg-orange-100 text-orange-800 border-orange-200">
                        Appointment Only
                      </span>
                    )}
                  </div>
                </div>

                {user?.role === "admin" && user?.businessId === business._id ? (
                  <Link to="/admin">
                    <Button
                      variant="primary"
                      size="large"
                      className="hidden md:flex"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Manage Business
                    </Button>
                  </Link>
                ) : user?.role !== "admin" ? (
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => handleBookNow()}
                    className="hidden md:flex"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Mobile Book Button */}
          {user?.role === "admin" && user?.businessId === business._id ? (
            <Link to="/admin">
              <Button
                variant="primary"
                size="large"
                className="w-full md:hidden mt-4"
              >
                <Settings className="w-5 h-5 mr-2" />
                Manage Business
              </Button>
            </Link>
          ) : user?.role !== "admin" ? (
            <Button
              variant="primary"
              size="large"
              onClick={() => handleBookNow()}
              className="w-full md:hidden mt-4"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Now
            </Button>
          ) : null}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Services */}
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Services</h2>
              {services.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No services available
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div
                      key={service._id}
                      className="p-4 border rounded-lg hover:border-primary-500 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-primary-600">
                          ₹{service.price}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(service.duration)}
                          </span>
                          {service.staffIds?.length > 0 && (
                            <span>
                              {service.staffIds.length} staff available
                            </span>
                          )}
                        </div>

                        {user?.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleBookNow(service._id)}
                          >
                            Book
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About */}
            {business.description && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {business.description}
                </p>
              </div>
            )}

            {/* Gallery */}
            {business.photos && business.photos.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {business.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || `Photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Team Section */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Our Team</h2>
              {isAuthenticated ? (
                staff.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {staff.map((member) => (
                      <div
                        key={member._id}
                        className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-2">
                          {member.user?.profilePicture ? (
                            <img
                              src={member.user.profilePicture}
                              alt={member.user?.name || "Staff"}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          {member.user?.name || "Staff Member"}
                        </h4>
                        {member.specialization && (
                          <p className="text-sm text-gray-600">
                            {member.specialization}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No team members available
                  </p>
                )
              ) : (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                  <Lock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Sign in to view our team members
                  </p>
                  <Link
                    to={`/login?redirect=/business/${slug}`}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="card">
              <h3 className="font-semibold text-lg mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {business.contactPhone && (
                  <a
                    href={`tel:${business.contactPhone}`}
                    className="flex items-center text-gray-700 hover:text-primary-600"
                  >
                    <Phone className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{business.contactPhone}</span>
                  </a>
                )}
                {business.contactEmail && (
                  <a
                    href={`mailto:${business.contactEmail}`}
                    className="flex items-center text-gray-700 hover:text-primary-600"
                  >
                    <Mail className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="truncate">{business.contactEmail}</span>
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-gray-700 hover:text-primary-600"
                  >
                    <Globe className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="truncate">Visit Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Location */}
            {business.address && (
              <div className="card">
                <h3 className="font-semibold text-lg mb-4">Location</h3>
                <div className="flex items-start text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    {business.address.street && (
                      <p>{business.address.street}</p>
                    )}
                    <p>
                      {business.address.city}, {business.address.state}{" "}
                      {business.address.postalCode}
                    </p>
                    {business.address.country && (
                      <p>{business.address.country}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
                  className="w-full"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Get Directions
                </Button>
              </div>
            )}

            {/* Working Hours */}
            {business.workingHours && (
              <div className="card">
                <h3 className="font-semibold text-lg mb-4">Working Hours</h3>
                <div className="space-y-2">
                  {Object.entries(business.workingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize font-medium text-gray-700">
                        {day}
                      </span>
                      <span className="text-gray-600">
                        {hours.isOpen ? (
                          hours.slots && hours.slots.length > 0 ? (
                            `${hours.slots[0].start} - ${
                              hours.slots[hours.slots.length - 1].end
                            }`
                          ) : (
                            "Open"
                          )
                        ) : (
                          <span className="text-red-600">Closed</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPublicProfile;
