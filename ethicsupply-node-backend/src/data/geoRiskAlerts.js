const today = new Date();

/**
 * Helper function to subtract days from a date
 * @param {Date} date - The date to subtract from
 * @param {number} days - Number of days to subtract
 * @returns {Date} The new date
 */
const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

/**
 * Helper function to format date to ISO string date portion
 * @param {Date} date - The date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Seed data for geo risk alerts
 */
const geoRiskAlerts = [
  {
    title: "Political Unrest in Thailand",
    description:
      "Increasing political protests in Bangkok may cause supply chain disruptions",
    type: "political",
    country: "Thailand",
    date: subtractDays(today, 0),
    read: false,
    severity: "medium",
    source: "Economic Intelligence Unit",
  },
  {
    title: "Water Scarcity Alert: India",
    description:
      "Severe water shortages reported in manufacturing regions of South India",
    type: "environmental",
    country: "India",
    date: subtractDays(today, 1),
    read: false,
    severity: "high",
    source: "Environmental Research Institute",
  },
  {
    title: "New Labor Regulations in China",
    description:
      "Chinese government announces stricter labor laws affecting manufacturing",
    type: "regulatory",
    country: "China",
    date: subtractDays(today, 2),
    read: true,
    severity: "medium",
    source: "Global Trade Monitor",
  },
  {
    title: "Child Labor Investigation in Bangladesh",
    description:
      "NGO report highlights child labor concerns in textile industry",
    type: "socialEthical",
    country: "Bangladesh",
    date: subtractDays(today, 3),
    read: true,
    severity: "high",
    source: "Human Rights Watch",
  },
  {
    title: "Conflict Escalation in Nigeria",
    description:
      "Civil unrest increases in Lagos region, affecting oil suppliers",
    type: "conflict",
    country: "Nigeria",
    date: subtractDays(today, 4),
    read: true,
    severity: "critical",
    source: "International Crisis Group",
  },
  {
    title: "Regulatory Changes in EU Carbon Market",
    description:
      "European Union announces new carbon pricing mechanisms affecting imports",
    type: "regulatory",
    country: "Germany",
    date: subtractDays(today, 5),
    read: false,
    severity: "medium",
    source: "EU Commission",
  },
  {
    title: "Drought Conditions in California",
    description:
      "Extended drought affecting agricultural suppliers in Western US",
    type: "environmental",
    country: "United States",
    date: subtractDays(today, 6),
    read: false,
    severity: "high",
    source: "Climate Research Center",
  },
  {
    title: "Labor Strikes in South Korea",
    description:
      "Ongoing strikes at major manufacturing facilities disrupting supply chains",
    type: "political",
    country: "South Korea",
    date: subtractDays(today, 7),
    read: false,
    severity: "medium",
    source: "Asia Business Report",
  },
  {
    title: "Human Rights Concerns in Vietnam",
    description:
      "Recent reports identify worker rights violations in electronics manufacturing",
    type: "socialEthical",
    country: "Vietnam",
    date: subtractDays(today, 8),
    read: false,
    severity: "high",
    source: "Worker Rights Consortium",
  },
  {
    title: "Trade Tensions Between US and China",
    description: "Escalating tariffs may impact global supply chain costs",
    type: "political",
    country: "China",
    date: subtractDays(today, 9),
    read: false,
    severity: "medium",
    source: "International Trade Center",
  },
];

module.exports = geoRiskAlerts;
