import type { TripData } from '../types/trip';

export const baliTripData: TripData = {
  title: "Our Bali Honeymoon",
  destination: "Bali, Indonesia & Bangkok, Thailand",
  startDate: "2026-05-04",
  endDate: "2026-06-02",
  days: [
    // Day 1 (May 4) - Departure from Israel
    {
      day: 1,
      date: "2026-05-04",
      title: "Departure to Bangkok",
      activities: [
        {
          id: "israel-departure",
          day: 1,
          type: "flight",
          name: "Departure from Israel",
          location: { lat: 32.0114, lng: 34.8866 }, // Tel Aviv airport
          time: "TBD",
          description: "Departure from Ben Gurion Airport",
        },
      ],
    },
    // BANGKOK - Day 2 (May 5) - 1 night
    {
      day: 2,
      date: "2026-05-05",
      title: "Bangkok - Arrival",
      activities: [
        {
          id: "bangkok-arrival",
          day: 2,
          type: "activity",
          name: "Arrival in Bangkok",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "TBD",
          description: "Arrival at Suvarnabhumi Airport (BKK)",
        },
      ],
    },
    // CANGGU - Days 3-6 (May 6-9) - 4 nights
    {
      day: 3,
      date: "2026-05-06",
      title: "Bangkok to Bali - Canggu",
      activities: [
        {
          id: "flight-to-bali",
          day: 3,
          type: "flight",
          name: "Flight from Bangkok to Bali",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "TBD",
          description: "Arrival at Ngurah Rai International Airport (Denpasar)",
        },
        {
          id: "taxi-airport-to-canggu",
          day: 3,
          type: "activity",
          name: "Taxi to Canggu",
          location: { lat: -8.6500, lng: 115.1389 },
          time: "TBD",
          description: "Transfer from Denpasar Airport to Canggu (~1 hour)",
          duration: "1h",
        },
      ],
    },
    {
      day: 4,
      date: "2026-05-07",
      title: "Canggu",
      activities: [],
    },
    {
      day: 5,
      date: "2026-05-08",
      title: "Canggu",
      activities: [],
    },
    {
      day: 6,
      date: "2026-05-09",
      title: "Canggu",
      activities: [],
    },

    // SIDEMEN - Days 7-8 (May 10-11) - 2 nights
    {
      day: 7,
      date: "2026-05-10",
      title: "Canggu to Sidemen",
      activities: [
        {
          id: "taxi-canggu-to-sidemen",
          day: 7,
          type: "activity",
          name: "Taxi to Sidemen",
          location: { lat: -8.4833, lng: 115.4167 },
          time: "12:00",
          description: "Transfer from Canggu to Sidemen (morning departure, noon arrival)",
          duration: "2.5h",
        },
      ],
    },
    {
      day: 8,
      date: "2026-05-11",
      title: "Sidemen",
      activities: [],
    },

    // UBUD - Days 9-11 (May 12-14) - 3 nights
    {
      day: 9,
      date: "2026-05-12",
      title: "Sidemen to Ubud",
      activities: [
        {
          id: "taxi-sidemen-to-ubud",
          day: 9,
          type: "activity",
          name: "Taxi to Ubud",
          location: { lat: -8.5069, lng: 115.2625 },
          time: "12:00",
          description: "Transfer from Sidemen to Ubud (noon departure)",
          duration: "1.5h",
        },
      ],
    },
    {
      day: 10,
      date: "2026-05-13",
      title: "Ubud",
      activities: [],
    },
    {
      day: 11,
      date: "2026-05-14",
      title: "Ubud",
      activities: [],
    },

    // ULUWATU (FIRST STAY) - Days 12-13 (May 15-16) - 2 nights
    {
      day: 12,
      date: "2026-05-15",
      title: "Ubud to Uluwatu",
      activities: [
        {
          id: "taxi-ubud-to-uluwatu-1",
          day: 12,
          type: "activity",
          name: "Taxi to Uluwatu",
          location: { lat: -8.8290, lng: 115.0847 },
          time: "15:00",
          description: "Transfer from Ubud to Uluwatu (3pm departure)",
          duration: "2h",
        },
      ],
    },
    {
      day: 13,
      date: "2026-05-16",
      title: "Uluwatu",
      activities: [],
    },

    // GILI TRAWANGAN - Days 14-16 (May 17-19) - 3 nights
    {
      day: 14,
      date: "2026-05-17",
      title: "Uluwatu to Gili Trawangan",
      activities: [
        {
          id: "transfer-to-port",
          day: 14,
          type: "activity",
          name: "Transfer to Port",
          location: { lat: -8.7089, lng: 115.2625 },
          time: "12:00",
          description: "Transfer from Uluwatu to port (noon departure)",
          duration: "1.5h",
        },
        {
          id: "boat-to-gili-t",
          day: 14,
          type: "activity",
          name: "Fast Boat to Gili Trawangan",
          location: { lat: -8.3489, lng: 116.0422 },
          time: "14:00",
          description: "Boat to Gili Trawangan",
          duration: "2h",
        },
      ],
    },
    {
      day: 15,
      date: "2026-05-18",
      title: "Gili Trawangan",
      activities: [],
    },
    {
      day: 16,
      date: "2026-05-19",
      title: "Gili Trawangan",
      activities: [],
    },

    // GILI AIR - Day 17 (May 20) - 1 night
    {
      day: 17,
      date: "2026-05-20",
      title: "Gili Trawangan to Gili Air",
      activities: [
        {
          id: "boat-gili-t-to-air",
          day: 17,
          type: "activity",
          name: "Boat to Gili Air",
          location: { lat: -8.3558, lng: 116.0869 },
          time: "TBD",
          description: "Short boat ride between Gili islands (~15 minutes)",
          duration: "15min",
        },
      ],
    },

    // NUSA LEMBONGAN - Days 18-20 (May 21-23) - 3 nights
    {
      day: 18,
      date: "2026-05-21",
      title: "Gili Air to Nusa Lembongan",
      activities: [
        {
          id: "boat-gili-to-nusa-lembongan",
          day: 18,
          type: "activity",
          name: "Boat to Nusa Lembongan",
          location: { lat: -8.6854, lng: 115.4503 },
          time: "TBD",
          description: "Fast boat from Gili Air to Nusa Lembongan",
          duration: "2h",
        },
      ],
    },
    {
      day: 19,
      date: "2026-05-22",
      title: "Nusa Lembongan",
      activities: [],
    },
    {
      day: 20,
      date: "2026-05-23",
      title: "Nusa Lembongan",
      activities: [],
    },

    // KUTA - Day 21 (May 24) - 1 night
    {
      day: 21,
      date: "2026-05-24",
      title: "Nusa Lembongan to Kuta",
      activities: [
        {
          id: "boat-lembongan-to-sanur",
          day: 21,
          type: "activity",
          name: "Boat to Sanur",
          location: { lat: -8.7089, lng: 115.2625 },
          time: "09:00",
          description: "Fast boat from Nusa Lembongan to Sanur",
          duration: "30min",
        },
        {
          id: "taxi-sanur-to-kuta",
          day: 21,
          type: "activity",
          name: "Taxi to Kuta",
          location: { lat: -8.7184, lng: 115.1681 },
          time: "10:00",
          description: "Transfer from Sanur to Kuta",
          duration: "30min",
        },
      ],
    },

    // KOMODO (LABUAN BAJO) - Days 22-23 (May 25-26) - 2 nights
    {
      day: 22,
      date: "2026-05-25",
      title: "Kuta to Komodo (Labuan Bajo)",
      activities: [
        {
          id: "flight-to-labuan-bajo",
          day: 22,
          type: "flight",
          name: "Flight to Labuan Bajo",
          location: { lat: -8.4867, lng: 119.8889 },
          time: "09:00",
          description: "Flight from Bali to Labuan Bajo (Komodo Islands)",
        },
      ],
    },
    {
      day: 23,
      date: "2026-05-26",
      title: "Komodo (Labuan Bajo)",
      activities: [],
    },

    // ULUWATU (SECOND STAY) - Days 24-26 (May 27-29) - 3 nights
    {
      day: 24,
      date: "2026-05-27",
      title: "Komodo to Uluwatu",
      activities: [
        {
          id: "flight-labuan-bajo-to-bali",
          day: 24,
          type: "flight",
          name: "Flight back to Bali",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "09:00",
          description: "Flight from Labuan Bajo to Denpasar",
        },
        {
          id: "taxi-airport-to-uluwatu-2",
          day: 24,
          type: "activity",
          name: "Taxi to Uluwatu",
          location: { lat: -8.8290, lng: 115.0847 },
          time: "11:00",
          description: "Transfer from Airport to Uluwatu",
          duration: "1h",
        },
      ],
    },
    {
      day: 25,
      date: "2026-05-28",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 26,
      date: "2026-05-29",
      title: "Uluwatu",
      activities: [],
    },

    // BANGKOK - Days 27-29 (May 30 - June 1) - 2 nights
    {
      day: 27,
      date: "2026-05-30",
      title: "Uluwatu to Bangkok",
      activities: [
        {
          id: "taxi-uluwatu-to-airport",
          day: 27,
          type: "activity",
          name: "Taxi to Airport",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "15:00",
          description: "Transfer from Uluwatu to Denpasar Airport",
          duration: "1h",
        },
        {
          id: "flight-to-bangkok",
          day: 27,
          type: "flight",
          name: "Flight to Bangkok",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "17:00",
          description: "Departure from Bali to Bangkok",
        },
      ],
    },
    {
      day: 28,
      date: "2026-05-31",
      title: "Bangkok",
      activities: [],
    },
    {
      day: 29,
      date: "2026-06-01",
      title: "Bangkok - Departure Day",
      activities: [
        {
          id: "bangkok-final-departure",
          day: 29,
          type: "flight",
          name: "Departure from Bangkok to Israel",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "23:55",
          description: "Late night flight from Suvarnabhumi Airport to Israel",
        },
      ],
    },

    // RETURN HOME - Day 30 (June 2)
    {
      day: 30,
      date: "2026-06-02",
      title: "Arrival in Israel",
      activities: [
        {
          id: "israel-arrival",
          day: 30,
          type: "flight",
          name: "Arrival in Israel",
          location: { lat: 32.0114, lng: 34.8866 },
          time: "TBD",
          description: "Arrival at Ben Gurion Airport",
        },
      ],
    },
  ],
};
