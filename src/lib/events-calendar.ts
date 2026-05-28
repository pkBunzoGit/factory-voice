export interface CalendarEvent {
  date: string; // MM-DD
  name: string;
  region: "zambia" | "africa" | "global";
  emoji: string;
  description?: string;
}

const SUPPLEMENTARY_EVENTS: CalendarEvent[] = [
  // Zambian holidays (fixed dates)
  { date: "03-08", name: "International Women's Day", region: "zambia", emoji: "👩" },
  { date: "03-12", name: "Youth Day", region: "zambia", emoji: "🇿🇲" },
  { date: "05-01", name: "Labour Day", region: "zambia", emoji: "⚒️" },
  { date: "05-25", name: "Africa Day", region: "zambia", emoji: "🌍" },
  { date: "07-04", name: "Heroes' Day", region: "zambia", emoji: "🇿🇲" },
  { date: "07-05", name: "Unity Day", region: "zambia", emoji: "🇿🇲" },
  { date: "08-01", name: "Farmers' Day", region: "zambia", emoji: "🌾" },
  { date: "10-18", name: "National Prayer Day", region: "zambia", emoji: "🙏" },
  { date: "10-24", name: "Independence Day", region: "zambia", emoji: "🇿🇲" },

  // African events
  { date: "01-09", name: "Martyrs' Day (Africa)", region: "africa", emoji: "🕊️" },
  { date: "06-16", name: "Day of the African Child", region: "africa", emoji: "👶" },
  { date: "09-13", name: "African Industrialization Day", region: "africa", emoji: "🏭" },

  // Global events relevant to business/agriculture
  { date: "01-01", name: "New Year's Day", region: "global", emoji: "🎉" },
  { date: "02-14", name: "Valentine's Day", region: "global", emoji: "❤️" },
  { date: "06-05", name: "World Environment Day", region: "global", emoji: "🌱" },
  { date: "06-17", name: "World Day to Combat Desertification", region: "global", emoji: "🏜️" },
  { date: "10-15", name: "International Day of Rural Women", region: "global", emoji: "👩‍🌾" },
  { date: "10-16", name: "World Food Day", region: "global", emoji: "🍽️" },
  { date: "11-19", name: "World Toilet Day", region: "global", emoji: "🚿" },
  { date: "12-25", name: "Christmas Day", region: "global", emoji: "🎄" },
  { date: "12-31", name: "New Year's Eve", region: "global", emoji: "🎆" },
];

interface CalendarificHoliday {
  name: string;
  date: { iso: string };
  type: string[];
  primary_type?: string;
}

export async function fetchUpcomingEvents(countryCode = "ZM"): Promise<CalendarEvent[]> {
  const now = new Date();
  const year = now.getFullYear();

  let apiEvents: CalendarEvent[] = [];

  const apiKey = process.env.CALENDARIFIC_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${countryCode}&year=${year}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const data = await res.json();
        const holidays: CalendarificHoliday[] = data.response?.holidays || [];
        apiEvents = holidays
          .filter((h) => h.type?.includes("National holiday") || h.type?.includes("Public holiday") || h.primary_type === "National holiday")
          .map((h) => {
            const d = new Date(h.date.iso);
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return {
              date: `${mm}-${dd}`,
              name: h.name,
              region: "zambia" as const,
              emoji: "🇿🇲",
            };
          });
      }
    } catch {
      // Calendarific unavailable, fall back to hardcoded
    }
  }

  // Merge: API events take priority, supplementary fills gaps
  const seenDates = new Set(apiEvents.map((e) => e.date));
  const merged = [
    ...apiEvents,
    ...SUPPLEMENTARY_EVENTS.filter((e) => !seenDates.has(e.date)),
  ];

  // Filter to next 30 days
  const regionPriority = { zambia: 0, africa: 1, global: 2 };
  const upcoming = merged
    .map((e) => {
      const [mm, dd] = e.date.split("-").map(Number);
      let eventDate = new Date(year, mm - 1, dd);
      // If event already passed this year, check if it's within the wrap-around
      if (eventDate < now) {
        const diffDays = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          eventDate = new Date(year + 1, mm - 1, dd);
        }
      }
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...e, daysUntil, eventDate };
    })
    .filter((e) => e.daysUntil >= -7 && e.daysUntil <= 30)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      return regionPriority[a.region] - regionPriority[b.region];
    })
    .map(({ daysUntil: _, eventDate: __, ...rest }) => rest);

  return upcoming;
}

export function getAllEvents(): CalendarEvent[] {
  return SUPPLEMENTARY_EVENTS;
}
