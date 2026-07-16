import { describe, expect, it } from "vitest";
import { parseLatLng } from "@/lib/geo";

describe("parseLatLng", () => {
  it("parses raw 'lat, lng'", () => {
    expect(parseLatLng("-17.8292, 31.0522")).toEqual({
      lat: -17.8292,
      lng: 31.0522,
    });
  });

  it("parses a Google Maps @lat,lng URL", () => {
    expect(
      parseLatLng("https://www.google.com/maps/@-17.9257,25.8526,15z"),
    ).toEqual({ lat: -17.9257, lng: 25.8526 });
  });

  it("parses a ?q=lat,lng URL", () => {
    expect(parseLatLng("https://maps.google.com/?q=-20.15,28.58")).toEqual({
      lat: -20.15,
      lng: 28.58,
    });
  });

  it("parses a URL-encoded query=lat%2Clng URL", () => {
    expect(
      parseLatLng(
        "https://www.google.com/maps/search/?api=1&query=-18.97%2C32.67",
      ),
    ).toEqual({ lat: -18.97, lng: 32.67 });
  });

  it("returns null for empty input", () => {
    expect(parseLatLng("")).toBeNull();
    expect(parseLatLng("   ")).toBeNull();
  });

  it("returns null for text and shortened links", () => {
    expect(parseLatLng("Harare Gardens")).toBeNull();
    expect(parseLatLng("https://maps.app.goo.gl/AbC123")).toBeNull();
  });

  it("returns null for out-of-range coordinates", () => {
    expect(parseLatLng("91, 31")).toBeNull();
    expect(parseLatLng("-17, 181")).toBeNull();
  });

  it("returns null for malformed percent-encoding", () => {
    expect(parseLatLng("https://maps.google.com/?q=%E0%A4%A")).toBeNull();
  });
});
