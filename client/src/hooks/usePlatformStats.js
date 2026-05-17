import { useEffect, useState } from "react";
import api from "@utils/api";

const FALLBACK_STATS = {
  developers: { display: "5,000+", value: 5000 },
  deployments: { display: "10,000+", value: 10000 },
  projects: { display: "2,500+", value: 2500 },
  countries: { display: "50+", value: 50 },
  uptime: { display: "99.9%", value: 99.9 },
  avgDeployTime: { display: "30s", value: 30 },
};

export function usePlatformStats() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const response = await api.get("/external/platform-stats");
        if (!cancelled && response.data?.success && response.data?.data) {
          setStats(response.data.data);
        }
      } catch {
        if (!cancelled) {
          setStats(FALLBACK_STATS);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading };
}

export default usePlatformStats;
