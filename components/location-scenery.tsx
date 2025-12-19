import { getLatestExpenseLocation } from "@/actions/expenses"
import { getLocationFromIP, getSceneryQuery } from "@/lib/location-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import Image from "next/image"

export async function LocationScenery() {
  const ipAddress = await getLatestExpenseLocation()

  if (!ipAddress) {
    return null
  }

  const location = await getLocationFromIP(ipAddress)

  if (!location) {
    return null
  }

  const sceneryQuery = getSceneryQuery(location)

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Expense Location Scenery
        </CardTitle>
        <CardDescription>
          Based on your most recent expense from {location.city}, {location.country}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-64 rounded-lg overflow-hidden">
          <Image
            src={`/.jpg?height=400&width=800&query=${encodeURIComponent(sceneryQuery)}`}
            alt={`Scenery of ${location.city}, ${location.country}`}
            fill
            className="object-cover"
          />
        </div>
      </CardContent>
    </Card>
  )
}
