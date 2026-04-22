'use client'

import { useEffect, useState } from 'react'
import Map, { Destination } from './Map'

type Position = { lat: number; lng: number }

interface SmartMapProps {
  destinations: Destination[]
  zoom?: number
  height?: string
  defaultCenter?: [number, number]
}

function isValidCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export default function SmartMap({
  destinations,
  zoom = 16,
  height = '100vh',
  defaultCenter = [48.8566, 2.3522],
}: SmartMapProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null)
  const [popupVisible, setPopupVisible] = useState(false)

  const handleDestinationAction = (destination: Destination) => {
    const action = destination.action
    if (!action) return
    if (action.onClick) {
      action.onClick()
      return
    }
    if (action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsReady(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
        setIsReady(true)
      },
      () => setIsReady(true),
      { enableHighAccuracy: true, timeout: 8000 }
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
      },
      () => {},
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (!isReady) return <p>Localisation en cours...</p>

  const center: [number, number] = position ? [position.lat, position.lng] : defaultCenter

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <Map
        center={center}
        zoom={zoom}
        height={height}
        markerPosition={position ? [position.lat, position.lng] : null}
        destinations={destinations}
        onDestinationReached={(dest) => {
          setActiveDestination(dest)
          setPopupVisible(true)
        }}
        onDestinationLeft={() => {
          setActiveDestination(null)
          setPopupVisible(false)
        }}
      />

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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
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
          <p style={{ margin: 0, color: '#444', fontSize: '0.95rem' }}>{activeDestination.description}</p>
          {activeDestination.action && (
            <button
              onClick={() => handleDestinationAction(activeDestination)}
              style={{
                marginTop: '0.9rem',
                width: '100%',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.7rem',
                padding: '0.65rem 0.9rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {activeDestination.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
