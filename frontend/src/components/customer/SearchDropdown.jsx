import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building,
  Briefcase,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import api from "../../utils/api";

const SearchDropdown = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ businesses: [], services: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults({ businesses: [], services: [] });
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    // Close on Escape
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const performSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/search?q=${encodeURIComponent(query.trim())}`
      );
      setResults({
        businesses: res.data.businesses || [],
        services: res.data.services || [],
      });
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessClick = (business) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/business/${business.slug || business._id}`);
  };

  const handleServiceClick = (service) => {
    setIsOpen(false);
    setQuery("");
    const businessSlug = service.businessId?.slug || service.businessId?._id;
    navigate(`/book/${businessSlug}/${service._id}`);
  };

  const getVerificationBadge = (status) => {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center text-xs text-green-600">
          <CheckCircle className="w-3 h-3 mr-0.5" />
          Verified
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center text-xs text-yellow-600">
          <Clock className="w-3 h-3 mr-0.5" />
          Pending
        </span>
      );
    }
    return null;
  };

  const hasResults =
    results.businesses.length > 0 || results.services.length > 0;

  return (
    <div className="relative w-full md:w-96" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search businesses or services..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hasResults && setIsOpen(true)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <>
              {/* Businesses Section */}
              {results.businesses.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Building className="w-3 h-3" /> Businesses
                  </div>
                  {results.businesses.map((biz) => (
                    <button
                      key={biz._id}
                      onClick={() => handleBusinessClick(biz)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      {biz.logo ? (
                        <img
                          src={biz.logo}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-bold">
                            {biz.name?.[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {biz.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{biz.category}</span>
                          {getVerificationBadge(biz.verification?.status)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Services Section */}
              {results.services.length > 0 && (
                <div>
                  <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> Services
                  </div>
                  {results.services.map((svc) => (
                    <button
                      key={svc._id}
                      onClick={() => handleServiceClick(svc)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {svc.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{svc.businessId?.name}</span>
                          {getVerificationBadge(
                            svc.businessId?.verification?.status
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary-600">
                        ₹{svc.price}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
