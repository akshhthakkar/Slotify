import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Building,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Button from "../common/Button";
import { addToRecentlyViewed } from "../../utils/recentlyViewed";

/**
 * Display a verified badge if applicable
 */
const VerificationBadge = ({ status }) => {
  if (status === "verified") {
    return (
      <span
        title="Verified Business"
        className="inline-flex items-center ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200"
      >
        <ShieldCheck className="w-3 h-3 mr-0.5" />
        VERIFIED
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        title="Verification Pending"
        className="inline-flex items-center ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200"
      >
        <Clock className="w-3 h-3 mr-0.5" />
        PENDING
      </span>
    );
  }
  return null;
};

/**
 * Card for displaying a Business in list/grid
 */
export const BusinessCard = ({ business }) => {
  const handleClick = () => {
    addToRecentlyViewed("business", business);
  };

  return (
    <Link
      to={`/business/${business.slug || business._id}`}
      className="block group h-full"
      onClick={handleClick}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Cover Photo */}
        <div className="h-32 bg-gray-100 relative overflow-hidden">
          {business.coverPhoto ? (
            <img
              src={business.coverPhoto}
              alt={business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Building className="w-8 h-8 text-gray-300" />
            </div>
          )}
          {/* Logo Overlay */}
          <div className="absolute -bottom-6 left-4">
            <div className="w-16 h-16 rounded-xl border-4 border-white bg-white overflow-hidden shadow-sm">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt="logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-xl">
                  {business.name?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-8 pb-4 px-4 flex-grow flex flex-col">
          <div className="mb-2">
            <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors flex items-center">
              {business.name}
              <VerificationBadge status={business.verification?.status} />
            </h3>
            <p className="text-sm text-gray-500">{business.category}</p>
          </div>

          <div className="mt-auto space-y-2">
            {business.address?.city && (
              <div className="flex items-start text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 mr-1 mt-0.5 text-gray-400" />
                <span>
                  {business.address.city}, {business.address.state}
                </span>
              </div>
            )}
            {business.rating > 0 && (
              <div className="flex items-center text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded w-fit">
                <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{business.rating}</span>
                <span className="text-gray-400 mx-1">•</span>
                <span className="text-gray-500">0 reviews</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * Card for displaying a Service
 */
export const ServiceCard = ({ service }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-500">{service.duration} mins</p>
        </div>
        <div className="text-right">
          <span className="block font-bold text-primary-600">
            ₹{service.price}
          </span>
        </div>
      </div>

      <div className="my-3 border-t border-gray-50 pt-3">
        <Link
          to={`/business/${
            service.businessId?.slug || service.businessId?._id
          }`}
          className="flex items-center group/biz"
        >
          {service.businessId?.logo ? (
            <img
              src={service.businessId.logo}
              alt=""
              className="w-8 h-8 rounded-lg object-cover mr-2"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-2 text-xs font-bold text-gray-500">
              {service.businessId?.name?.charAt(0)}
            </div>
          )}
          <div className="text-sm">
            <p className="font-medium text-gray-900 group-hover/biz:text-primary-600 transition-colors flex items-center">
              {service.businessId?.name}
              <VerificationBadge
                status={service.businessId?.verification?.status}
              />
            </p>
          </div>
        </Link>
      </div>

      <Link
        to={`/book/${
          service.businessId?.slug || service.businessId?._id
        }?serviceId=${service._id}`}
        className="block mt-3"
        onClick={() => addToRecentlyViewed("service", service)}
      >
        <Button
          variant="outline"
          size="small"
          className="w-full justify-center"
        >
          Book Now
        </Button>
      </Link>
    </div>
  );
};
