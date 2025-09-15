// utils/geocode.js
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return "";
    const data = await res.json();
    return data.display_name || "";
  } catch (e) {
    console.error("reverseGeocode error", e);
    return "";
  }
}
