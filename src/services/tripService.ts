import { supabase, type Place } from '../lib/supabase';
import type { TripData, Activity, Hotel } from '../types/trip';

// Convert database format to app format
function convertDbToTripData(dbTrip: any, dbDays: any[], dbActivities: any[], dbHotels: any[]): TripData & { unassignedActivities: Activity[] } {
  const days = dbDays.map(day => {
    const dayActivities = dbActivities
      .filter(a => a.day_id === day.id)
      .map(a => ({
        id: a.id,
        day: day.day_number,
        type: a.type as Activity['type'],
        name: a.name,
        location: { lat: a.location_lat, lng: a.location_lng },
        time: a.time,
        description: a.description,
        price: a.price,
        rating: a.rating,
        imageUrl: a.image_url,
        googleMapsUrl: a.google_maps_url,
      }));

    const dayHotel = dbHotels.find(h => h.day_id === day.id);
    const hotel = dayHotel ? {
      id: dayHotel.id,
      name: dayHotel.name,
      location: { lat: dayHotel.location_lat, lng: dayHotel.location_lng },
      checkIn: dayHotel.check_in,
      checkOut: dayHotel.check_out,
      price: dayHotel.price,
      bookingUrl: dayHotel.booking_url,
      description: dayHotel.description,
      rating: dayHotel.rating,
      imageUrl: dayHotel.image_url,
    } : undefined;

    return {
      day: day.day_number,
      date: day.date,
      title: day.title,
      activities: dayActivities,
      hotel,
    };
  });

  // Get unassigned activities (bookmarks)
  const unassignedActivities = dbActivities
    .filter(a => a.day_id === null)
    .map(a => ({
      id: a.id,
      day: undefined,
      type: a.type as Activity['type'],
      name: a.name,
      location: { lat: a.location_lat, lng: a.location_lng },
      time: a.time,
      description: a.description,
      price: a.price,
      rating: a.rating,
      imageUrl: a.image_url,
      googleMapsUrl: a.google_maps_url,
    }));

  return {
    title: dbTrip.title,
    destination: dbTrip.destination,
    startDate: dbTrip.start_date,
    endDate: dbTrip.end_date,
    days,
    unassignedActivities,
  };
}

// Load trip data
export async function loadTrip(tripId: string): Promise<TripData | null> {
  try {
    // Load trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError) throw tripError;
    if (!trip) return null;

    // Load days
    const { data: days, error: daysError } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_number');

    if (daysError) throw daysError;

    // Load ALL activities for this trip (both assigned and unassigned)
    // Try using trip_id first (if migration was run), fallback to day_id
    let activities: any[] = [];
    const dayIds = days?.map(d => d.id) || [];

    // First, try to load by trip_id (after migration)
    const { data: activitiesByTrip, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId);

    if (activitiesError) {
      // If trip_id column doesn't exist yet, fallback to day_id only
      console.log('⚠️ trip_id column not found, loading only assigned activities. Run migration to enable bookmarks.');
      const { data: activitiesByDay, error: dayError } = await supabase
        .from('activities')
        .select('*')
        .in('day_id', dayIds);

      if (dayError) throw dayError;
      activities = activitiesByDay || [];
    } else {
      activities = activitiesByTrip || [];
    }

    // Load hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('*')
      .in('day_id', dayIds);

    if (hotelsError) throw hotelsError;

    return convertDbToTripData(trip, days || [], activities || [], hotels || []);
  } catch (error) {
    console.error('Error loading trip:', error);
    return null;
  }
}

// Create initial trip with days
export async function createTrip(tripData: TripData): Promise<string | null> {
  try {
    // Insert trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: tripData.title,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
      })
      .select()
      .single();

    if (tripError) throw tripError;
    if (!trip) throw new Error('Failed to create trip');

    // Insert days
    const daysToInsert = tripData.days.map(day => ({
      trip_id: trip.id,
      day_number: day.day,
      date: day.date,
      title: day.title,
    }));

    const { data: days, error: daysError } = await supabase
      .from('days')
      .insert(daysToInsert)
      .select();

    if (daysError) throw daysError;

    // Insert activities and hotels
    for (let i = 0; i < tripData.days.length; i++) {
      const day = tripData.days[i];
      const dbDay = days?.find(d => d.day_number === day.day);
      if (!dbDay) continue;

      // Insert activities
      if (day.activities.length > 0) {
        const activitiesToInsert = day.activities.map(a => ({
          day_id: dbDay.id,
          name: a.name,
          type: a.type,
          location_lat: a.location.lat,
          location_lng: a.location.lng,
          time: a.time,
          description: a.description,
          price: a.price,
          rating: a.rating,
          image_url: a.imageUrl,
          google_maps_url: a.googleMapsUrl,
        }));

        await supabase.from('activities').insert(activitiesToInsert);
      }

      // Insert hotel
      if (day.hotel) {
        await supabase.from('hotels').insert({
          day_id: dbDay.id,
          name: day.hotel.name,
          location_lat: day.hotel.location.lat,
          location_lng: day.hotel.location.lng,
          check_in: day.hotel.checkIn,
          check_out: day.hotel.checkOut,
          price: day.hotel.price,
          booking_url: day.hotel.bookingUrl,
          description: day.hotel.description,
          rating: day.hotel.rating,
          image_url: day.hotel.imageUrl,
        });
      }
    }

    console.log('✅ Trip created with ID:', trip.id);
    return trip.id;
  } catch (error) {
    console.error('Error creating trip:', error);
    return null;
  }
}

