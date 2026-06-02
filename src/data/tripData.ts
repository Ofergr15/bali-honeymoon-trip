import type { TripData } from '../types/trip';

export const baliTripData: TripData = {
  title: "Our Bali Honeymoon",
  destination: "Bali, Indonesia & Bangkok, Thailand",
  startDate: "2026-05-04",
  endDate: "2026-06-02",
  days: [
    // Day 1 (May 4) - Flight day, no hotel
    {
      day: 1,
      date: "2026-05-04",
      title: "Departure",
      activities: [
        {
          id: "israel-departure",
          day: 1,
          type: "flight",
          name: "Departure from Israel",
          location: { lat: 32.0114, lng: 34.8866 },
          time: "TBD",
          description: "Departure from Ben Gurion Airport to Bangkok",
        },
      ],
    },

    // BANGKOK - Day 2 (May 5) - 1 NIGHT
    {
      day: 2,
      date: "2026-05-05",
      title: "Bangkok",
      activities: [
        {
          id: "bangkok-arrival",
          day: 2,
          type: "activity",
          name: "Arrival in Bangkok",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "TBD",
          description: "Arrive and stay 1 night in Bangkok",
        },
      ],
    },

    // CANGGU - Days 3-6 (May 6-9) - 4 NIGHTS
    {
      day: 3,
      date: "2026-05-06",
      title: "Canggu",
      activities: [
        {
          id: "flight-to-bali",
          day: 3,
          type: "flight",
          name: "Flight to Bali",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "TBD",
          description: "Fly from Bangkok to Bali",
        },
        {
          id: "taxi-to-canggu",
          day: 3,
          type: "activity",
          name: "Transfer to Canggu",
          location: { lat: -8.6500, lng: 115.1389 },
          time: "TBD",
          description: "Arrive Canggu",
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

    // SIDEMEN - Days 7-8 (May 10-11) - 2 NIGHTS
    {
      day: 7,
      date: "2026-05-10",
      title: "Sidemen",
      activities: [
        {
          id: "transfer-to-sidemen",
          day: 7,
          type: "activity",
          name: "Transfer to Sidemen",
          location: { lat: -8.4833, lng: 115.4167 },
          time: "10:00",
          description: "Checkout Canggu morning, arrive Sidemen noon",
        },
      ],
    },
    {
      day: 8,
      date: "2026-05-11",
      title: "Sidemen",
      activities: [],
    },

    // UBUD - Days 9-11 (May 12-14) - 3 NIGHTS
    {
      day: 9,
      date: "2026-05-12",
      title: "Ubud",
      activities: [
        {
          id: "transfer-to-ubud",
          day: 9,
          type: "activity",
          name: "Transfer to Ubud",
          location: { lat: -8.5069, lng: 115.2625 },
          time: "12:00",
          description: "Checkout Sidemen noon, arrive Ubud noon",
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

    // ULUWATU - Days 12-13 (May 15-16) - 2 NIGHTS
    {
      day: 12,
      date: "2026-05-15",
      title: "Uluwatu",
      activities: [
        {
          id: "transfer-to-uluwatu-1",
          day: 12,
          type: "activity",
          name: "Transfer to Uluwatu",
          location: { lat: -8.8290, lng: 115.0847 },
          time: "15:00",
          description: "Checkout Ubud 3pm, arrive Uluwatu",
        },
      ],
    },
    {
      day: 13,
      date: "2026-05-16",
      title: "Uluwatu",
      activities: [],
    },

    // GILI TRAWANGAN - Days 14-16 (May 17-19) - 3 NIGHTS
    {
      day: 14,
      date: "2026-05-17",
      title: "Gili Trawangan",
      activities: [
        {
          id: "boat-to-gili-t",
          day: 14,
          type: "activity",
          name: "Boat to Gili Trawangan",
          location: { lat: -8.3489, lng: 116.0422 },
          time: "12:00",
          description: "Arrive Gili T at noon",
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

    // GILI AIR - Day 17 (May 20) - 1 NIGHT
    {
      day: 17,
      date: "2026-05-20",
      title: "Gili Air",
      activities: [
        {
          id: "boat-to-gili-air",
          day: 17,
          type: "activity",
          name: "Boat to Gili Air",
          location: { lat: -8.3558, lng: 116.0869 },
          time: "TBD",
          description: "Move to Gili Air",
        },
      ],
    },

    // NUSA LEMBONGAN - Days 18-20 (May 21-23) - 3 NIGHTS
    {
      day: 18,
      date: "2026-05-21",
      title: "Nusa Lembongan",
      activities: [
        {
          id: "boat-to-lembongan",
          day: 18,
          type: "activity",
          name: "Boat to Nusa Lembongan",
          location: { lat: -8.6854, lng: 115.4503 },
          time: "TBD",
          description: "Arrive Nusa Lembongan",
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

    // KUTA - Day 21 (May 24) - 1 NIGHT
    {
      day: 21,
      date: "2026-05-24",
      title: "Kuta",
      activities: [
        {
          id: "boat-to-kuta",
          day: 21,
          type: "activity",
          name: "Transfer to Kuta",
          location: { lat: -8.7184, lng: 115.1681 },
          time: "09:00",
          description: "Checkout 9am, arrive Kuta",
        },
      ],
    },

    // KOMODO - Days 22-23 (May 25-26) - 2 NIGHTS
    {
      day: 22,
      date: "2026-05-25",
      title: "Komodo",
      activities: [
        {
          id: "flight-to-komodo",
          day: 22,
          type: "flight",
          name: "Flight to Labuan Bajo",
          location: { lat: -8.4867, lng: 119.8889 },
          time: "09:00",
          description: "Checkout Kuta 9am, fly to Komodo",
        },
      ],
    },
    {
      day: 23,
      date: "2026-05-26",
      title: "Komodo",
      activities: [],
    },

    // ULUWATU - Days 24-26 (May 27-29) - 3 NIGHTS
    {
      day: 24,
      date: "2026-05-27",
      title: "Uluwatu",
      activities: [
        {
          id: "flight-back-to-bali",
          day: 24,
          type: "flight",
          name: "Flight back to Bali",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "09:00",
          description: "Checkout Komodo 9am, fly to Bali",
        },
        {
          id: "transfer-to-uluwatu-2",
          day: 24,
          type: "activity",
          name: "Transfer to Uluwatu",
          location: { lat: -8.8290, lng: 115.0847 },
          time: "11:00",
          description: "Arrive Uluwatu",
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

    // BANGKOK - Days 27-28 (May 30-31) - 2 NIGHTS
    {
      day: 27,
      date: "2026-05-30",
      title: "Bangkok",
      activities: [
        {
          id: "transfer-to-airport",
          day: 27,
          type: "activity",
          name: "Transfer to Airport",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "15:00",
          description: "Checkout Uluwatu 5pm",
        },
        {
          id: "flight-to-bangkok-2",
          day: 27,
          type: "flight",
          name: "Flight to Bangkok",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "17:00",
          description: "Fly to Bangkok",
        },
      ],
    },
    {
      day: 28,
      date: "2026-05-31",
      title: "Bangkok",
      activities: [],
    },

    // Day 29 (June 1) - Departure flight, no hotel
    {
      day: 29,
      date: "2026-06-01",
      title: "Departure Flight",
      activities: [
        {
          id: "final-departure",
          day: 29,
          type: "flight",
          name: "Departure to Israel",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "23:55",
          description: "Late night flight from Bangkok to Israel",
        },
      ],
    },

    // Day 30 (June 2) - Arrival
    {
      day: 30,
      date: "2026-06-02",
      title: "Arrival Home",
      activities: [
        {
          id: "israel-arrival",
          day: 30,
          type: "flight",
          name: "Arrival in Israel",
          location: { lat: 32.0114, lng: 34.8866 },
          time: "TBD",
          description: "Arrive back home",
        },
      ],
    },
  ],
};
