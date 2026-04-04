import { useState, useEffect, useMemo } from 'react';
import Map from './components/Map';
import ItinerarySidebar from './components/ItinerarySidebar';
import DetailsPanel from './components/DetailsPanel';
import AddPlaceForm from './components/AddPlaceForm';
import EditPlaceForm from './components/EditPlaceForm';
import BookmarksPanel from './components/BookmarksPanel';
import DayNavigationBar from './components/DayNavigationBar';
import TripSettingsModal from './components/TripSettingsModal';
import { baliTripData } from './data/tripData';
import type { Activity, Hotel, TripData } from './types/trip';
import { Plus, Menu, X, Share2, Download, Settings, Bookmark, User as UserIcon, LogOut } from 'lucide-react';
import { loadTrip, createTrip, addActivity, addHotel, updateActivity, updateHotel, moveActivityToDay, deleteActivity, deleteHotel, getDayId } from './services/tripService';
import { supabase } from './lib/supabase';
import { cleanupDatabase, verifyDatabase } from './services/cleanupDatabase';
import { useAuth } from './contexts/AuthContext';
import './App.css';

const STORAGE_KEY = 'bali-trip-data';
const TRIP_ID_KEY = 'bali-trip-id';
const DATA_VERSION = 'v7'; // Increment this to force reload fresh data

// Helper function to get place name from day
function getPlaceName(day: any): string {
  if (day.hotel) {
    const name = day.hotel.name;
    if (name.includes('Canggu')) return 'Canggu';
    if (name.includes('Ubud') || name.includes('Sayan')) return 'Ubud';
    if (name.includes('Munduk')) return 'Munduk';
    if (name.includes('Sidemen') || name.includes('Samanvaya')) return 'Sidemen';
    if (name.includes('Gili Trawangan') || name.includes('Almarik')) return 'Gili Trawangan';
    if (name.includes('Gili Air')) return 'Gili Air';
    if (name.includes('Nusa Penida') || name.includes('Warnakali')) return 'Nusa Penida';
    if (name.includes('Uluwatu') || name.includes('Bulgari')) return 'Uluwatu';
  }
  if (day.title.includes('Canggu')) return 'Canggu';
  if (day.title.includes('Ubud')) return 'Ubud';
  if (day.title.includes('Munduk')) return 'Munduk';
  if (day.title.includes('Sidemen')) return 'Sidemen';
  if (day.title.includes('Gili Trawangan')) return 'Gili Trawangan';
  if (day.title.includes('Gili Air')) return 'Gili Air';
  if (day.title.includes('Nusa Penida')) return 'Nusa Penida';
  if (day.title.includes('Uluwatu')) return 'Uluwatu';
  if (day.title.includes('Denpasar') || day.title.includes('Airport')) return 'Denpasar Airport';
  return 'Other';
}

// Get emoji for each place
function getPlaceEmoji(placeName: string): string {
  const emojiMap: Record<string, string> = {
    'Canggu': '🏖️',
    'Ubud': '🌿',
    'Munduk': '🏔️',
    'Sidemen': '🌾',
    'Gili Trawangan': '🏝️',
    'Gili Air': '🌊',
    'Nusa Penida': '⛰️',
    'Uluwatu': '🌅',
    'Denpasar Airport': '✈️',
  };
  return emojiMap[placeName] || '📍';
}

