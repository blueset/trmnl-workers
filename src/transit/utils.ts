import type { CompassDirection, CombinedDirectionShorthand } from "./types";

// Calculate distance in meters using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate bearing in degrees (0 = North, 90 = East, etc.)
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

// Get rotation angle for direction icon (N = 0deg, E = 90deg, etc.)
export function getDirectionRotation(direction: string): number {
  const rotations: Record<string, number> = {
    N: 0,
    NE: 45,
    E: 90,
    SE: 135,
    S: 180,
    SW: 225,
    W: 270,
    NW: 315,
  };
  return rotations[direction] || 0;
}

// Convert bearing (0-360 degrees) to compass direction
export function getCompassDirection(bearing: number): CompassDirection {
  // Normalize bearing to 0-360
  const normalized = ((bearing % 360) + 360) % 360;

  // Map to 8 cardinal directions
  if (normalized >= 337.5 || normalized < 22.5) return "↑"; // N
  if (normalized >= 22.5 && normalized < 67.5) return "↗"; // NE
  if (normalized >= 67.5 && normalized < 112.5) return "→"; // E
  if (normalized >= 112.5 && normalized < 157.5) return "↘"; // SE
  if (normalized >= 157.5 && normalized < 202.5) return "↓"; // S
  if (normalized >= 202.5 && normalized < 247.5) return "↙"; // SW
  if (normalized >= 247.5 && normalized < 292.5) return "←"; // W
  return "↖"; // NW
}

// Get combined direction shorthand if applicable
export function getCombinedDirectionShorthand(
  directions: CompassDirection[]
): CompassDirection | CombinedDirectionShorthand {
  if (directions.length !== 2) {
    return directions[0] || "↑";
  }

  const set = new Set(directions);

  // Check for opposite pairs
  if (set.has("↑") && set.has("↓")) return "↕"; // N-S
  if (set.has("→") && set.has("←")) return "↔"; // E-W
  if (set.has("↗") && set.has("↙")) return "⤢"; // NE-SW
  if (set.has("↖") && set.has("↘")) return "⤡"; // NW-SE

  // Not a valid opposite pair, return first direction
  return directions[0];
}

// Calculate relative luminance using WCAG formula
export function getRelativeLuminance(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Format distance based on unit preference
export function formatDistance(
  meters: number,
  unit: "meter" | "feet"
): string {
  if (unit === "feet") {
    const feet = meters * 3.28084;
    return `${Math.round(feet)}ft`;
  }
  return `${Math.round(meters)}m`;
}

// Format time based on hour cycle
export function formatTime(
  timestampMs: number,
  hourCycle: "h12" | "h23"
): { hour: string; minute: string } {
  const date = new Date(timestampMs);
  
  // Get hours and minutes in America/Los_Angeles timezone
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  
  const parts = timeFormatter.formatToParts(date);
  const hours = parseInt(parts.find(p => p.type === "hour")?.value || "0");
  const minutes = parseInt(parts.find(p => p.type === "minute")?.value || "0");

  if (hourCycle === "h12") {
    const period = hours >= 12 ? "p" : "a";
    const hour12 = hours % 12 || 12;
    return {
      hour: `${hour12}${period}`,
      minute: minutes.toString().padStart(2, "0"),
    };
  }

  return {
    hour: `${hours}:`,
    minute: minutes.toString().padStart(2, "0"),
  };
}

// Segment stop name to identify common parts with other stop names
export function segmentStopName(
  name: string,
  allStopNames: string[]
): Array<{ text: string; isMuted: boolean }> {
  const otherNames = allStopNames.filter((n) => n !== name);

  if (otherNames.length === 0) {
    return [{ text: name, isMuted: false }];
  }

  const nameParts = name.split(" & ");

  if (nameParts.length === 1) {
    return [{ text: name, isMuted: false }];
  }

  let maxCommonPrefix = 0;
  let maxCommonSuffix = 0;

  for (const otherName of otherNames) {
    const otherParts = otherName.split(" & ");

    // Find common prefix (matching substrings from the start)
    let prefixLen = 0;
    while (
      prefixLen < nameParts.length &&
      prefixLen < otherParts.length &&
      nameParts[prefixLen] === otherParts[prefixLen]
    ) {
      prefixLen++;
    }
    maxCommonPrefix = Math.max(maxCommonPrefix, prefixLen);

    // Find common suffix (matching substrings from the end)
    let suffixLen = 0;
    while (
      suffixLen < nameParts.length &&
      suffixLen < otherParts.length &&
      nameParts[nameParts.length - 1 - suffixLen] ===
        otherParts[otherParts.length - 1 - suffixLen]
    ) {
      suffixLen++;
    }
    maxCommonSuffix = Math.max(maxCommonSuffix, suffixLen);
  }

  // If prefix and suffix would overlap or cover entire name, don't dim
  if (maxCommonPrefix + maxCommonSuffix >= nameParts.length) {
    return [{ text: name, isMuted: false }];
  }

  if (maxCommonPrefix === 0 && maxCommonSuffix === 0) {
    return [{ text: name, isMuted: false }];
  }

  const segments: Array<{ text: string; isMuted: boolean }> = [];

  const prefixParts = nameParts.slice(0, maxCommonPrefix);
  const middleParts = nameParts.slice(
    maxCommonPrefix,
    nameParts.length - maxCommonSuffix
  );
  const suffixParts =
    maxCommonSuffix > 0 ? nameParts.slice(-maxCommonSuffix) : [];

  if (prefixParts.length > 0) {
    segments.push({ text: prefixParts.join(" & ") + " & ", isMuted: true });
  }

  if (middleParts.length > 0) {
    segments.push({ text: middleParts.join(" & "), isMuted: false });
  }

  if (suffixParts.length > 0) {
    segments.push({ text: " & " + suffixParts.join(" & "), isMuted: true });
  }

  return segments;
}
