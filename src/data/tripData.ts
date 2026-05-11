import type { TripData } from '../types/trip';

export const baliTripData: TripData = {
  title: "Our Bali Honeymoon",
  destination: "Bali, Indonesia & Bangkok, Thailand",
  startDate: "2026-05-04",
  endDate: "2026-06-02",
  days: [
    // BANGKOK - Day 1 (May 4-5) - Departure and arrival
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
          description: "Arrival at Suvarnabhumi Airport (BKK) - 1 night in Bangkok",
        },
      ],
    },
    // BALI START - Day 3 (May 6) - Arrival in Canggu
    {
      day: 3,
      date: "2026-05-06",
      title: "Arrival - Canggu",
      activities: [
        {
          id: "flight-arrival",
          day: 3,
          type: "activity",
          name: "TG431 Flight Arrival",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "14:55",
          description: "Arrival at Ngurah Rai International Airport (Denpasar)",
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

    // UBUD - Days 6-8 (May 9-11)
    {
      day: 6,
      date: "2026-05-09",
      title: "Ubud",
      activities: [],
    },
    {
      day: 7,
      date: "2026-05-10",
      title: "Ubud",
      activities: [],
    },
    {
      day: 8,
      date: "2026-05-11",
      title: "Ubud",
      activities: [],
    },

    // MUNDUK - Days 9-11 (May 12-14)
    {
      day: 9,
      date: "2026-05-12",
      title: "Munduk",
      activities: [],
    },
    {
      day: 10,
      date: "2026-05-13",
      title: "Munduk",
      activities: [],
    },
    {
      day: 11,
      date: "2026-05-14",
      title: "Munduk",
      activities: [],
    },

    // SIDEMEN - Days 12-13 (May 15-16)
    {
      day: 12,
      date: "2026-05-15",
      title: "Sidemen",
      activities: [],
    },
    {
      day: 13,
      date: "2026-05-16",
      title: "Sidemen",
      activities: [],
    },

    // GILI TRAWANGAN - Days 14-15 (May 17-18)
    {
      day: 14,
      date: "2026-05-17",
      title: "Gili Trawangan",
      activities: [],
    },
    {
      day: 15,
      date: "2026-05-18",
      title: "Gili Trawangan",
      activities: [],
    },

    // GILI AIR - Days 16-17 (May 19-20)
    {
      day: 16,
      date: "2026-05-19",
      title: "Gili Air",
      activities: [],
    },
    {
      day: 17,
      date: "2026-05-20",
      title: "Gili Air",
      activities: [],
    },

    // NUSA PENIDA - Day 18 (May 21)
    {
      day: 18,
      date: "2026-05-21",
      title: "Nusa Penida",
      activities: [],
    },

    // ULUWATU - Days 19-26 (May 22-29)
    {
      day: 19,
      date: "2026-05-22",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 20,
      date: "2026-05-23",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 21,
      date: "2026-05-24",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 22,
      date: "2026-05-25",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 23,
      date: "2026-05-26",
      title: "Uluwatu",
      activities: [],
    },
    {
      day: 24,
      date: "2026-05-27",
      title: "Uluwatu",
      activities: [],
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
    {
      day: 27,
      date: "2026-05-30",
      title: "Bali to Bangkok",
      activities: [
        {
          id: "flight-departure",
          day: 27,
          type: "flight",
          name: "TG431 Flight Departure to Bangkok",
          location: { lat: -8.7467, lng: 115.1667 },
          time: "16:55",
          description: "Departure from Ngurah Rai International Airport to Bangkok",
        },
      ],
    },
    // BANGKOK - Days 28-29 (May 31 - June 1) - 2 nights after Bali
    {
      day: 28,
      date: "2026-05-31",
      title: "Bangkok",
      activities: [
        {
          id: "bangkok-arrival-2",
          day: 28,
          type: "activity",
          name: "Arrival in Bangkok from Bali",
          location: { lat: 13.6900, lng: 100.7501 },
          time: "TBD",
          description: "Arriving in Bangkok for 2 nights",
        },
      ],
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
          time: "TBD",
          description: "Flight from Suvarnabhumi Airport to Israel",
        },
      ],
    },
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
