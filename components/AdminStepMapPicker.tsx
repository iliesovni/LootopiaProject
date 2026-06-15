'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { LatLngExpression, LatLngTuple } from 'leaflet'

interface AdminStepMapPickerProps {
  center: LatLngExpression
  zoom?: number
  height?: string
  selectedPosition: LatLngTuple | null
  previewRadiusMeters: number
  onMapClick: (position: LatLngTuple) => void
}

const LeafletPicker = dynamic(
  async () => {
    const mod = await import('react-leaflet')
    const { MapContainer, TileLayer, Marker, Circle, useMapEvents } = mod

    function ClickHandler({ onMapClick }: { onMapClick: (position: LatLngTuple) => void }) {
      useMapEvents({
        click(event) {
          onMapClick([event.latlng.lat, event.latlng.lng])
        },
      })

      return null
    }

    return function LeafletPickerInner(props: {
      center: LatLngExpression
      zoom: number
      height: string
      selectedPosition: LatLngTuple | null
      previewRadiusMeters: number
      onMapClick: (position: LatLngTuple) => void
      iconsReady: boolean
    }) {
      const { center, zoom, height, selectedPosition, previewRadiusMeters, onMapClick, iconsReady } = props

      return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }} zoomControl={true}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={onMapClick} />

          {selectedPosition && (
            <>
              <Circle
                center={selectedPosition}
                radius={previewRadiusMeters}
                pathOptions={{
                  color: '#dc2626',
                  fillColor: '#ef4444',
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              />
              {iconsReady && <Marker position={selectedPosition} />}
            </>
          )}
        </MapContainer>
      )
    }
  },
  { ssr: false }
)

export default function AdminStepMapPicker({
  center,
  zoom = 14,
  height = '420px',
  selectedPosition,
  previewRadiusMeters,
  onMapClick,
}: AdminStepMapPickerProps) {
  const [iconsReady, setIconsReady] = useState(false)

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

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <LeafletPicker
      center={center}
      zoom={zoom}
      height={height}
      selectedPosition={selectedPosition}
      previewRadiusMeters={previewRadiusMeters}
      onMapClick={onMapClick}
      iconsReady={iconsReady}
    />
  )
}
