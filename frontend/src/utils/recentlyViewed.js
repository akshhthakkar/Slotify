/**
 * Recently Viewed Items - localStorage utility
 * Stores last 3 viewed businesses/services for quick access
 */

const STORAGE_KEY = "slotify_recently_viewed";
const MAX_ITEMS = 3;

/**
 * Get recently viewed items from localStorage
 * @returns {Array} Array of { type, id, name, businessName?, logo?, slug? }
 */
export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading recently viewed:", error);
    return [];
  }
};

/**
 * Add an item to recently viewed
 * @param {string} type - 'business' or 'service'
 * @param {Object} item - The item data
 */
export const addToRecentlyViewed = (type, item) => {
  try {
    const current = getRecentlyViewed();

    // Create standardized entry
    const entry = {
      type,
      id: item._id,
      name: item.name,
      logo: item.logo || item.businessId?.logo || null,
      slug: item.slug || item.businessId?.slug || null,
      businessName: type === "service" ? item.businessId?.name : null,
      businessSlug: type === "service" ? item.businessId?.slug : null,
      addedAt: Date.now(),
    };

    // Remove duplicate if exists
    const filtered = current.filter(
      (i) => !(i.type === type && i.id === item._id)
    );

    // Add to front and limit
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error saving recently viewed:", error);
    return [];
  }
};

/**
 * Clear all recently viewed items
 */
export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing recently viewed:", error);
  }
};
