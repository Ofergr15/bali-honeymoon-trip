import type { TripData } from '../types/trip';

export const baliTripData: TripData = {
  title: "Our Bali Honeymoon",
  destination: "Bali, Indonesia",
  startDate: "2026-05-06",
  endDate: "2026-05-30",
  days: [
    // CANGGU - Days 1-3 (May 6-8)
    {
      day: 1,
      date: "2026-05-06",
      title: "Arrival - Canggu",
      activities: [
        {
          id: "flight-arrival",
          day: 1,
          type: "activity",
          name: "TG431 Flight Arrival",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "14:55",
          description: "Arrival at Ngurah Rai International Airport (Denpasar)",
        },
      ],
    },
    {
      day: 2,
      date: "2026-05-07",
      title: "Canggu",
      activities: [],
    },
    {
      day: 3,
      date: "2026-05-08",
      title: "Canggu",
      activities: [],
    },

    // UBUD - Days 4-6 (May 9-11)
    {
      day: 4,
      date: "2026-05-09",
      title: "Ubud",
      activities: [],
    },
    {
      day: 5,
      date: "2026-05-10",
      title: "Ubud",
      activities: [],
    },
    {
      day: 6,
      date: "2026-05-11",
      title: "Ubud",
      activities: [],
    },

    // MUNDUK - Days 7-9 (May 12-14)
    {
      day: 7,
      date: "2026-05-12",
      title: "Munduk",
      activities: [],
    },
    {
      day: 8,
      date: "2026-05-13",
      title: "Munduk",
      activities: [],
    },
    {
      day: 9,
      date: "2026-05-14",
      title: "Munduk",
      activities: [],
    },

    // SIDEMEN - Days 10-11 (May 15-16)
    {
      day: 10,
      date: "2026-05-15",
      title: "Sidemen",
      activities: [],
    },
    {
      day: 11,
      date: "2026-05-16",
      title: "Sidemen",
      activities: [],
    },

    // GILI TRAWANGAN - Days 12-13 (May 17-18)
    {
      day: 12,
      date: "2026-05-17",
      title: "Gili Trawangan",
      activities: [],
    },
    {
      day: 13,
      date: "2026-05-18",
      title: "Gili Trawangan",
      activities: [],
    },

    // GILI AIR - Days 14-15 (May 19-20)
    {
      day: 14,
      date: "2026-05-19",
      title: "Gili Air",
      activities: [],
    },
    {
      day: 15,
      date: "2026-05-20",
      title: "Gili Air",
      activities: [],
    },

    // NUSA PENIDA - Day 16 (May 21)
    {
      day: 16,
      date: "2026-05-21",
      title: "Nusa Penida",
      activities: [],
    },

    // ULUWATU - Days 17-24 (May 22-29)
    {
      day: 17,
      date: "2026-05-22",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 18,
      date: "2026-05-23",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 19,
      date: "2026-05-24",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 20,
      date: "2026-05-25",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 21,
      date: "2026-05-26",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 22,
      date: "2026-05-27",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 23,
      date: "2026-05-28",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 24,
      date: "2026-05-29",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 25,
      date: "2026-05-30",
      title: "Departure - Denpasar Airport",
      activities: [
        {
          id: "flight-departure",
          day: 25,
          type: "activity",
          name: "TG431 Flight Departure",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "16:55",
          description: "Departure from Ngurah Rai International Airport",
        },
      ],
    },
  ],
};
