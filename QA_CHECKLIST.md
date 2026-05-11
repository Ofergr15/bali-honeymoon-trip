# Bangkok Integration QA Checklist

## ✅ Data Structure (tripData.ts)
- [x] Day 1 (May 4): Departure to Bangkok - Flight from Israel ✈️
- [x] Day 2 (May 5): Bangkok - Arrival 🇹🇭
- [x] Day 3 (May 6): Bangkok to Bali - Flight ✈️ + Taxi to Canggu 🚗
- [x] Days 4-26: All Bali locations with taxi/boat transport (NO flights)
- [x] Day 27 (May 30): Uluwatu to Bangkok - Taxi 🚗 + Flight ✈️
- [x] Day 28 (May 31): Bangkok 🇹🇭
- [x] Day 29 (June 1): Bangkok - Departure Day - Flight ✈️
- [x] Day 30 (June 2): Arrival in Israel ✈️
- [x] Trip dates: May 4 - June 2, 2026 (30 days)
- [x] Destination: "Bali, Indonesia & Bangkok, Thailand"

## ✅ UI Components Updated
- [x] App.tsx - getPlaceName() includes Bangkok
- [x] App.tsx - getPlaceEmoji() has 🇹🇭 for Bangkok
- [x] App.tsx - placeColors has #E11D48 for Bangkok
- [x] App.tsx - Timeline dates: May 4 - June 2
- [x] App.tsx - originalTripDays = 30
- [x] DayNavigationBar.tsx - getPlaceName() includes Bangkok
- [x] DayNavigationBar.tsx - getPlaceEmoji() has 🇹🇭 for Bangkok
- [x] DayNavigationBar.tsx - Transport routes: Bangkok→Canggu ✈️, Uluwatu→Bangkok ✈️
- [x] ItinerarySidebar.tsx - getPlaceName() includes Bangkok
- [x] ItinerarySidebar.tsx - getPlaceEmoji() has 🇹🇭 for Bangkok
- [x] ItinerarySidebar.tsx - getPlaceColor() has #E11D48 for Bangkok
- [x] Map.tsx - getPlaceNameFromDay() includes Bangkok
- [x] Map.tsx - allLocations has Bangkok marker (lat: 13.7563, lng: 100.5018)
- [x] TripSettingsModal.tsx - getPlaceName() includes Bangkok
- [x] TripSettingsModal.tsx - getPlaceEmoji() has 🇹🇭 for Bangkok
- [x] TripSettingsModal.tsx - getPlaceColor() has #E11D48 for Bangkok

## ✅ Database
- [x] Migration 010 created to add Bangkok days
- [x] Preserves all existing activities, hotels, bookmarks
- [x] Shifts day numbers by +2
- [x] Adds 5 new days (2 Bangkok start + 3 Bangkok/Israel end)
- [x] Updates trip metadata

## ✅ Transport Activities (NO flights within Bali)
### International Flights
- [x] Israel → Bangkok: Flight ✈️
- [x] Bangkok → Bali: Flight ✈️
- [x] Bali → Bangkok: Flight ✈️
- [x] Bangkok → Israel: Flight ✈️

### Bali Internal (Taxi/Boat ONLY)
- [x] Airport → Canggu: Taxi 🚗 (1h)
- [x] Canggu → Ubud: Taxi 🚗 (1.5h)
- [x] Ubud → Munduk: Taxi 🚗 (2.5h)
- [x] Munduk → Sidemen: Taxi 🚗 (2h)
- [x] Sidemen → Gili Trawangan: Taxi 🚗 + Boat ⛴️ (3.5h)
- [x] Gili Trawangan → Gili Air: Boat ⛴️ (15min)
- [x] Gili Air → Nusa Penida: Boat ⛴️ (2h)
- [x] Nusa Penida → Uluwatu: Boat ⛴️ + Taxi 🚗 (2.5h)
- [x] Uluwatu → Airport: Taxi 🚗 (1h)

## User Verification Needed
- [ ] Browser cache cleared (localStorage.clear())
- [ ] Migration 010_add_bangkok_simple.sql run in Supabase
- [ ] Page refreshed after migration
- [ ] Bangkok shows in navigation bar with 🇹🇭
- [ ] Bangkok → Canggu shows ✈️ icon (not 🚗)
- [ ] Uluwatu → Bangkok shows ✈️ icon
- [ ] Trip Settings shows Bangkok in Active Places
- [ ] Timeline shows 30 days (not 25)
- [ ] Dates show May 4 - June 2
- [ ] All existing activities/hotels preserved