// Add activity result type
export type AddActivityResult = {
  activity: Activity | null;
  isDuplicate: boolean;
};

// Add activity
export async function addActivity(tripId: string, dayId: string | null, activity: Omit<Activity, 'id'>): Promise<AddActivityResult> {
  try {
    // Check for duplicates - same name and location (on the same day if day is specified)
    let duplicateQuery = supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .eq('name', activity.name)
      .eq('location_lat', activity.location.lat)
      .eq('location_lng', activity.location.lng);

    if (dayId) {
      duplicateQuery = duplicateQuery.eq('day_id', dayId);
    } else {
      duplicateQuery = duplicateQuery.is('day_id', null);
    }

    const { data: existing, error: checkError } = await duplicateQuery.maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      console.log('⚠️ Activity already exists, skipping duplicate');
      return {
        activity: {
          id: existing.id,
          day: activity.day,
          type: existing.type,
          name: existing.name,
          location: { lat: existing.location_lat, lng: existing.location_lng },
          time: existing.time,
          description: existing.description,
          price: existing.price,
          rating: existing.rating,
          imageUrl: existing.image_url,
          googleMapsUrl: existing.google_maps_url,
        },
        isDuplicate: true,
      };
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        trip_id: tripId,
        day_id: dayId,
        name: activity.name,
        type: activity.type,
        location_lat: activity.location.lat,
        location_lng: activity.location.lng,
        time: activity.time,
        description: activity.description,
        price: activity.price,
        rating: activity.rating,
        image_url: activity.imageUrl,
        google_maps_url: activity.googleMapsUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      activity: {
        id: data.id,
        day: activity.day,
        type: activity.type,
        name: data.name,
        location: { lat: data.location_lat, lng: data.location_lng },
        time: data.time,
        description: data.description,
        price: data.price,
        rating: data.rating,
        imageUrl: data.image_url,
        googleMapsUrl: data.google_maps_url,
      },
      isDuplicate: false,
    };
  } catch (error) {
    console.error('Error adding activity:', error);
    return { activity: null, isDuplicate: false };
  }
}

// Update activity
export async function updateActivity(activityId: string, updates: Partial<Omit<Activity, 'id'>>): Promise<Activity | null> {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.location !== undefined) {
      updateData.location_lat = updates.location.lat;
      updateData.location_lng = updates.location.lng;
    }
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
    if (updates.googleMapsUrl !== undefined) updateData.google_maps_url = updates.googleMapsUrl;

    const { data, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      day: updates.day || 1, // Will need to fetch from day_id if not provided
      type: data.type,
      name: data.name,
      location: { lat: data.location_lat, lng: data.location_lng },
      time: data.time,
      description: data.description,
      price: data.price,
      rating: data.rating,
      imageUrl: data.image_url,
      googleMapsUrl: data.google_maps_url,
    };
  } catch (error) {
    console.error('Error updating activity:', error);
    return null;
  }
}

// Move activity to different day (or to bookmarks if newDayId is null)
export async function moveActivityToDay(activityId: string, newDayId: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activities')
      .update({ day_id: newDayId })
      .eq('id', activityId);

    if (error) throw error;
    console.log(`✅ Activity moved to ${newDayId ? 'new day' : 'bookmarks'}`);
    return true;
  } catch (error) {
    console.error('Error moving activity:', error);
    return false;
  }
}

// Delete activity
export async function deleteActivity(activityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    return false;
  }
}

// Add hotel result type
export type AddHotelResult = {
  hotel: Hotel | null;
  isDuplicate: boolean;
};

