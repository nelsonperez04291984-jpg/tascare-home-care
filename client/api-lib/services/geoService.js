/**
 * Southern Tasmania Clinical Geography Service
 * Providing heuristic distances for logistical prioritizing.
 */

const SUBURB_COORDS = {
  "Hobart": { x: 0, y: 0 },
  "Battery Point": { x: 0.5, y: -1 },
  "Sandy Bay": { x: 1, y: -3 },
  "Taroona": { x: 1.5, y: -8 },
  "Kingston": { x: 2, y: -12 },
  "Blackmans Bay": { x: 2.5, y: -15 },
  "Moonah": { x: -1, y: 5 },
  "Glenorchy": { x: -1.5, y: 8 },
  "Claremont": { x: -2, y: 14 },
  "Bellerive": { x: 4, y: 2 },
  "Lindisfarne": { x: 3.5, y: 5 },
  "Howrah": { x: 6, y: -1 },
  "Rokeby": { x: 8, y: -4 },
};

/**
 * Calculates a heuristic driving distance in KM between two suburbs.
 * Uses a simplified Manhattan distance with a "Bridge Penalty" for Eastern Shore crossings.
 */
export const calculateDistance = (suburbA, suburbB) => {
  const sA = SUBURB_COORDS[suburbA] || SUBURB_COORDS["Hobart"]; 
  const sB = SUBURB_COORDS[suburbB] || SUBURB_COORDS["Hobart"];

  let distance = Math.abs(sA.x - sB.x) + Math.abs(sA.y - sB.y);

  // Eastern Shore Bridge Penalty (Crossing the Derwent River)
  const isAEastern = sA.x >= 3;
  const isBEastern = sB.x >= 3;
  if (isAEastern !== isBEastern) {
    distance += 4; // Add 4km for the bridge crossing + traffic overhead
  }

  return parseFloat(distance.toFixed(1));
};

/**
 * Estimates travel time in minutes based on distance.
 * Heuristic: 1.8 mins per KM + 5 mins baseline (parking/prep).
 */
export const getTravelTime = (distanceKm) => {
  return Math.round((distanceKm * 1.8) + 5);
};

export default {
  calculateDistance,
  getTravelTime
};
