'use client'

import {
  activateARBodyLock,
  cleanupOrphanCameraElements,
  deactivateARBodyLock,
  mountLocARSession,
  type LocARSession,
} from '@/lib/ar/mountLocarSession'
import { useEffect, useRef, useState } from 'react'
import type { Material, Mesh } from 'three'

type HuntStep = {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  radiusMeters: number
  orderIndex: number
  pointsReward: number
  arMarkerType: string | null
  arAssetUrl: string | null
  huntId: string
}

type StepsResponse = {
  success?: boolean
  message?: string
  data?: HuntStep[]
}

type ARViewerProps = {
  huntId: string
}

export default function ARViewer({ huntId }: ARViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<LocARSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    activateARBodyLock()
    return () => {
      deactivateARBodyLock()
      cleanupOrphanCameraElements()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const meshes: Mesh[] = []

    async function initLocar() {
      if (!containerRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        const stepResponse = await fetch(`/api/hunts/${huntId}/listSteps`, {
          credentials: 'include',
        })

        if (!stepResponse.ok) {
          throw new Error(`Impossible de charger les étapes (${stepResponse.status}).`)
        }

        const response: StepsResponse = await stepResponse.json()
        const stepData = [...(response.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)

        if (stepData.length === 0) {
          throw new Error('Aucune étape AR disponible pour cette chasse.')
        }

        const session = await mountLocARSession({
          container: containerRef.current,
        })

        if (cancelled) {
          session.dispose()
          return
        }

        sessionRef.current = session

        session.locar.on('gpserror', (gpsError: GeolocationPositionError) => {
          setError(`Erreur GPS (${gpsError.code}) : ${gpsError.message}`)
        })

        let markersAdded = false

        session.locar.on('gpsupdate', async () => {
          if (markersAdded || stepData.length === 0) return

          const THREE = await import('three')
          for (const step of stepData) {
            const geometry = new THREE.BoxGeometry(10, 10, 10)
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
            const mesh = new THREE.Mesh(geometry, material)
            meshes.push(mesh)
            session.locar.add(mesh, step.longitude, step.latitude)
          }

          markersAdded = true
        })

        await session.locar.startGps()
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Erreur lors du démarrage de la vue AR.'
        setError(message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    initLocar()

    return () => {
      cancelled = true
      meshes.forEach((mesh) => {
        mesh.geometry.dispose()
        ;(mesh.material as Material).dispose()
      })
      sessionRef.current?.dispose()
      sessionRef.current = null
    }
  }, [huntId])

  return (
    <div className="relative h-[calc(100vh-60px)] w-full bg-black">
      <div ref={containerRef} className="relative h-full w-full" />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-white">
          Initialisation de la vue AR...
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 z-[10] rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
