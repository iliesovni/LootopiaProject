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

//utiliser cette liste afin de mettre en place les points sur la map. cela passe la latitude et la longitude pour chaque point. https://www.gps-coordinates.net/.
const DESTINATIONS: Destination[] = [
  { position: [48.98770993680927, 1.6861476692966049], radius: 200, label: 'Centre', description: 'Va travailler' },
  { position: [48.99064614114862, 1.6810830313727587], radius: 150, label: 'Basic Frites', description: 'Misère c est les jambes ajourd hui'  },
  { position: [48.989324992860325, 1.6759300478983574], radius: 100, label: 'Kawasaki', description: 'Y a des motos un peu'  },
]

export default function TestMapPage() {
  const [position, setPosition] = useState<Position | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null)
  const [popupVisible, setPopupVisible] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) { setIsReady(true); return }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
        setIsReady(true)
      },
      (err) => { console.warn('getCurrentPosition failed:', err.message); setIsReady(true) },
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
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <Map
        center={center}
        zoom={16}
        height="100vh"
        markerPosition={position ? [position.lat, position.lng] : null}
        destinations={DESTINATIONS}
        onDestinationReached={(dest) => {
          setActiveDestination(dest)
          setPopupVisible(true)
        }}
        onDestinationLeft={() => {
          setActiveDestination(null)
          setPopupVisible(false)
        }}
      />

      {/* Bouton pour rouvrir la popup quand elle est cachée */}
      {activeDestination && !popupVisible && (
        <button
          onClick={() => setPopupVisible(true)}
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '2rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          📍 {activeDestination.label}
        </button>
      )}

      {/* Popup */}
      {activeDestination && popupVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'white',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: '260px',
            maxWidth: '90vw',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ fontSize: '1.1rem' }}>📍 {activeDestination.label}</strong>
            <button
              onClick={() => setPopupVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0 0.25rem',
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, color: '#444', fontSize: '0.95rem' }}>
            {activeDestination.description}
          </p>
        </div>
      )}
    </div>
  )
}