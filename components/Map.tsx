'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLngExpression, LatLngTuple } from 'leaflet'

export interface Destination {
  position: LatLngTuple
  radius: number // en mètres
}

export interface MapProps {
  center: LatLngExpression
  zoom: number
  height: string
  markerPosition?: LatLngExpression | null
  destination?: Destination | null
  onDestinationReached?: () => void
}

// Calcul de distance Haversine entre deux points (en mètres)
function haversineDistance(a: LatLngTuple, b: LatLngTuple): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aq =
    sinDLat * sinDLat +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(aq), Math.sqrt(1 - aq))
}

const LeafletMapView = dynamic(
  async () => {
    const mod = await import('react-leaflet')
    const { MapContainer, TileLayer, Marker, Circle, useMap } = mod

    function RecenterMap({ center }: { center: LatLngExpression }) {
      const map = useMap()
      useEffect(() => {
        map.setView(center)
      }, [center, map])
      return null
    }

    return function LeafletMapViewInner(props: {
      center: LatLngExpression
      zoom: number
      height: string
      markerPosition?: LatLngExpression | null
      iconsReady: boolean
      destination?: Destination | null
    }) {
      const { center, zoom, height, markerPosition, iconsReady, destination } = props

      return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RecenterMap center={center} />

          {/* Marker de l'utilisateur */}
          {markerPosition && iconsReady && (
            <Marker position={markerPosition} />
          )}

          {/* Zone de destination */}
          {destination && (
            <>
              {/* Cercle de la zone */}
              <Circle
                center={destination.position}
                radius={destination.radius}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '6 4',
                }}
              />
              {/* Marker de la destination */}
              {iconsReady && (
                <Marker
                  position={destination.position}
                  opacity={0.85}
                />
              )}
            </>
          )}
        </MapContainer>
      )
    }
  },
  { ssr: false }
)

export default function Map({
  center,
  zoom,
  height,
  markerPosition = null,
  destination = null,
  onDestinationReached,
}: MapProps) {
  const [iconsReady, setIconsReady] = useState(false)
  const wasInsideRef = useState(false)

  // Détection d'entrée dans la zone
  useEffect(() => {
    if (!destination || !markerPosition) return
    const userPos = markerPosition as LatLngTuple
    const dist = haversineDistance(userPos, destination.position)
    const isInside = dist <= destination.radius

    if (isInside && !wasInsideRef[0]) {
      console.log(`✅ Destination atteinte ! Distance : ${Math.round(dist)}m, rayon : ${destination.radius}m`)
      onDestinationReached?.()
    }
    wasInsideRef[0] = isInside
  }, [markerPosition, destination, onDestinationReached])

  // Init icônes Leaflet
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const Lmod = await import('leaflet')
      const L: any = (Lmod as any).default ?? Lmod
      const iconRetinaUrl = (markerIcon2x as any).src ?? (markerIcon2x as any).default ?? markerIcon2x
      const iconUrl = (markerIcon as any).src ?? (markerIcon as any).default ?? markerIcon
      const shadowUrl = (markerShadow as any).src ?? (markerShadow as any).default ?? markerShadow
      if (L?.Icon?.Default?.prototype?._getIconUrl) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
      }
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
      if (!cancelled) setIconsReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <LeafletMapView
      center={center}
      zoom={zoom}
      height={height}
      markerPosition={markerPosition}
      iconsReady={iconsReady}
      destination={destination}
    />
  )
}