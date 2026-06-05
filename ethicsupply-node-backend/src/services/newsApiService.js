const axios = require("axios");
const NodeCache = require("node-cache");

// Cache news for 2 hours to stay within free tier limits (100 req/day)
const newsCache = new NodeCache({ stdTTL: 7200 });

const NEWS_API_BASE = "https://newsapi.org/v2";
const CACHE_KEY = "geo_risk_news";

// Supply chain relevant countries to monitor
const MONITORED_COUNTRIES = [
  "China", "India", "Bangladesh", "Vietnam", "Thailand", "Mexico",
  "Brazil", "Indonesia", "Pakistan", "Cambodia", "Myanmar", "Ethiopia",
  "Turkey", "Malaysia", "Philippines", "Sri Lanka", "Egypt", "Nigeria",
  "South Africa", "Kenya", "Ukraine", "Russia", "Taiwan", "South Korea",
  "Japan", "Germany", "United States", "United Kingdom", "France",
  "Italy", "Spain", "Poland", "Czech Republic", "Hungary",
];

// Keywords mapped to risk types for article classification
const RISK_KEYWORDS = {
  political: [
    "political unrest", "government instability", "protest", "coup",
    "sanctions", "trade war", "tariff", "election", "corruption",
    "diplomatic", "political crisis", "government collapse",
  ],
  environmental: [
    "flood", "drought", "earthquake", "climate change", "pollution",
    "wildfire", "typhoon", "cyclone", "hurricane", "water scarcity",
    "deforestation", "environmental disaster", "heat wave",
  ],
  socialEthical: [
    "labor strike", "worker rights", "child labor", "human rights",
    "forced labor", "wage theft", "slavery", "trafficking",
    "gender discrimination", "unsafe working conditions", "union",
  ],
  conflict: [
    "war", "armed conflict", "military", "civil war", "terrorism",
    "insurgency", "attack", "bombing", "violence", "militia",
    "ceasefire", "troops", "invasion",
  ],
  regulatory: [
    "regulation", "new law", "compliance", "ban", "policy",
    "legislation", "trade agreement", "import restriction",
    "export ban", "carbon tax", "supply chain law", "due diligence",
  ],
};

// Keywords to filter for supply chain relevance
const SUPPLY_CHAIN_KEYWORDS = [
  "supply chain", "factory", "manufacturing", "trade", "export", "import",
  "labor", "worker", "goods", "logistics", "port", "shipping",
];

/**
 * Classify an article into a risk type based on its content
 */