// Add hotel
export async function addHotel(dayId: string, hotel: Omit<Hotel, 'id'>): Promise<AddHotelResult> {
  try {
    // Check for duplicates - same name and location on the same day
    const { data: existing, error: checkError } = await supabase
      .from('hotels')
      .select('*')
      .eq('day_id', dayId)
      .eq('name', hotel.name)
      .eq('location_lat', hotel.location.lat)
      .eq('location_lng', hotel.location.lng)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existing) {
      console.log('⚠️ Hotel already exists, skipping duplicate');
      return {
        hotel: {
          id: existing.id,
          name: existing.name,
          location: { lat: existing.location_lat, lng: existing.location_lng },
          checkIn: existing.check_in,
          checkOut: existing.check_out,
          price: existing.price,
          bookingUrl: existing.booking_url,
          description: existing.description,
          rating: existing.rating,
          imageUrl: existing.image_url,
        },
        isDuplicate: true,
      };
    }

    const { data, error } = await supabase
      .from('hotels')
      .insert({
        day_id: dayId,
        name: hotel.name,
        location_lat: hotel.location.lat,
        location_lng: hotel.location.lng,
        check_in: hotel.checkIn,
        check_out: hotel.checkOut,
        price: hotel.price,
        booking_url: hotel.bookingUrl,
        description: hotel.description,
        rating: hotel.rating,
        image_url: hotel.imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      hotel: {
        id: data.id,
        name: data.name,
        location: { lat: data.location_lat, lng: data.location_lng },
        checkIn: data.check_in,
        checkOut: data.check_out,
        price: data.price,
        bookingUrl: data.booking_url,
        description: data.description,
        rating: data.rating,
        imageUrl: data.image_url,
      },
      isDuplicate: false,
    };
  } catch (error) {
    console.error('Error adding hotel:', error);
    return { hotel: null, isDuplicate: false };
  }
}

// Update hotel
export async function updateHotel(hotelId: string, updates: Partial<Omit<Hotel, 'id'>>): Promise<Hotel | null> {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.location !== undefined) {
      updateData.location_lat = updates.location.lat;
      updateData.location_lng = updates.location.lng;
    }
    if (updates.checkIn !== undefined) updateData.check_in = updates.checkIn;
    if (updates.checkOut !== undefined) updateData.check_out = updates.checkOut;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.bookingUrl !== undefined) updateData.booking_url = updates.bookingUrl;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.rating !== undefined) updateData.rating = updates.rating;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

    const { data, error } = await supabase
      .from('hotels')
      .update(updateData)
      .eq('id', hotelId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      location: { lat: data.location_lat, lng: data.location_lng },
      checkIn: data.check_in,
      checkOut: data.check_out,
      price: data.price,
      bookingUrl: data.booking_url,
      description: data.description,
      rating: data.rating,
      imageUrl: data.image_url,
    };
  } catch (error) {
    console.error('Error updating hotel:', error);
    return null;
  }
}

// Delete hotel
export async function deleteHotel(hotelId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting hotel:', error);
    return false;
  }
}

// Helper to get day ID by trip ID and day number
export async function getDayId(tripId: string, dayNumber: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('days')
      .select('id')
      .eq('trip_id', tripId)
      .eq('day_number', dayNumber)
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error getting day ID:', error);
    return null;
  }
}

// Load places for a trip
export async function loadPlaces(tripId: string): Promise<Place[]> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('trip_id', tripId)
      .order('display_order');

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      lat: p.location_lat,
      lng: p.location_lng,
      days: p.days_count,
    }));
  } catch (error) {
    console.error('Error loading places:', error);
    return [];
  }
}

// Create default places for a trip
export async function createDefaultPlaces(tripId: string): Promise<boolean> {
  try {
    const defaultPlaces = [
      { name: 'Canggu', emoji: '🏖️', color: '#06B6D4', lat: -8.6489, lng: 115.1328, days: 3, order: 1 },
      { name: 'Ubud', emoji: '🌿', color: '#10B981', lat: -8.5069, lng: 115.2625, days: 3, order: 2 },
      { name: 'Munduk', emoji: '🏔️', color: '#8B4513', lat: -8.2661, lng: 115.0717, days: 3, order: 3 },
      { name: 'Sidemen', emoji: '🌾', color: '#84CC16', lat: -8.4833, lng: 115.4167, days: 2, order: 4 },
      { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6', lat: -8.3500, lng: 116.0417, days: 2, order: 5 },
      { name: 'Gili Air', emoji: '🌊', color: '#60A5FA', lat: -8.3614, lng: 116.0861, days: 2, order: 6 },
      { name: 'Nusa Penida', emoji: '⛰️', color: '#1D4ED8', lat: -8.7292, lng: 115.5431, days: 1, order: 7 },
      { name: 'Uluwatu', emoji: '🌅', color: '#F97316', lat: -8.8286, lng: 115.1036, days: 8, order: 8 },
    ];

    const placesToInsert = defaultPlaces.map(p => ({
      trip_id: tripId,
      name: p.name,
      emoji: p.emoji,
      color: p.color,
      location_lat: p.lat,
      location_lng: p.lng,
      days_count: p.days,
      display_order: p.order,
    }));

    const { error } = await supabase
      .from('places')
      .insert(placesToInsert);

    if (error) throw error;

    console.log('✅ Default places created for trip');
    return true;
  } catch (error) {
    console.error('Error creating default places:', error);
    return false;
  }
}
