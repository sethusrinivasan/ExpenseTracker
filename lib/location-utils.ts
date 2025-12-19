interface LocationData {
  city: string
  region: string
  country: string
  lat: number
  lon: number
}

export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  try {
    // Use ip-api.com for geolocation (free, no API key required)
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.status === "fail") {
      return null
    }

    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
    }
  } catch (error) {
    console.error("[v0] Error fetching location from IP:", error)
    return null
  }
}

export function getSceneryQuery(location: LocationData): string {
  // Create a descriptive query for scenery based on location
  const landmarks: Record<string, string> = {
    "New York": "Central Park New York skyline sunset",
    "San Francisco": "Golden Gate Bridge San Francisco Bay",
    "Los Angeles": "Santa Monica Beach California sunset",
    Chicago: "Chicago skyline Lake Michigan",
    London: "Tower Bridge Thames River London",
    Paris: "Eiffel Tower Paris scenic",
    Tokyo: "Mount Fuji cherry blossoms Tokyo",
    Sydney: "Sydney Opera House Harbor Bridge",
    Mumbai: "Gateway of India Mumbai sunset",
    Delhi: "India Gate Delhi monument",
    Bangalore: "Bangalore palace gardens",
    Singapore: "Marina Bay Sands Singapore skyline",
    Dubai: "Burj Khalifa Dubai skyline",
    Seattle: "Space Needle Mount Rainier Seattle",
    Boston: "Boston Harbor waterfront",
    Miami: "Miami Beach South Beach sunset",
    Toronto: "CN Tower Toronto skyline",
    Vancouver: "Vancouver waterfront mountains",
  }

  // Check if city has a specific landmark
  for (const [city, query] of Object.entries(landmarks)) {
    if (location.city.includes(city)) {
      return query
    }
  }

  // Default to generic scenery based on region/country
  return `${location.city} ${location.country} scenic landscape`
}
