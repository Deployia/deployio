/**
 * Built-in subdomain terms blocked on contains match (case-insensitive after normalize).
 * Admins can add more via /admin/subdomains/blocklist.
 */
const DEFAULT_BLOCKED_SUBDOMAIN_TERMS = [
  { term: "admin", matchType: "exact", category: "reserved" },
  { term: "phishing", matchType: "contains", category: "abusive" },
  { term: "malware", matchType: "contains", category: "abusive" },
  { term: "ransomware", matchType: "contains", category: "abusive" },
  { term: "porn", matchType: "contains", category: "illegal" },
  { term: "xxx", matchType: "contains", category: "illegal" },
  { term: "casino", matchType: "contains", category: "abusive" },
  { term: "fraud", matchType: "contains", category: "abusive" },
  { term: "scam", matchType: "contains", category: "abusive" },
  { term: "nazi", matchType: "contains", category: "illegal" },
  { term: "terror", matchType: "contains", category: "illegal" },
];

module.exports = { DEFAULT_BLOCKED_SUBDOMAIN_TERMS };
