export interface DailyQuote {
  quote: string;
  author: string;
}

const FALLBACK_QUOTES: DailyQuote[] = [
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci"
  },
  {
    quote: "Design is not just what it looks like and feels like. Design is how it works.",
    author: "Steve Jobs"
  },
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius"
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    quote: "If a man knows not to which port he sails, no wind is favorable.",
    author: "Seneca"
  },
  {
    quote: "Difficulty strengthens the mind, as labor does the body.",
    author: "Seneca"
  },
  {
    quote: "Make it simple, but significant.",
    author: "Don Draper"
  },
  {
    quote: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  },
  {
    quote: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius"
  },
  {
    quote: "Begin at once to live, and count each separate day as a separate life.",
    author: "Seneca"
  }
];

const CACHE_KEY = "arche_daily_quote";
const CACHE_TIME_KEY = "arche_daily_quote_timestamp";
const SESSION_FETCH_KEY = "arche_session_quote_fetched";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function fetchDailyQuote(): Promise<DailyQuote> {
  const now = Date.now();
  const cachedQuote = localStorage.getItem(CACHE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIME_KEY);
  const sessionFetched = sessionStorage.getItem(SESSION_FETCH_KEY);

  // If this is a new session, bypass cache to force attempt a fresh fetch
  const isNewSession = !sessionFetched;

  if (cachedQuote && cachedTimestamp && !isNewSession) {
    const timePassed = now - parseInt(cachedTimestamp, 10);
    if (timePassed < TWO_HOURS_MS) {
      try {
        return JSON.parse(cachedQuote);
      } catch (e) {
        console.warn("Failed to parse cached quote, refetching...", e);
      }
    }
  }

  // Mark session as fetched
  sessionStorage.setItem(SESSION_FETCH_KEY, "true");

  // Fetch from free API
  try {
    const response = await fetch("https://favqs.com/api/qotd", {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.quote && data.quote.body) {
      const newQuote: DailyQuote = {
        quote: data.quote.body,
        author: data.quote.author || "Unknown"
      };

      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(newQuote));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());
      return newQuote;
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    console.warn("FavQs API fetch failed, using fallback or old cache:", error);

    let parsedCached: DailyQuote | null = null;
    if (cachedQuote) {
      try {
        parsedCached = JSON.parse(cachedQuote);
      } catch (e) {
        // Fall through
      }
    }

    // Filter out the currently cached quote to ensure variety
    const availableFallbacks = parsedCached
      ? FALLBACK_QUOTES.filter(q => q.quote !== parsedCached!.quote)
      : FALLBACK_QUOTES;

    const pickList = availableFallbacks.length > 0 ? availableFallbacks : FALLBACK_QUOTES;
    const randomIndex = Math.floor(Math.random() * pickList.length);
    const fallback = pickList[randomIndex];

    // Cache the fallback so we don't spam attempts
    localStorage.setItem(CACHE_KEY, JSON.stringify(fallback));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());

    return fallback;
  }
}
