'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLngExpression, LatLngTuple } from 'leaflet'

export interface Destination {
  position: LatLngTuple
  radius: number
}

export interface MapProps {
  center: LatLngExpression
  zoom: number
  height: string
  markerPosition?: LatLngExpression | null
  destination?: Destination | null
  onDestinationReached?: () => void
}

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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

const LERP_FACTOR = 0.12      // 0.0 = jamais bouge, 1.0 = instantané
const MIN_MOVE_METERS = 0.5   // ignore les tremblements GPS en dessous de 0.5m

const LeafletMapView = dynamic(
  async () => {
    const mod = await import('react-leaflet')
    const { MapContainer, TileLayer, Marker, Circle, useMap } = mod

    // Composant qui gère le suivi fluide de la carte
    function SmoothFollow({ targetRef }: { targetRef: React.RefObject<LatLngTuple | null> }) {
      const map = useMap()
      const currentRef = useRef<LatLngTuple | null>(null)
      const rafRef = useRef<number>(0)

      useEffect(() => {
        function tick() {
          const target = targetRef.current
          if (target) {
            if (!currentRef.current) {
              // Premier point : centrage immédiat sans animation
              currentRef.current = target
              map.setView(target, map.getZoom(), { animate: false })
            } else {
              const [curLat, curLng] = currentRef.current
              const [tgtLat, tgtLng] = target
              const newLat = lerp(curLat, tgtLat, LERP_FACTOR)
              const newLng = lerp(curLng, tgtLng, LERP_FACTOR)
              const next: LatLngTuple = [newLat, newLng]

              // Ne pan que si le mouvement interpolé est perceptible
              const dist = haversineDistance(currentRef.current, next)
              if (dist > 0.01) {
                currentRef.current = next
                map.panTo(next, { animate: true, duration: 0.1, easeLinearity: 1 })
              }
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
      }, [map, targetRef])

      return null
    }

    return function LeafletMapViewInner(props: {
      center: LatLngExpression
      zoom: number
      height: string
      markerPosition?: LatLngExpression | null
      iconsReady: boolean
      destination?: Destination | null
      smoothTargetRef: React.RefObject<LatLngTuple | null>
    }) {
      const { center, zoom, height, markerPosition, iconsReady, destination, smoothTargetRef } = props

      return (
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height, width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            keepBuffer={4}         // garde plus de tuiles en mémoire → moins de blanc
            updateWhenIdle={false} // rafraîchit les tuiles en continu
            updateWhenZooming={false}
          />

          <SmoothFollow targetRef={smoothTargetRef} />

          {markerPosition && iconsReady && (
            <Marker position={markerPosition} />
          )}

          {destination && (
            <>
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
              {iconsReady && <Marker position={destination.position} opacity={0.85} />}
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
  const wasInsideRef = useRef(false)

  // Ref partagée avec SmoothFollow — mise à jour sans re-render
  const smoothTargetRef = useRef<LatLngTuple | null>(null)
  const lastAcceptedRef = useRef<LatLngTuple | null>(null)

  // Met à jour la cible lissée dès que markerPosition change
  useEffect(() => {
    if (!markerPosition) return
    const pos = markerPosition as LatLngTuple

    // Filtre le bruit GPS : ignore si mouvement < MIN_MOVE_METERS
    if (lastAcceptedRef.current) {
      const dist = haversineDistance(lastAcceptedRef.current, pos)
      if (dist < MIN_MOVE_METERS) return
    }

    lastAcceptedRef.current = pos
    smoothTargetRef.current = pos
  }, [markerPosition])

  // Détection entrée dans la zone destination
  useEffect(() => {
    if (!destination || !markerPosition) return
    const userPos = markerPosition as LatLngTuple
    const dist = haversineDistance(userPos, destination.position)
    const isInside = dist <= destination.radius

    if (isInside && !wasInsideRef.current) {
      console.log(`✅ Destination atteinte ! Distance : ${Math.round(dist)}m, rayon : ${destination.radius}m`)
      onDestinationReached?.()
    }
    wasInsideRef.current = isInside
  }, [markerPosition, destination, onDestinationReached])

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
      smoothTargetRef={smoothTargetRef}
    />
  )
}