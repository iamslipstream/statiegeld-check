export interface SeasonalFlair {
  emoji: string;
  /** Short, friendly label used as a tooltip / aria-label. */
  label: string;
}

/**
 * A little seasonal emoji for the header that changes through the year
 * (Northern-hemisphere / Netherlands seasons), with a few holiday cameos.
 */
export function seasonalFlair(date: Date = new Date()): SeasonalFlair {
  const month = date.getMonth(); // 0 = Jan
  const day = date.getDate();

  // Holiday cameos take priority.
  if (month === 11 && day >= 6) return { emoji: "🎄", label: "Happy holidays" };
  if (month === 9 && day >= 24) return { emoji: "🎃", label: "Spooky season" };
  if (month === 0 && day <= 2) return { emoji: "🎉", label: "Happy New Year" };

  // Seasons.
  if (month === 11 || month <= 1) return { emoji: "❄️", label: "Winter" };
  if (month <= 4) return { emoji: "🌷", label: "Spring" };
  if (month <= 7) return { emoji: "☀️", label: "Summer" };
  return { emoji: "🍂", label: "Autumn" };
}