function classifyArticle(title, description) {
  const text = `${title} ${description || ""}`.toLowerCase();
  const scores = {};

  for (const [type, keywords] of Object.entries(RISK_KEYWORDS)) {
    scores[type] = keywords.filter((kw) => text.includes(kw)).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return "political"; // default

  return Object.keys(scores).find((k) => scores[k] === maxScore);
}

/**
 * Extract country from article content by matching against monitored list
 */
function extractCountry(title, description, sourceName) {
  const text = `${title} ${description || ""} ${sourceName || ""}`;
  for (const country of MONITORED_COUNTRIES) {
    if (text.includes(country)) return country;
  }
  return "Global";
}

/**
 * Determine severity based on article keywords
 */
function determineSeverity(title, description) {
  const text = `${title} ${description || ""}`.toLowerCase();

  const criticalWords = ["war", "invasion", "attack", "explosion", "collapse", "crisis", "emergency"];
  const highWords = ["protest", "strike", "flood", "fire", "conflict", "sanctions", "ban"];
  const lowWords = ["warning", "concern", "risk", "potential", "possible"];

  if (criticalWords.some((w) => text.includes(w))) return "critical";
  if (highWords.some((w) => text.includes(w))) return "high";
  if (lowWords.some((w) => text.includes(w))) return "low";
  return "medium";
}

/**
 * Transform a NewsAPI article into our GeoRiskAlert format
 */
function transformArticle(article) {
  const title = article.title || "Untitled";
  const description = article.description || article.content || "";
  const sourceName = article.source?.name || "Unknown";

  return {
    title: title.length > 120 ? title.substring(0, 117) + "..." : title,
    description: description.length > 500
      ? description.substring(0, 497) + "..."
      : description || "No description available.",
    type: classifyArticle(title, description),
    country: extractCountry(title, description, sourceName),
    date: article.publishedAt ? new Date(article.publishedAt) : new Date(),
    severity: determineSeverity(title, description),
    source: sourceName,
    url: article.url || null,
    read: false,
    isLive: true,
  };
}

/**
 * Fetch live geopolitical risk news from NewsAPI
 * Returns array of GeoRiskAlert-shaped objects
 */
async function fetchLiveGeoRiskNews(apiKey, options = {}) {
  const { forceRefresh = false, maxResults = 30 } = options;

  if (!apiKey) {
    throw new Error("NEWS_API_KEY is not configured");
  }

  // Return cached data if available
  if (!forceRefresh) {
    const cached = newsCache.get(CACHE_KEY);
    if (cached) {
      console.log("[NewsAPI] Returning cached news data");
      return cached;
    }
  }

  const queries = [
    "supply chain disruption OR trade sanctions OR labor strike",
    "political unrest factory workers OR manufacturing protest",
    "environmental disaster flood earthquake supply",
    "forced labor human rights violation manufacturing",
    "armed conflict trade route logistics",
  ];

  // Pick one query at a time (rotating based on time to spread API calls)
  const queryIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 2)) % queries.length;
  const query = queries[queryIndex];

  console.log(`[NewsAPI] Fetching live news: "${query}"`);

  const response = await axios.get(`${NEWS_API_BASE}/everything`, {
    params: {
      q: query,
      language: "en",
      sortBy: "publishedAt",
      pageSize: Math.min(maxResults, 100),
      apiKey,
    },
    timeout: 10000,
  });

  if (response.data.status !== "ok") {
    throw new Error(`NewsAPI error: ${response.data.message}`);
  }

  const articles = response.data.articles || [];

  // Filter out articles without title/description and transform
  const alerts = articles
    .filter((a) => a.title && a.title !== "[Removed]" && a.description)
    .map(transformArticle)
    .slice(0, maxResults);

  console.log(`[NewsAPI] Fetched ${alerts.length} articles, caching for 2 hours`);

  newsCache.set(CACHE_KEY, alerts);
  return alerts;
}

/**
 * Get top headlines for specific supply chain risk categories
 * Uses NewsAPI /top-headlines endpoint (more reliable on free tier)
 */
async function fetchTopRiskHeadlines(apiKey, options = {}) {
  const { forceRefresh = false } = options;
  const HEADLINES_KEY = "geo_risk_headlines";

  if (!apiKey) {
    throw new Error("NEWS_API_KEY is not configured");
  }

  if (!forceRefresh) {
    const cached = newsCache.get(HEADLINES_KEY);
    if (cached) {
      console.log("[NewsAPI] Returning cached headlines");
      return cached;
    }
  }

  const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
    params: {
      q: "supply chain OR trade war OR labor rights OR sanctions",
      language: "en",
      pageSize: 20,
      apiKey,
    },
    timeout: 10000,
  });

  if (response.data.status !== "ok") {
    throw new Error(`NewsAPI error: ${response.data.message}`);
  }

  const articles = (response.data.articles || [])
    .filter((a) => a.title && a.title !== "[Removed]")
    .map(transformArticle);

  newsCache.set(HEADLINES_KEY, articles, 3600); // 1 hour for headlines
  return articles;
}

/**
 * Get cached news without making a new API call (for fallback)
 */
function getCachedNews() {
  return newsCache.get(CACHE_KEY) || newsCache.get("geo_risk_headlines") || null;
}

module.exports = {
  fetchLiveGeoRiskNews,
  fetchTopRiskHeadlines,
  getCachedNews,
  transformArticle,
  classifyArticle,
  extractCountry,
};