function App() {
  const { user, signOut, canEdit } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Activity | Hotel | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [showBookmarksOnMap, setShowBookmarksOnMap] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Activity | Hotel | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Track if Supabase is configured
  const [isSupabaseConfigured] = useState(() => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  });

  // Track trip ID from database
  const [tripId, setTripId] = useState<string | null>(() => {
    return localStorage.getItem(TRIP_ID_KEY);
  });

  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Load trip data from Supabase or localStorage
  const [tripData, setTripData] = useState<TripData>(baliTripData);

  // Cleanup database - remove duplicate trips
  const handleCleanupDatabase = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase not configured');
      return;
    }

    const confirmed = confirm(
      '⚠️ DATABASE CLEANUP\n\n' +
      'This will:\n' +
      '1. Find the trip with the most data\n' +
      '2. Delete all duplicate trips\n' +
      '3. Clean up orphaned data\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setCleaningUp(true);
    console.log('🧹 Starting database cleanup...');

    const result = await cleanupDatabase();

    if (result.success && result.keptTripId) {
      console.log(`✅ Cleanup complete! Kept trip ${result.keptTripId}, deleted ${result.deletedTrips} duplicates`);

      if (result.errors.length > 0) {
        console.warn('⚠️ Cleanup had some errors:', result.errors);
      }

      // Update to use the kept trip
      setTripId(result.keptTripId);
      localStorage.setItem(TRIP_ID_KEY, result.keptTripId);

      // Reload the trip data
      const data = await loadTrip(result.keptTripId);
      if (data) {
        setTripData(data);
        alert(`✅ Cleanup complete!\n\nKept 1 trip with ${data.days.length} days\nDeleted ${result.deletedTrips} duplicate trips`);
      }

      // Verify database
      const verification = await verifyDatabase();
      console.log('📊 Database verification:', verification);
    } else {
      console.error('❌ Cleanup failed:', result.errors);
      alert(`❌ Cleanup failed:\n\n${result.errors.join('\n')}`);
    }

    setCleaningUp(false);
  };

  // Load trip data on mount
  useEffect(() => {
    async function initializeTrip() {
      setLoading(true);

      if (isSupabaseConfigured) {
        console.log('🚀 Supabase configured - loading from database');
        console.log('📌 SINGLETON MODE: Only 1 trip allowed');

        try {
          // SIMPLIFIED LOGIC: Find ANY trip, use the first one (oldest)
          const { data: existingTrips, error } = await supabase
            .from('trips')
            .select('id, created_at')
            .order('created_at', { ascending: true })
            .limit(1);

          if (error) throw error;

          if (existingTrips && existingTrips.length > 0) {
            // Found existing trip(s) - use the first (oldest)
            const existingTripId = existingTrips[0].id;
            console.log('✅ Found existing trip:', existingTripId);

            setTripId(existingTripId);
            localStorage.setItem(TRIP_ID_KEY, existingTripId);

            const data = await loadTrip(existingTripId);
            if (data) {
              console.log('✅ Trip loaded with', data.days.length, 'days,', data.unassignedActivities?.length || 0, 'bookmarks');
              setTripData(data);
            } else {
              console.error('❌ Failed to load trip');
              setTripData(baliTripData);
            }
          } else {
            // No trip exists - create the FIRST one
            console.log('📝 No trip exists - creating first trip...');
            const newTripId = await createTrip(baliTripData);

            if (newTripId) {
              console.log('✅ Trip created with ID:', newTripId);
              setTripId(newTripId);
              localStorage.setItem(TRIP_ID_KEY, newTripId);
              setTripData(baliTripData);
            } else {
              console.error('❌ Failed to create trip');
              setTripData(baliTripData);
            }
          }
        } catch (error) {
          console.error('❌ Error during initialization:', error);
          loadFromLocalStorage();
        }
      } else {
        console.log('💾 Supabase not configured - using localStorage');
        loadFromLocalStorage();
      }

      setLoading(false);
    }

    function loadFromLocalStorage() {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedVersion = localStorage.getItem(STORAGE_KEY + '-version');

      if (savedVersion !== DATA_VERSION) {
        localStorage.setItem(STORAGE_KEY + '-version', DATA_VERSION);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(baliTripData));
        setTripData(baliTripData);
        return;
      }

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed.days.length !== baliTripData.days.length ||
            parsed.startDate !== baliTripData.startDate ||
            parsed.endDate !== baliTripData.endDate
          ) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(baliTripData));
            setTripData(baliTripData);
          } else {
            setTripData(parsed);
          }
        } catch {
          setTripData(baliTripData);
        }
      }
    }

    initializeTrip();
  }, [isSupabaseConfigured, tripId]);

  // Save to localStorage whenever tripData changes (fallback/backup)
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData));
    }
  }, [tripData, loading]);

  // Collect all activities and hotels from the trip data
  const allActivities = useMemo(() =>
    tripData.days.flatMap(day => day.activities),
    [tripData]
  );

  const allHotels = useMemo(() =>
    tripData.days
      .filter(day => day.hotel)
      .map(day => day.hotel!),
    [tripData]
  );

  // Calculate which days belong to the selected place
  const placeDays = useMemo(() => {
    if (!selectedPlace) return undefined;
    return tripData.days
      .filter(day => getPlaceName(day) === selectedPlace)
      .map(day => day.day);
  }, [selectedPlace, tripData.days]);

  const handleDaySelect = (day: number | null) => {
    setSelectedDay(day);
    setSelectedPlace(null); // Clear place filter when day is selected
    setSelectedItem(null);
  };

  const handlePlaceSelect = (place: string | null) => {
    setSelectedPlace(place);
    setSelectedDay(null); // Clear day filter when place is selected
    setSelectedItem(null);
    // Open sidebar when a place is selected
    if (place) {
      setSidebarOpen(true);
    }
  };

  const handleMarkerClick = (item: Activity | Hotel) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleAddActivity = async (activity: Omit<Activity, 'id'>) => {
    if (isSupabaseConfigured && tripId) {
      // Save to Supabase
      let dayId: string | null = null;

      if (activity.day) {
        // Activity is assigned to a specific day
        dayId = await getDayId(tripId, activity.day);
      }
      // If activity.day is undefined, dayId stays null (bookmark)

      const result = await addActivity(tripId, dayId, activity);
      if (result.activity) {
        if (result.isDuplicate) {
          // Show alert for duplicate
          const location = activity.day ? `Day ${activity.day}` : 'bookmarks';
          alert(`⚠️ This activity already exists!\n\n"${activity.name}" is already added to ${location}.`);
          setShowAddForm(false);
          return;
        }

        console.log('✅ Activity saved to database');

        // Update local state
        if (activity.day) {
          // Add to specific day
          setTripData(prev => ({
            ...prev,
            days: prev.days.map(day =>
              day.day === activity.day
                ? { ...day, activities: [...day.activities, result.activity!] }
                : day
            ),
          }));
        } else {
          // Add to unassigned activities (bookmarks)
          setTripData(prev => ({
            ...prev,
            unassignedActivities: [...(prev.unassignedActivities || []), result.activity!],
          }));
        }

        setShowAddForm(false);
        return;
      }
      console.error('❌ Failed to save activity to database');
    }

    // Fallback to localStorage
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    if (activity.day) {
      // Add to specific day
      setTripData(prev => ({
        ...prev,
        days: prev.days.map(day =>
          day.day === activity.day
            ? { ...day, activities: [...day.activities, newActivity] }
            : day
        ),
      }));
    } else {
      // Add to bookmarks
      setTripData(prev => ({
        ...prev,
        unassignedActivities: [...(prev.unassignedActivities || []), newActivity],
      }));
    }

    setShowAddForm(false);
  };

  const handleAddHotel = async (hotel: Omit<Hotel, 'id'>) => {
    const checkInDate = new Date(hotel.checkIn);
    const dayToAddHotel = tripData.days.find(day => {
      const dayDate = new Date(day.date);
      return dayDate.toDateString() === checkInDate.toDateString();
    });

    if (!dayToAddHotel) return;

    if (isSupabaseConfigured && tripId) {
      // Save to Supabase
      const dayId = await getDayId(tripId, dayToAddHotel.day);
      if (dayId) {
        const result = await addHotel(dayId, hotel);
        if (result.hotel) {
          if (result.isDuplicate) {
            // Show alert for duplicate
            alert(`⚠️ This hotel already exists!\n\n"${hotel.name}" is already added for this date.`);
            setShowAddForm(false);
            return;
          }

          console.log('✅ Hotel saved to database');
          // Update local state
          setTripData(prev => ({
            ...prev,
            days: prev.days.map(day =>
              day.day === dayToAddHotel.day
                ? { ...day, hotel: result.hotel! }
                : day
            ),
          }));
          setShowAddForm(false);
          return;
        }
      }
      console.error('❌ Failed to save hotel to database');
    }

    // Fallback to localStorage
    const newHotel: Hotel = {
      ...hotel,
      id: `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setTripData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.day === dayToAddHotel.day
          ? { ...day, hotel: newHotel }
          : day
      ),
    }));

    setShowAddForm(false);
  };

  const handleSaveTripSettings = (newTripData: TripData) => {
    setTripData(newTripData);
    setShowReorderModal(false);
  };

  const handleDeletePlace = async (item: Activity | Hotel) => {
    if (isSupabaseConfigured) {
      // Delete from Supabase
      const isActivity = 'type' in item;
      const success = isActivity
        ? await deleteActivity(item.id)
        : await deleteHotel(item.id);

      if (success) {
        console.log(`✅ ${isActivity ? 'Activity' : 'Hotel'} deleted from database`);
      } else {
        console.error(`❌ Failed to delete ${isActivity ? 'activity' : 'hotel'} from database`);
      }
    }

    // Update local state
    // Remove from local state (days and bookmarks)
    setTripData(prev => ({
      ...prev,
      days: prev.days.map(day => {
        // Check if it's an activity
        if ('type' in item) {
          // Remove activity
          return {
            ...day,
            activities: day.activities.filter(a => a.id !== item.id)
          };
        } else {
          // Remove hotel
          return {
            ...day,
            hotel: day.hotel?.id === item.id ? undefined : day.hotel
          };
        }
      }),
      // Also remove from bookmarks if it's an activity
      unassignedActivities: 'type' in item
        ? (prev.unassignedActivities || []).filter(a => a.id !== item.id)
        : prev.unassignedActivities,
    }));
  };

  const handleEditPlace = (item: Activity | Hotel) => {
    setItemToEdit(item);
    setShowEditForm(true);
    setSelectedItem(null); // Close details panel
  };

  const handleUpdateActivity = async (activity: Activity) => {
    if (isSupabaseConfigured && tripId) {
      // Find original activity (could be in days or bookmarks)
      const originalActivityInDay = tripData.days
        .flatMap(d => d.activities)
        .find(a => a.id === activity.id);
      const originalActivityInBookmarks = tripData.unassignedActivities?.find(a => a.id === activity.id);
      const originalActivity = originalActivityInDay || originalActivityInBookmarks;

      if (originalActivity && originalActivity.day !== activity.day) {
        // Day changed - need to move activity
        const newDayId = activity.day ? await getDayId(tripId, activity.day) : null;
        const moved = await moveActivityToDay(activity.id, newDayId);
        if (moved) {
          console.log(`✅ Activity moved from day ${originalActivity.day || 'bookmarks'} to ${activity.day || 'bookmarks'}`);
        }
      }

      // Update activity details
      const updated = await updateActivity(activity.id, activity);
      if (updated) {
        console.log('✅ Activity updated in database');
      } else {
        console.error('❌ Failed to update activity');
      }
    }

    // Update local state - remove from old location, add to new location
    setTripData(prev => {
      // Remove from all days and bookmarks
      const newDays = prev.days.map(day => ({
        ...day,
        activities: day.activities.filter(a => a.id !== activity.id),
      }));
      const newBookmarks = (prev.unassignedActivities || []).filter(a => a.id !== activity.id);

      // Add to new location
      if (activity.day) {
        // Add to specific day
        return {
          ...prev,
          days: newDays.map(day =>
            day.day === activity.day
              ? { ...day, activities: [...day.activities, activity] }
              : day
          ),
          unassignedActivities: newBookmarks,
        };
      } else {
        // Add to bookmarks
        return {
          ...prev,
          days: newDays,
          unassignedActivities: [...newBookmarks, activity],
        };
      }
    });

    setShowEditForm(false);
    setItemToEdit(null);
  };

  const handleUpdateHotel = async (hotel: Hotel) => {
    if (isSupabaseConfigured) {
      // Update in Supabase
      const updated = await updateHotel(hotel.id, hotel);
      if (updated) {
        console.log('✅ Hotel updated in database');
      } else {
        console.error('❌ Failed to update hotel');
      }
    }

    // Update local state
    setTripData(prev => ({
      ...prev,
      days: prev.days.map(day => ({
        ...day,
        hotel: day.hotel?.id === hotel.id ? hotel : day.hotel,
      })),
    }));

    setShowEditForm(false);
    setItemToEdit(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-travel-teal mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your trip...</p>
          {isSupabaseConfigured && <p className="text-gray-400 text-sm mt-2">Connecting to database</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Premium Top Navigation Bar */}
      <header className="relative bg-gradient-to-br from-teal-400/10 via-cyan-300/10 to-blue-400/10 border-b border-gray-100 sticky top-0 z-50 shadow-premium-sm backdrop-blur-sm overflow-visible">

        <div className="relative px-6 py-2 overflow-visible">
          <div className="flex items-start justify-between max-w-screen-2xl mx-auto overflow-visible">
            {/* Left: Trip Title & Info */}
            <div className="flex items-center gap-8 overflow-visible flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex-1 overflow-visible">
                <div className="flex items-center gap-4 mb-1">
                  <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
                    {tripData.title}
                    {selectedPlace && (
                      <span className="ml-3 text-sm font-normal text-travel-teal">
                        • {getPlaceEmoji(selectedPlace)} {selectedPlace}
                      </span>
                    )}
                  </h1>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">📍</span>
                    {tripData.destination}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>
                    {new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tripData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-gray-700">{tripData.days.length} Days</span>
                </div>

                {/* Trip Timeline */}
                <div className="max-w-2xl overflow-visible">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-gray-700">May 6</span>
                    {selectedPlace && (
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-travel-teal/10 rounded-full">
                        <span className="text-travel-teal font-bold text-xs">
                          {getPlaceEmoji(selectedPlace)} {selectedPlace}
                        </span>
                      </div>
                    )}
                    <span className="font-semibold text-gray-700">May 30</span>
                  </div>
                  <div className="relative pt-6 overflow-visible">
                    <div className="flex items-center h-3 rounded-full shadow-sm relative overflow-visible">
                      {(() => {
                        // Build location segments
                        const segments: Array<{ place: string; days: number; startDay: number; color: string }> = [];
                        let currentPlace = '';
                        let dayCount = 0;
                        let startDay = 1;

                        tripData.days.forEach((day, idx) => {
                          const place = getPlaceName(day);
                          // Skip "Other" places - they'll be counted as unplanned
                          if (place === 'Other') {
                            return;
                          }

                          if (place !== currentPlace) {
                            if (dayCount > 0 && currentPlace !== 'Other') {
                              segments.push({ place: currentPlace, days: dayCount, startDay, color: '' });
                              startDay += dayCount;
                            }
                            currentPlace = place;
                            dayCount = 0;
                          }
                          dayCount++;

                          if (idx === tripData.days.length - 1 && currentPlace !== 'Other') {
                            segments.push({ place: currentPlace, days: dayCount, startDay, color: '' });
                          }
                        });

                        const placeColors: Record<string, string> = {
                          'Canggu': '#06B6D4',
                          'Ubud': '#10B981',
                          'Munduk': '#8B4513',
                          'Sidemen': '#84CC16',
                          'Gili Trawangan': '#3B82F6',
                          'Gili Air': '#60A5FA',
                          'Nusa Penida': '#1D4ED8',
                          'Uluwatu': '#F97316',
                        };

                        // Original trip was May 6 to May 30 = 25 days
                        // Use this as the reference for 100% width
                        const originalTripDays = 25;

                        // Calculate total planned days
                        const totalPlannedDays = segments.reduce((sum, seg) => sum + seg.days, 0);
                        const unplannedDays = originalTripDays - totalPlannedDays;

                        return (
                          <>
                            {segments.map((segment, idx) => {
                              // Calculate percentage based on original trip length
                              // So 20 days = 80%, 15 days = 60%, etc.
                              const percentage = (segment.days / originalTripDays) * 100;
                              const isActiveSegment = selectedPlace === segment.place;

                              return (
                                <div
                                  key={idx}
                                  className={`h-full transition-all relative group/segment cursor-pointer ${isActiveSegment ? 'z-10' : 'z-0'}`}
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: placeColors[segment.place] || '#6B7280',
                                    opacity: selectedPlace ? (isActiveSegment ? 1 : 0.3) : 0.75,
                                    filter: isActiveSegment ? 'brightness(1.1)' : 'none',
                                    boxShadow: isActiveSegment ? '0 0 0 2px white, 0 0 0 4px ' + (placeColors[segment.place] || '#6B7280') : 'none',
                                    borderTopLeftRadius: idx === 0 ? '9999px' : '0',
                                    borderBottomLeftRadius: idx === 0 ? '9999px' : '0',
                                    borderTopRightRadius: idx === segments.length - 1 && unplannedDays === 0 ? '9999px' : '0',
                                    borderBottomRightRadius: idx === segments.length - 1 && unplannedDays === 0 ? '9999px' : '0',
                                  }}
                                >
                                  {/* Day range label on hover or when selected */}
                                  {segment.days >= 2 && (
                                    <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white transition-opacity pointer-events-none ${
                                      isActiveSegment ? 'opacity-100' : 'opacity-0 group-hover/segment:opacity-100'
                                    }`}>
                                      {segment.days}d
                                    </div>
                                  )}

                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-2xl opacity-0 group-hover/segment:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[200] border border-gray-700">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg">{getPlaceEmoji(segment.place)}</span>
                                      <span className="font-bold text-base">{segment.place}</span>
                                    </div>
                                    <div className="text-gray-300 text-xs">
                                      {(() => {
                                        const startDate = new Date(tripData.startDate);
                                        startDate.setDate(startDate.getDate() + segment.startDay - 1);
                                        const endDate = new Date(startDate);
                                        endDate.setDate(endDate.getDate() + segment.days - 1);
                                        return (
                                          <>
                                            <span className="font-semibold">{segment.days}</span> {segment.days === 1 ? 'day' : 'days'} • {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </>
                                        );
                                      })()}
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5">
                                      <div className="w-3 h-3 bg-gray-900 rotate-45 border-b border-r border-gray-700"></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Unplanned days section */}
                            {unplannedDays > 0 && (
                              <div
                                className="h-full relative group cursor-default"
                                style={{
                                  width: `${(unplannedDays / originalTripDays) * 100}%`,
                                  backgroundColor: '#D1D5DB',
                                  opacity: 0.8,
                                  borderTopRightRadius: '9999px',
                                  borderBottomRightRadius: '9999px',
                                }}
                              >
                                {/* Unplanned label */}
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600 transition-opacity opacity-90 group-hover:opacity-100">
                                  {unplannedDays}d
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] border border-gray-700">
                                  <div className="font-bold text-sm mb-0.5 text-orange-400">⚠️ Unplanned Days</div>
                                  <div className="text-gray-300 text-xs">
                                    {(() => {
                                      const unplannedStartDate = new Date(tripData.startDate);
                                      unplannedStartDate.setDate(unplannedStartDate.getDate() + totalPlannedDays);
                                      const unplannedEndDate = new Date(tripData.endDate);
                                      return (
                                        <>
                                          <span className="font-semibold text-orange-300">{unplannedDays}</span> {unplannedDays === 1 ? 'day' : 'days'} • {unplannedStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {unplannedEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </>
                                      );
                                    })()}
                                  </div>
                                  {/* Arrow */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5">
                                    <div className="w-3 h-3 bg-gray-900 rotate-45 border-b border-r border-gray-700"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Position indicator when place is selected */}
                    {selectedPlace && (() => {
                      let cumulativeDays = 0;
                      let selectedStartDay = 0;
                      let selectedDays = 0;

                      tripData.days.forEach((day) => {
                        const place = getPlaceName(day);
                        if (place === selectedPlace) {
                          if (selectedDays === 0) {
                            selectedStartDay = cumulativeDays;
                          }
                          selectedDays++;
                        }
                        cumulativeDays++;
                      });

                      const position = ((selectedStartDay + selectedDays / 2) / tripData.days.length) * 100;

                      return (
                        <div
                          className="absolute top-full mt-1.5 transform -translate-x-1/2 transition-all"
                          style={{ left: `${position}%` }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-2 bg-travel-teal"></div>
                            <div className="text-[10px] font-bold text-travel-teal whitespace-nowrap mt-0.5">
                              Days {selectedStartDay + 1}-{selectedStartDay + selectedDays}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: User Profile (Top) and Action Buttons (Bottom) */}
            <div className="flex flex-col items-end gap-2">
              {/* User Profile Dropdown - Top Right */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-xs">
                        {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-premium-lg border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user?.displayName || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</div>
                        <div className="mt-2">
                          <span className={`text-xs font-semibold ${
                            user?.role === 'super_user' ? 'text-yellow-600' :
                            user?.role === 'admin' ? 'text-purple-600' :
                            user?.role === 'editor' ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {user?.role === 'super_user' ? 'Super User' :
                             user?.role === 'admin' ? 'Admin' :
                             user?.role === 'editor' ? 'Editor' :
                             'Viewer'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await signOut();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
              <button
                disabled
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-400 rounded-lg cursor-not-allowed opacity-50"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                disabled
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-400 rounded-lg cursor-not-allowed opacity-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowReorderModal(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                title="Reorder Places"
              >
                <Settings className="w-4 h-4" />
              </button>
              {isSupabaseConfigured && isSuperUser && (
                <button
                  onClick={handleCleanupDatabase}
                  disabled={cleaningUp}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Cleanup Database - Remove duplicate trips"
                >
                  {cleaningUp ? '🧹 Cleaning...' : '🧹 Cleanup DB'}
                </button>
              )}
              <button
                onClick={() => setShowBookmarksOnMap(!showBookmarksOnMap)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-premium-sm ${
                  showBookmarksOnMap
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
                title="Show bookmarks on map"
              >
                <span className="text-base">📌</span>
                <span className="hidden sm:inline">{showBookmarksOnMap ? 'Hide' : 'Show'} Pins</span>
              </button>
              <button
                onClick={() => {
                  setShowBookmarksPanel(true);
                  setShowBookmarksOnMap(true); // Also show pins on map
                  setSelectedItem(null); // Close details panel when opening bookmarks
                }}
                className="relative flex items-center gap-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-yellow-500 hover:to-amber-600 transition-all shadow-premium-sm"
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
                {tripData.unassignedActivities && tripData.unassignedActivities.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-sm">
                    {tripData.unassignedActivities.length}
                  </span>
                )}
              </button>

              {canEdit && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-travel-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0c8c8c] transition-colors shadow-premium-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Place</span>
                </button>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Place Navigation - Horizontal Scroll */}
        <div className="relative border-t border-gray-100 bg-white/80 backdrop-blur-sm px-6 py-2">
          <div className="relative max-w-screen-2xl mx-auto">
            <DayNavigationBar
              days={tripData.days}
              selectedDay={selectedDay}
              selectedPlace={selectedPlace}
              onDaySelect={handleDaySelect}
              onPlaceSelect={handlePlaceSelect}
            />
          </div>
        </div>
      </header>

      {/* Viewer Banner */}
      {user?.role === 'viewer' && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-center">
          <span className="text-sm text-blue-800 font-medium">
            👁️ You're viewing this trip as <strong>View-Only</strong>. Contact admin for edit access.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Sidebar - Right Side */}
        {sidebarOpen && (
          <div className="absolute right-6 top-6 bottom-6 w-96 z-20 pointer-events-none animate-slide-up">
            <div className="h-full pointer-events-auto">
              <ItinerarySidebar
                days={tripData.days}
                selectedDay={selectedDay}
                selectedPlace={selectedPlace}
                onDaySelect={handleDaySelect}
                onClose={() => setSidebarOpen(false)}
                onActivityClick={(item) => setSelectedItem(item)}
              />
            </div>
          </div>
        )}

        {/* Map - Full Width */}
        <div className="flex-1 relative bg-gray-50">
          <Map
            activities={allActivities}
            hotels={allHotels}
            bookmarks={tripData.unassignedActivities}
            showBookmarks={showBookmarksOnMap}
            selectedDay={selectedDay || undefined}
            selectedPlace={selectedPlace || undefined}
            placeDays={placeDays}
            days={tripData.days}
            onMarkerClick={handleMarkerClick}
            selectedItem={selectedItem}
          />
        </div>

        {/* Toggle Sidebar Button (when closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-6 top-6 z-20 bg-white p-3 rounded-xl shadow-premium-lg border border-gray-100 hover:shadow-premium-lg hover:scale-105 transition-all"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Details Panel - Floating Left Side */}
        {selectedItem && (
          <div className="absolute left-6 top-6 bottom-6 z-30 w-full max-w-md animate-slide-up pointer-events-none">
            <div className="h-full pointer-events-auto overflow-hidden">
              <DetailsPanel
                item={selectedItem}
                onClose={handleCloseDetails}
                onDelete={canEdit ? handleDeletePlace : undefined}
                onEdit={canEdit ? handleEditPlace : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Add Place Form Modal */}
      {showAddForm && (
        <AddPlaceForm
          onAddActivity={handleAddActivity}
          onAddHotel={handleAddHotel}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Place Form Modal */}
      {showEditForm && itemToEdit && (
        <EditPlaceForm
          item={itemToEdit}
          onUpdate={(item: Activity | Hotel) => {
            if ('type' in item) {
              handleUpdateActivity(item as Activity);
            } else {
              handleUpdateHotel(item as Hotel);
            }
          }}
          onClose={() => {
            setShowEditForm(false);
            setItemToEdit(null);
          }}
          tripDays={tripData.days.length}
        />
      )}

      {/* Bookmarks Panel */}
      {showBookmarksPanel && (
        <BookmarksPanel
          bookmarks={tripData.unassignedActivities || []}
          onClose={() => setShowBookmarksPanel(false)}
          onBookmarkClick={(activity) => {
            setSelectedItem(activity);
            setShowBookmarksPanel(false);
          }}
        />
      )}

      {/* Trip Settings Modal */}
      {showReorderModal && (
        <TripSettingsModal
          tripData={tripData}
          onSave={handleSaveTripSettings}
          onClose={() => setShowReorderModal(false)}
        />
      )}
    </div>
  );
}

export default App;
