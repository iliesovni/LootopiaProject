'use client'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import React from 'react'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLngExpression, LatLngTuple } from 'leaflet'

export interface Destination {
  position: LatLngTuple
  radius: number
  label?: string
  description?: string
  action?: {
    label: string
    url?: string
    onClick?: () => void
  }
}

export interface MapProps {
  center: LatLngExpression
  zoom: number
  height: string
  markerPosition?: LatLngExpression | null
  destinations?: Destination[]
  onDestinationReached?: (destination: Destination, index: number) => void
  onDestinationLeft?: (destination: Destination, index: number) => void
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

const LERP_FACTOR = 0.12
const MIN_MOVE_METERS = 0.5
const RESUME_DELAY = 3000

const LeafletMapView = dynamic(
  async () => {
    const mod = await import('react-leaflet')
    const { MapContainer, TileLayer, Marker, Circle, useMap } = mod

    function SmoothFollow({ targetRef }: { targetRef: React.RefObject<LatLngTuple | null> }) {
      const map = useMap()
      const currentRef = useRef<LatLngTuple | null>(null)
      const rafRef = useRef<number>(0)
      const userInteractingRef = useRef(false)
      const interactTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

      useEffect(() => {
        function onInteractStart() {
          userInteractingRef.current = true
          if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current)
        }

        function onInteractEnd() {
          if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current)
          interactTimeoutRef.current = setTimeout(() => {
            userInteractingRef.current = false
            if (targetRef.current) {
              currentRef.current = targetRef.current
            }
          }, RESUME_DELAY)
        }

        map.on('dragstart', onInteractStart)
        map.on('dragend', onInteractEnd)
        map.on('zoomstart', onInteractStart)
        map.on('zoomend', onInteractEnd)

        return () => {
          map.off('dragstart', onInteractStart)
          map.off('dragend', onInteractEnd)
          map.off('zoomstart', onInteractStart)
          map.off('zoomend', onInteractEnd)
          if (interactTimeoutRef.current) clearTimeout(interactTimeoutRef.current)
        }
      }, [map, targetRef])

      useEffect(() => {
        function tick() {
          const target = targetRef.current
          if (target && !userInteractingRef.current) {
            if (!currentRef.current) {
              currentRef.current = target
              map.setView(target, map.getZoom(), { animate: false })
            } else {
              const [curLat, curLng] = currentRef.current
              const [tgtLat, tgtLng] = target
              const newLat = lerp(curLat, tgtLat, LERP_FACTOR)
              const newLng = lerp(curLng, tgtLng, LERP_FACTOR)
              const next: LatLngTuple = [newLat, newLng]
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
      destinations?: Destination[]
      smoothTargetRef: React.RefObject<LatLngTuple | null>
    }) {
      const { center, zoom, height, markerPosition, iconsReady, destinations, smoothTargetRef } = props

      return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }} zoomControl={true}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            keepBuffer={4}
            updateWhenIdle={false}
            updateWhenZooming={false}
          />
          <SmoothFollow targetRef={smoothTargetRef} />
          {markerPosition && iconsReady && <Marker position={markerPosition} />}
          {destinations?.map((dest, i) => (
            <React.Fragment key={i}>
              <Circle
                center={dest.position}
                radius={dest.radius}
                pathOptions={{
                  color: '#2563eb',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: '6 4',
                }}
              />
              {iconsReady && <Marker position={dest.position} opacity={0.85} />}
            </React.Fragment>
          ))}
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
  destinations = [],
  onDestinationReached,
  onDestinationLeft,
}: MapProps) {
  const [iconsReady, setIconsReady] = useState(false)
  const wasInsideRef = useRef<boolean[]>([])
  const smoothTargetRef = useRef<LatLngTuple | null>(null)
  const lastAcceptedRef = useRef<LatLngTuple | null>(null)

  useEffect(() => {
    if (!markerPosition) return
    const pos = markerPosition as LatLngTuple
    if (lastAcceptedRef.current) {
      const dist = haversineDistance(lastAcceptedRef.current, pos)
      if (dist < MIN_MOVE_METERS) return
    }
    lastAcceptedRef.current = pos
    smoothTargetRef.current = pos
  }, [markerPosition])

  useEffect(() => {
    if (!destinations.length || !markerPosition) return
    const userPos = markerPosition as LatLngTuple

    destinations.forEach((dest, i) => {
      const dist = haversineDistance(userPos, dest.position)
      const isInside = dist <= dest.radius
      const wasInside = wasInsideRef.current[i] ?? false

      if (isInside && !wasInside) {
        console.log(`✅ Destination ${i} atteinte !`)
        onDestinationReached?.(dest, i)
      } else if (!isInside && wasInside) {
        console.log(`👋 Destination ${i} quittée !`)
        onDestinationLeft?.(dest, i)
      }
      wasInsideRef.current[i] = isInside
    })
  }, [markerPosition, destinations, onDestinationReached, onDestinationLeft])

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
      destinations={destinations}
      smoothTargetRef={smoothTargetRef}
    />
  )
}