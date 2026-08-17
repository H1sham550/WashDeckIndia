import { describe, it, expect } from "vitest";
import { calculateDistanceMeters } from "@/lib/geo";

describe("Geofence GPS Distance Calculations", () => {
  // Test Station GPS: Connaught Place, New Delhi (28.6315, 77.2167)
  const stationLat = 28.6315;
  const stationLon = 77.2167;

  it("calculates 0 meters for the exact same location", () => {
    const dist = calculateDistanceMeters(stationLat, stationLon, stationLat, stationLon);
    expect(dist).toBe(0);
  });

  it("calculates accurate distance within typical station radius (~30 meters)", () => {
    // Offset by ~0.0003 degrees latitude (~33 meters)
    const staffLat = stationLat + 0.0003;
    const staffLon = stationLon;
    const dist = calculateDistanceMeters(stationLat, stationLon, staffLat, staffLon);

    expect(dist).toBeGreaterThan(25);
    expect(dist).toBeLessThan(40);
    expect(dist).toBeLessThanOrEqual(50); // within 50m minimum cap
  });

  it("detects staff outside a strict 50m radius", () => {
    // Offset by ~0.001 degrees (~111 meters away)
    const staffLat = stationLat + 0.001;
    const staffLon = stationLon;
    const dist = calculateDistanceMeters(stationLat, stationLon, staffLat, staffLon);

    expect(dist).toBeGreaterThan(50);
  });

  it("correctly calculates kilometer distances for off-site staff", () => {
    // India Gate (~3.2 km from Connaught Place)
    const indiaGateLat = 28.6129;
    const indiaGateLon = 77.2295;
    const dist = calculateDistanceMeters(stationLat, stationLon, indiaGateLat, indiaGateLon);

    expect(dist).toBeGreaterThan(2000);
    expect(dist).toBeLessThan(3000);
  });
});
