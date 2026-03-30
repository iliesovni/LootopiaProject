"use client";

import { useEffect, useState } from 'react'

import Map from '../../components/Map'

type Position = {
  lat: number
  lng: number
}

const DEFAULT_POSITION: Position = { lat: 48.8566, lng: 2.3522 } // Paris par défaut

export default function TestMapPage() {
  // Important: on évite de monter/démonter MapContainer à chaque changement de position.
  // Sinon Leaflet peut conserver un état sur le conteneur et provoquer "already initialized".
  const [position, setPosition] = useState<Position | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [center, setCenter] = useState<[number, number]>([DEFAULT_POSITION.lat, DEFAULT_POSITION.lng])

  useEffect(() => {
    setIsMounted(true)

    if (!navigator.geolocation) {
      console.error('Geolocation API not available')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        // Garde-fou: Leaflet plante si on lui passe NaN ou des valeurs hors bornes.
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        if (lat < -90 || lat > 90) return
        if (lng < -180 || lng > 180) return

        const next = { lat, lng }
        setPosition(next)
        setCenter([lat, lng])
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  if (!isMounted) return <p>Chargement...</p>

  return (
    <Map
      center={center}
      zoom={18}
      height="100vh"
      markerPosition={position ? [position.lat, position.lng] : null}
    />
  )
}