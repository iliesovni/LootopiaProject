"use client";
import { useEffect, useState } from 'react'
import Map from '../../components/Map'

type Position = { lat: number; lng: number }

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  )
}

export default function TestMapPage() {
  const [position, setPosition] = useState<Position | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      // Pas de géoloc dispo → on affiche quand même la carte sur Paris
      setIsReady(true)
      return
    }

    // 1. Fix rapide : on attend la VRAIE position avant de monter la carte
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) {
          setPosition({ lat, lng })
        }
        setIsReady(true) // La carte se monte SEULEMENT ici
      },
      (err) => {
        console.error('getCurrentPosition failed:', err)
        setIsReady(true) // En cas d'erreur, on affiche quand même
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )

    // 2. Suivi continu pour les mises à jour suivantes
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) {
          setPosition({ lat, lng })
        }
      },
      (err) => console.error('watchPosition error:', err),
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (!isReady) return <p>Localisation en cours…</p>

  const DEFAULT: [number, number] = [48.8566, 2.3522]
  const center: [number, number] = position
    ? [position.lat, position.lng]
    : DEFAULT

  return (
    <Map
      center={center}
      zoom={18}
      height="100vh"
      markerPosition={position ? [position.lat, position.lng] : null}
    />
  )
}