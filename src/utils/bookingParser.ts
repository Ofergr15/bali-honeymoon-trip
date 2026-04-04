// Utility functions for parsing Booking.com URLs

interface BookingDates {
  checkIn?: string; // YYYY-MM-DD format
  checkOut?: string; // YYYY-MM-DD format
}

/**
 * Extract check-in and check-out dates from a Booking.com URL
 * Example URL: https://www.booking.com/hotel/id/property.html?checkin=2026-05-10&checkout=2026-05-13
 */
export function parseBookingUrl(url: string): BookingDates {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const checkIn = params.get('checkin');
    const checkOut = params.get('checkout');

    return {
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
    };
  } catch (error) {
    console.error('Failed to parse Booking.com URL:', error);
    return {};
  }
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Calculate total price from per-night rate and dates
 */
export function calculateTotalPrice(pricePerNight: number, checkIn: string, checkOut: string): number {
  const nights = calculateNights(checkIn, checkOut);
  return nights > 0 ? pricePerNight * nights : 0;
}

/**
 * Format price with commas (e.g., 1250 -> "1,250")
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
