const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const BACKEND_URL = isLocal
  ? 'http://localhost:5000'
  : 'https://floodcast-backend-ttv1.onrender.com'

function toLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Compute the centroid of a GeoJSON polygon ring.
 * Coordinates are [lon, lat] pairs.
 */
function polygonCentroid(coordinates) {
  const ring = coordinates[0]
  const lons = ring.map(c => c[0])
  const lats = ring.map(c => c[1])
  return {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lng: (Math.min(...lons) + Math.max(...lons)) / 2,
  }
}

/**
 * Returns flood risk zones for the Route Planner map.
 * Shape: { zones: [{ name, lat, lng, risk_level, radius_m }] }
 */
export async function getZones() {
  const res = await fetch(`${BACKEND_URL}/api/gis/zones`)
  if (!res.ok) throw new Error('Failed to fetch zones')
  const geojson = await res.json()

  const zones = (geojson.features || []).map(f => {
    const centroid = polygonCentroid(f.geometry.coordinates)
    // Map backend risk_level strings to upper-case for the route planner
    const rl = (f.properties.risk_level || 'low').toUpperCase()
    return {
      name:      f.properties.name,
      lat:       centroid.lat,
      lng:       centroid.lng,
      risk_level: rl === 'MEDIUM-HIGH' ? 'HIGH' : rl,   // consolidate medium-high → HIGH
      radius_m:  600,
    }
  })

  return { zones }
}

/**
 * Returns current flood prediction for the Route Planner.
 * Shape: { risk_level: 'LOW'|'MEDIUM'|'HIGH', probability: number }
 */
export async function predictFlood(date, _hour) {
  const target = date || toLocalISO(new Date())
  const today  = toLocalISO(new Date())
  const endpoint = target === today
    ? `${BACKEND_URL}/api/predict/now`
    : `${BACKEND_URL}/api/predict/date/${target}`

  const res = await fetch(endpoint)
  if (!res.ok) throw new Error('Failed to fetch prediction')
  const data = await res.json()

  const prob = data.city_prediction?.calibrated_probability ?? 0
  let risk_level = 'LOW'
  if (prob >= 0.05)      risk_level = 'HIGH'
  else if (prob >= 0.02) risk_level = 'MEDIUM'

  return { risk_level, probability: prob }
}
