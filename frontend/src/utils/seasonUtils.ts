export interface SeasonInfo {
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  monthName: string;
  image: string;
  seasonLabel: string;
  gradientOverlay: string;
}

export const SEASON_IMAGES: Record<string, string> = {
  Spring: "/seasons/spring.jpg",
  Summer: "/seasons/summer.jpg",
  Autumn: "/seasons/autumn.jpg",
  Winter: "/seasons/winter.jpg",
};

/**
 * Returns seasonal metadata and descriptive image path for a given date.
 * Mapped to Northern Hemisphere calendar:
 * - Spring: March (2), April (3), May (4)
 * - Summer: June (5), July (6), August (7)
 * - Autumn: September (8), October (9), November (10)
 * - Winter: December (11), January (0), February (1)
 */
export function getSeasonInfo(date: Date = new Date()): SeasonInfo {
  const month = date.getMonth();
  const monthName = date.toLocaleDateString("en-US", { month: "long" }).toUpperCase();

  if (month >= 2 && month <= 4) {
    return {
      season: "Spring",
      monthName,
      image: SEASON_IMAGES.Spring,
      seasonLabel: "Spring Season",
      gradientOverlay: "linear-gradient(180deg, rgba(8, 71, 94, 0.25) 0%, rgba(5, 30, 42, 0.72) 100%)",
    };
  }

  if (month >= 5 && month <= 7) {
    return {
      season: "Summer",
      monthName,
      image: SEASON_IMAGES.Summer,
      seasonLabel: "Summer Season",
      gradientOverlay: "linear-gradient(180deg, rgba(8, 71, 94, 0.25) 0%, rgba(5, 30, 42, 0.72) 100%)",
    };
  }

  if (month >= 8 && month <= 10) {
    return {
      season: "Autumn",
      monthName,
      image: SEASON_IMAGES.Autumn,
      seasonLabel: "Autumn Season",
      gradientOverlay: "linear-gradient(180deg, rgba(8, 71, 94, 0.25) 0%, rgba(5, 30, 42, 0.72) 100%)",
    };
  }

  return {
    season: "Winter",
    monthName,
    image: SEASON_IMAGES.Winter,
    seasonLabel: "Winter Season",
    gradientOverlay: "linear-gradient(180deg, rgba(8, 71, 94, 0.25) 0%, rgba(5, 30, 42, 0.72) 100%)",
  };
}
