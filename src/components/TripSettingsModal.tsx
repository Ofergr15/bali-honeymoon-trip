import { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Plus, Minus, Eye, EyeOff, RefreshCw, MapPin } from 'lucide-react';
import type { TripData, DayExpense } from '../types/trip';
import BookingStatusView from './BookingStatusView';
import DailyExpensesTracker from './DailyExpensesTracker';
import BudgetDashboardV2 from './BudgetDashboardV2';
import TripDashboard from './TripDashboard';
import UserManagement from './UserManagement';
import { useAuth } from '../contexts/AuthContext';
import { refreshAllImages } from '../utils/refreshAllImages';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TripSettingsModalProps {
  tripData: TripData;
  onSave: (newTripData: TripData) => void;
  onClose: () => void;
}

interface PlaceConfig {
  id: string; // Unique identifier for each place
  name: string;
  emoji: string;
  days: number;
  color: string;
  hidden: boolean;
}

// Get place name from day title
function getPlaceName(title: string): string {
  if (title.includes('Canggu')) return 'Canggu';
  if (title.includes('Ubud')) return 'Ubud';
  if (title.includes('Munduk')) return 'Munduk';
  if (title.includes('Sidemen')) return 'Sidemen';
  if (title.includes('Gili Trawangan')) return 'Gili Trawangan';
  if (title.includes('Gili Air')) return 'Gili Air';
  if (title.includes('Nusa Penida')) return 'Nusa Penida';
  if (title.includes('Uluwatu') || title.includes('Denpasar') || title.includes('Airport')) return 'Uluwatu';
  return 'Other';
}

const HIDDEN_PLACES_KEY = 'bali-trip-hidden-places';

// Sortable place item component
interface SortablePlaceItemProps {
  place: PlaceConfig;
  onUpdateDays: (change: number) => void;
  onToggleHidden: () => void;
}

