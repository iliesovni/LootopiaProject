"use client";
import { useEffect, useRef, useState } from 'react'
import Map, { Destination } from '../../components/Map'

type Position = { lat: number; lng: number }

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  )
}

// 🎯 Configurez votre destination ici
const DESTINATION: Destination = {
  position: [48.990582, 1.680819], // Tour Eiffel
  radius: 200,                  // 200 mètres
}

export default function TestMapPage() {
  const [position, setPosition] = useState<Position | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) { setIsReady(true); return }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
        setIsReady(true)
        console.log('Position:', { lat, lng })
      },
      (err) => { console.error(err); setIsReady(true) },
      { enableHighAccuracy: true, timeout: 8000 }
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (!isReady) return <p>Localisation en cours…</p>

  const DEFAULT: [number, number] = [48.8566, 2.3522]
  const center: [number, number] = position ? [position.lat, position.lng] : DEFAULT

  return (
    <Map
      center={center}
      zoom={16}
      height="100vh"
      markerPosition={position ? [position.lat, position.lng] : null}
      destination={DESTINATION}
      onDestinationReached={() => console.log('🎉 onDestinationReached callback fired!')}
    />
  )
}