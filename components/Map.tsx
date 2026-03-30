// Composant Leaflet centralisé
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import 'leaflet/dist/leaflet.css'

// Chargement côté client uniquement pour éviter "window is not defined" en SSR.
// Astuce: on charge MapContainer/TileLayer/Marker dans le même chunk pour éviter
// les montages partiels qui peuvent mener à "_leaflet_events" sur "undefined".
const LeafletMapView = dynamic(
  async () => {
    const mod = await import('react-leaflet')

    const MapContainer = mod.MapContainer
    const TileLayer = mod.TileLayer
    const Marker = mod.Marker

    return function LeafletMapViewInner(props: {
      center: LatLngExpression
      zoom: number
      height: string
      markerPosition?: LatLngExpression | null
      iconsReady: boolean
    }) {
      const { center, zoom, height, markerPosition, iconsReady } = props

      return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {markerPosition && iconsReady ? <Marker position={markerPosition} /> : null}
        </MapContainer>
      )
    }
  },
  { ssr: false }
)

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import type { LatLngExpression } from 'leaflet'

export interface MapProps {
  center: LatLngExpression
  zoom: number
  height: string
  markerPosition?: LatLngExpression | null
}

export default function Map({ center, zoom, height, markerPosition = null }: MapProps) {
  // Leaflet a besoin des icônes pour afficher le marker correctement.
  // On évite d'appeler Leaflet tant qu'on n'est pas côté client.
  const [iconsReady, setIconsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const Lmod = await import('leaflet')
      const L: any = (Lmod as any).default ?? Lmod

      const iconRetinaUrl =
        (markerIcon2x as any).src ?? (markerIcon2x as any).default ?? markerIcon2x
      const iconUrl = (markerIcon as any).src ?? (markerIcon as any).default ?? markerIcon
      const shadowUrl =
        (markerShadow as any).src ?? (markerShadow as any).default ?? markerShadow

      // S'assure que les icônes Leaflet fonctionnent (notamment avec Next).
      if (L?.Icon?.Default?.prototype?._getIconUrl) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
      })

      if (!cancelled) setIconsReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <LeafletMapView
      center={center}
      zoom={zoom}
      height={height}
      markerPosition={markerPosition}
      iconsReady={iconsReady}
    />
  )
}