function SortablePlaceItem({ place, onUpdateDays, onToggleHidden }: SortablePlaceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: place.color,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-xl p-4 transition-all ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl z-50 ring-4 ring-teal-200' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-6 h-6" />
        </div>

        {/* Place Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{place.emoji}</span>
            <h3 className="text-lg font-semibold text-gray-900">{place.name}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {place.days} {place.days === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Hide Toggle */}
        <button
          onClick={onToggleHidden}
          className="p-2 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100 text-blue-600"
          title="Hide from trip"
        >
          <EyeOff className="w-5 h-5" />
        </button>

        {/* Days Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateDays(-1)}
            disabled={place.days <= 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-700" />
          </button>
          <div
            className="w-16 h-10 flex items-center justify-center rounded-lg font-bold text-lg text-white"
            style={{ backgroundColor: place.color }}
          >
            {place.days}
          </div>
          <button
            onClick={() => onUpdateDays(1)}
            disabled={place.days >= 15}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripSettingsModal({ tripData, onSave, onClose }: TripSettingsModalProps) {
  const { canManageUsers, isSuperUser } = useAuth();
  const [places, setPlaces] = useState<PlaceConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'places' | 'bookings' | 'expenses' | 'analytics' | 'users' | 'tools'>('places');
  const [localTripData, setLocalTripData] = useState<TripData>(tripData);
  const [showBudgetDashboard, setShowBudgetDashboard] = useState(false);
  const [showTripDashboard, setShowTripDashboard] = useState(false);
  const [refreshingImages, setRefreshingImages] = useState(false);
  const [showAddPlaceForm, setShowAddPlaceForm] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceDays, setNewPlaceDays] = useState(1);
  const [newPlaceEmoji, setNewPlaceEmoji] = useState('📍');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Setup sensors for drag and drop with better touch support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Require 10px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 5, // 5px movement tolerance during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (showAddPlaceForm && searchInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: 'id' }, // Restrict to Indonesia
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.name) {
          setNewPlaceName(place.name);
        }
      });
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [showAddPlaceForm]);

  // Initialize places from trip data
  useEffect(() => {
    const placeMap = new Map<string, number>();

    tripData.days.forEach(day => {
      const placeName = getPlaceName(day.title);
      placeMap.set(placeName, (placeMap.get(placeName) || 0) + 1);
    });

    // Load hidden places from localStorage
    const savedHiddenPlaces = localStorage.getItem(HIDDEN_PLACES_KEY);
    const hiddenPlacesData: Record<string, { days: number; order: number }> = savedHiddenPlaces
      ? JSON.parse(savedHiddenPlaces)
      : {};

    const placeConfigs: PlaceConfig[] = [];
    const order = ['Canggu', 'Ubud', 'Munduk', 'Sidemen', 'Gili Trawangan', 'Gili Air', 'Nusa Penida', 'Uluwatu'];

    // Add visible places
    order.forEach((placeName, idx) => {
      if (placeMap.has(placeName)) {
        placeConfigs.push({
          id: `${placeName}-${idx}-${Date.now()}`,
          name: placeName,
          emoji: getPlaceEmoji(placeName),
          days: placeMap.get(placeName)!,
          color: getPlaceColor(placeName),
          hidden: false,
        });
      }
    });

    // Add hidden places from localStorage
    Object.entries(hiddenPlacesData).forEach(([placeName, data], idx) => {
      if (!placeMap.has(placeName)) {
        placeConfigs.push({
          id: `${placeName}-hidden-${idx}-${Date.now()}`,
          name: placeName,
          emoji: getPlaceEmoji(placeName),
          days: data.days,
          color: getPlaceColor(placeName),
          hidden: true,
        });
      }
    });

    // Sort to maintain order
    placeConfigs.sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      const aOrder = a.hidden ? (hiddenPlacesData[a.name]?.order ?? 999) : aIndex;
      const bOrder = b.hidden ? (hiddenPlacesData[b.name]?.order ?? 999) : bIndex;
      return aOrder - bOrder;
    });

    setPlaces(placeConfigs);
  }, [tripData]);

  const getPlaceEmoji = (name: string) => {
    const emojiMap: Record<string, string> = {
      'Canggu': '🏖️',
      'Ubud': '🌿',
      'Munduk': '🏔️',
      'Sidemen': '🌾',
      'Gili Trawangan': '🏝️',
      'Gili Air': '🌊',
      'Nusa Penida': '⛰️',
      'Uluwatu': '🌅',
    };
    return emojiMap[name] || '📍';
  };

  const getPlaceColor = (name: string) => {
    const colors: Record<string, string> = {
      'Canggu': '#06B6D4',
      'Ubud': '#10B981',
      'Munduk': '#8B4513',
      'Sidemen': '#84CC16',
      'Gili Trawangan': '#3B82F6',
      'Gili Air': '#60A5FA',
      'Nusa Penida': '#1D4ED8',
      'Uluwatu': '#F97316',
    };
    return colors[name] || '#6B7280';
  };

  const updateDays = (index: number, change: number) => {
    const newPlaces = [...places];
    const currentTotal = places.filter(p => !p.hidden).reduce((sum, p) => sum + p.days, 0);
    const maxTripDays = 25; // Original trip length from May 6 to May 30

    // Calculate what the new total would be
    const proposedDays = newPlaces[index].days + change;
    const newTotal = currentTotal - newPlaces[index].days + proposedDays;

    // Validate: don't allow more than max trip days total, and minimum 1 day per place
    if (proposedDays < 1) {
      alert('Each place must have at least 1 day');
      return;
    }

    if (newTotal > maxTripDays) {
      alert(`Total trip cannot exceed ${maxTripDays} days (May 6 - May 30). Currently at ${currentTotal} days.`);
      return;
    }

    // Also respect the individual place maximum
    const newDays = Math.max(1, Math.min(15, proposedDays));
    newPlaces[index] = { ...newPlaces[index], days: newDays };
    setPlaces(newPlaces);
  };

  const toggleHidden = (index: number) => {
    const newPlaces = [...places];
    newPlaces[index] = { ...newPlaces[index], hidden: !newPlaces[index].hidden };
    setPlaces(newPlaces);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPlaces((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddPlace = () => {
    if (!newPlaceName.trim()) {
      alert('Please enter a place name');
      return;
    }

    if (newPlaceDays < 1 || newPlaceDays > 15) {
      alert('Days must be between 1 and 15');
      return;
    }

    // Generate a random color for the new place
    const colors = ['#06B6D4', '#10B981', '#8B4513', '#84CC16', '#3B82F6', '#60A5FA', '#1D4ED8', '#F97316', '#EC4899', '#8B5CF6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPlace: PlaceConfig = {
      id: `${newPlaceName.trim()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newPlaceName.trim(),
      emoji: newPlaceEmoji,
      days: newPlaceDays,
      color: randomColor,
      hidden: false,
    };

    setPlaces([...places, newPlace]);

    // Reset form
    setNewPlaceName('');
    setNewPlaceDays(1);
    setNewPlaceEmoji('📍');
    setShowAddPlaceForm(false);
  };

  const handleUpdateExpenses = (dayNumber: number, expenses: DayExpense[]) => {
    const updatedDays = localTripData.days.map(day => {
      if (day.day === dayNumber) {
        return { ...day, expenses };
      }
      return day;
    });

    setLocalTripData({ ...localTripData, days: updatedDays });
  };

  const handleRefreshAllImages = async () => {
    if (!confirm('⚠️ REFRESH ALL IMAGES\n\nThis will:\n• Fetch fresh images from Google Places API\n• Update ALL activities and hotels in the database\n• Take several minutes to complete\n\nMake sure you have a stable internet connection.\n\nContinue?')) {
      return;
    }

    setRefreshingImages(true);
    console.log('🔄 Starting image refresh...');

    try {
      const result = await refreshAllImages();
      console.log('✅ Refresh complete:', result);
      // The function shows its own alert with results
    } catch (error) {
      console.error('❌ Error refreshing images:', error);
      // Error alert is shown by the function
    } finally {
      setRefreshingImages(false);
    }
  };

  const handleSave = () => {
    // Save hidden places to localStorage
    const hiddenPlacesData: Record<string, { days: number; order: number }> = {};
    places.forEach((place, index) => {
      if (place.hidden) {
        hiddenPlacesData[place.name] = {
          days: place.days,
          order: index,
        };
      }
    });
    localStorage.setItem(HIDDEN_PLACES_KEY, JSON.stringify(hiddenPlacesData));

    // Rebuild the trip data with new order and days (excluding hidden places)
    const newDays: typeof localTripData.days = [];
    let dayCounter = 1;
    const startDate = new Date(tripData.startDate);
    const visiblePlaces = places.filter(p => !p.hidden);

    visiblePlaces.forEach((place) => {
      for (let i = 0; i < place.days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayCounter - 1);

        let title = place.name;
        if (dayCounter === 1) {
          title = `Arrival - ${place.name}`;
        } else if (dayCounter === visiblePlaces.reduce((sum, p) => sum + p.days, 0)) {
          title = `Departure - Denpasar Airport`;
        }

        // Preserve existing day data including expenses
        const existingDay = localTripData.days.find(d => d.day === dayCounter);

        newDays.push({
          day: dayCounter,
          date: date.toISOString().split('T')[0],
          title: title,
          activities: existingDay?.activities || tripData.days[dayCounter - 1]?.activities || [],
          hotel: existingDay?.hotel || tripData.days[dayCounter - 1]?.hotel,
          expenses: existingDay?.expenses || [],
        });

        dayCounter++;
      }
    });

    const totalDays = visiblePlaces.reduce((sum, p) => sum + p.days, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays - 1);

    const newTripData: TripData = {
      ...localTripData,
      endDate: endDate.toISOString().split('T')[0],
      days: newDays,
    };

    onSave(newTripData);
  };

  const totalDays = places.filter(p => !p.hidden).reduce((sum, place) => sum + place.days, 0);
  const hiddenCount = places.filter(p => p.hidden).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-xl z-10">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trip Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your trip configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTripDashboard(true)}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-orange-600 transition-all shadow-sm flex items-center gap-2"
              >
                <span>✨</span>
                Trip Dashboard
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 flex gap-2 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveTab('places')}
              className={`py-3 px-5 font-semibold text-sm border-b-4 transition-all rounded-t-lg relative ${
                activeTab === 'places'
                  ? 'border-travel-teal text-travel-teal bg-white shadow-md'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              📍 Places & Days
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-5 font-semibold text-sm border-b-4 transition-all rounded-t-lg relative ${
                activeTab === 'bookings'
                  ? 'border-travel-teal text-travel-teal bg-white shadow-md'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              🏨 Hotel Bookings
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-3 px-5 font-semibold text-sm border-b-4 transition-all rounded-t-lg relative ${
                activeTab === 'expenses'
                  ? 'border-travel-teal text-travel-teal bg-white shadow-md'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }`}
            >
              💰 Daily Expenses
            </button>
            <button
              onClick={() => setShowBudgetDashboard(true)}
              className="py-3 px-5 font-semibold text-sm border-b-4 border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-all rounded-t-lg"
            >
              📊 Budget & Analytics
            </button>
            {canManageUsers && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3 px-5 font-semibold text-sm border-b-4 transition-all rounded-t-lg relative ${
                  activeTab === 'users'
                    ? 'border-travel-teal text-travel-teal bg-white shadow-md'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                👥 User Management
              </button>
            )}
            {isSuperUser && (
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-3 px-5 font-semibold text-sm border-b-4 transition-all rounded-t-lg relative ${
                  activeTab === 'tools'
                    ? 'border-travel-teal text-travel-teal bg-white shadow-md'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                🛠️ Tools
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Places & Days Tab */}
          {activeTab === 'places' && (
            <>
          {/* Total Days Info */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Total Trip Duration</p>
                <p className="text-2xl font-bold text-travel-teal mt-1">{totalDays} Days</p>
                <div className="flex items-center gap-2 mt-2">
                  {totalDays < 25 && (
                    <p className="text-xs text-orange-600 font-medium">
                      ⚠️ {25 - totalDays} days remaining to reach full trip (25 days max)
                    </p>
                  )}
                  {totalDays === 25 && (
                    <p className="text-xs text-green-600 font-medium">
                      ✅ Full trip duration (May 6 - May 30)
                    </p>
                  )}
                </div>
                {hiddenCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    ({hiddenCount} {hiddenCount === 1 ? 'place' : 'places'} hidden)
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">
                  {new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400 my-1">to</p>
                <p className="text-xs text-gray-600">
                  {new Date(tripData.startDate).setDate(new Date(tripData.startDate).getDate() + totalDays - 1) &&
                   new Date(new Date(tripData.startDate).getTime() + (totalDays - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              <strong>How to use:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag places using the <GripVertical className="w-4 h-4 inline text-gray-400" /> handle to reorder</li>
              <li>• Use + / - buttons to adjust days in each place</li>
              <li>• Click <Eye className="w-4 h-4 inline text-gray-400" /> / <EyeOff className="w-4 h-4 inline text-gray-400" /> to show/hide places from trip</li>
              <li>• Click "Save Changes" when done</li>
            </ul>
          </div>

          {/* Add Place Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowAddPlaceForm(!showAddPlaceForm)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add New Place
            </button>
          </div>

          {/* Add Place Form */}
          {showAddPlaceForm && (
            <div className="mb-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Add New Place
              </h3>

              <div className="space-y-4">
                {/* Place Name with Google Autocomplete */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Place Name
                  </label>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={newPlaceName}
                    onChange={(e) => setNewPlaceName(e.target.value)}
                    placeholder="Search for a place..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Start typing to search places in Indonesia
                  </p>
                </div>

                {/* Emoji Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji Icon
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      '🏖️', '🌿', '🏔️', '🌾', '🏝️', '🌊', '⛰️', '🌅',
                      '🏛️', '🌋', '🌴', '🏞️', '🏰', '⛱️', '🏜️', '📍',
                      '🎉', '🎊', '🥳', '🍻', '🎭', '🎪', '🎨', '🎵',
                      '🍹', '🍸', '🥂', '🎶', '💃', '🕺', '🔥', '✨',
                      '🌺', '🌸', '🌼', '🏄', '🤿', '🚣', '🛶', '⛵',
                      '🏊', '🧘', '🕌', '⛩️', '🗿', '🎋', '🎑', '🏯'
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewPlaceEmoji(emoji)}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          newPlaceEmoji === emoji
                            ? 'bg-teal-500 scale-110 shadow-md'
                            : 'bg-white hover:bg-gray-50 hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Days
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNewPlaceDays(Math.max(1, newPlaceDays - 1))}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={newPlaceDays}
                      onChange={(e) => setNewPlaceDays(Math.max(1, Math.min(15, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      min="1"
                      max="15"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPlaceDays(Math.min(15, newPlaceDays + 1))}
                      className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlaceForm(false);
                      setNewPlaceName('');
                      setNewPlaceDays(1);
                      setNewPlaceEmoji('📍');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPlace}
                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600"
                  >
                    Add Place
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Places */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Active Places
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={places.filter(p => !p.hidden).map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {places.filter(p => !p.hidden).map((place) => {
                    const actualIndex = places.indexOf(place);
                    return (
                      <SortablePlaceItem
                        key={place.id}
                        place={place}
                        onUpdateDays={(change) => updateDays(actualIndex, change)}
                        onToggleHidden={() => toggleHidden(actualIndex)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Hidden Places Section */}
          {places.filter(p => p.hidden).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <EyeOff className="w-4 h-4" />
                Hidden Places ({places.filter(p => p.hidden).length})
              </h3>
              <div className="space-y-3">
                {places.filter(p => p.hidden).map((place) => {
                  const actualIndex = places.indexOf(place);
                  return (
                    <div
                      key={place.id}
                      className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 transition-all opacity-60 hover:opacity-80"
                    >
                      <div className="flex items-center gap-4">
                        {/* Place Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl grayscale">{place.emoji}</span>
                            <h3 className="text-lg font-semibold text-gray-500 line-through">{place.name}</h3>
                            <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded">
                              Hidden
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {place.days} {place.days === 1 ? 'day' : 'days'} • Will be excluded from trip
                          </p>
                        </div>

                        {/* Show Toggle */}
                        <button
                          onClick={() => toggleHidden(actualIndex)}
                          className="p-2 rounded-lg transition-colors bg-green-50 hover:bg-green-100 text-green-600"
                          title="Show in trip"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

            </>
          )}

          {/* Hotel Bookings Tab */}
          {activeTab === 'bookings' && (
            <BookingStatusView tripData={localTripData} />
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <DailyExpensesTracker
              tripData={localTripData}
              onUpdateExpenses={handleUpdateExpenses}
            />
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && canManageUsers && (
            <UserManagement isSuperUser={isSuperUser} />
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && isSuperUser && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🖼️ Refresh All Images</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fetch fresh images from Google Places API for all activities and hotels. This will update image URLs to fix any broken images.
                </p>
                <button
                  onClick={handleRefreshAllImages}
                  disabled={refreshingImages}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshingImages ? 'animate-spin' : ''}`} />
                  {refreshingImages ? 'Refreshing All Images...' : 'Refresh All Images'}
                </button>
                {refreshingImages && (
                  <p className="text-sm text-gray-600 mt-3">
                    ⏱️ This may take a few minutes... Please don't close this window.
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Fetches all activities and hotels from the database</li>
                  <li>• Searches Google Places API for each location</li>
                  <li>• Downloads fresh photo references</li>
                  <li>• Updates database with new image URLs</li>
                  <li>• Adds small delays to avoid rate limiting</li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {activeTab === 'places' && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-travel-teal text-white rounded-lg font-medium hover:bg-[#0c8c8c] transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Budget Dashboard Modal */}
      {showBudgetDashboard && (
        <BudgetDashboardV2
          tripData={localTripData}
          onClose={() => setShowBudgetDashboard(false)}
        />
      )}

      {/* Trip Dashboard Modal */}
      {showTripDashboard && (
        <TripDashboard
          tripData={localTripData}
          onClose={() => setShowTripDashboard(false)}
        />
      )}
    </div>
  );
}
