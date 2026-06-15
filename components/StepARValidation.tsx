'use client'

import {
  activateARBodyLock,
  cleanupOrphanCameraElements,
  deactivateARBodyLock,
  mountLocARSession,
  type LocARSession,
} from '@/lib/ar/mountLocarSession'
import { useEffect, useRef, useState } from 'react'
import type { Material, Mesh, PerspectiveCamera } from 'three'

export type StepARValidationProps = {
  stepTitle: string
  arMarkerType?: string | null
  arAssetUrl?: string | null
  onValidated: () => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const MARKER_COLORS: Record<string, number> = {
  IMAGE: 0xffd700,
  PATTERN: 0x9333ea,
  MODEL_3D: 0x2563eb,
}

function getMarkerColor(arMarkerType?: string | null) {
  if (!arMarkerType) return 0xff4500
  return MARKER_COLORS[arMarkerType] ?? 0xff4500
}

function randomPositionInView() {
  return {
    x: (Math.random() * 2 - 1) * 1.4,
    y: (Math.random() * 2 - 1) * 1 + 0.15,
    z: -(2.5 + Math.random() * 1.5),
  }
}

export default function StepARValidation({
  stepTitle,
  arMarkerType,
  onValidated,
  onCancel,
  isSubmitting = false,
}: StepARValidationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onValidatedRef = useRef(onValidated)
  const sessionRef = useRef<LocARSession | null>(null)
  const targetMeshRef = useRef<Mesh | null>(null)
  const pulseDirectionRef = useRef(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [found, setFound] = useState(false)

  onValidatedRef.current = onValidated

  useEffect(() => {
    activateARBodyLock()
    return () => {
      deactivateARBodyLock()
      cleanupOrphanCameraElements()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let removePointerListener: (() => void) | undefined

    async function initAR() {
      if (!containerRef.current) return

      const onPointerDown = async (event: PointerEvent) => {
        const session = sessionRef.current
        const targetMesh = targetMeshRef.current
        if (cancelled || !targetMesh || !session) return

        const THREE = await import('three')
        const rect = session.canvas.getBoundingClientRect()
        const pointer = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )

        const camera = session.app.camera as PerspectiveCamera
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObject(targetMesh, false)
        if (hits.length === 0) return

        setFound(true)
        setError(null)

        try {
          await onValidatedRef.current()
        } catch (err) {
          setFound(false)
          setError(err instanceof Error ? err.message : "Impossible de valider l'étape.")
        }
      }

      try {
        setIsLoading(true)
        setError(null)

        const THREE = await import('three')
        if (cancelled || !containerRef.current) return

        const session = await mountLocARSession({
          container: containerRef.current,
          onFrame: () => {
            const targetMesh = targetMeshRef.current
            if (!targetMesh) return

            targetMesh.rotation.y += 0.02
            targetMesh.rotation.x += 0.008

            const scale = targetMesh.scale.x + pulseDirectionRef.current * 0.004
            if (scale >= 1.15 || scale <= 0.9) pulseDirectionRef.current *= -1
            targetMesh.scale.setScalar(Math.min(1.15, Math.max(0.9, scale)))
          },
        })

        if (cancelled) {
          session.dispose()
          return
        }

        sessionRef.current = session

        const spawn = randomPositionInView()
        const geometry = new THREE.BoxGeometry(0.35, 0.35, 0.35)
        const material = new THREE.MeshStandardMaterial({
          color: getMarkerColor(arMarkerType),
          emissive: getMarkerColor(arMarkerType),
          emissiveIntensity: 0.35,
          metalness: 0.4,
          roughness: 0.3,
        })
        const targetMesh = new THREE.Mesh(geometry, material)
        targetMesh.position.set(spawn.x, spawn.y, spawn.z)
        targetMeshRef.current = targetMesh
        session.app.scene.add(targetMesh)

        session.app.scene.add(new THREE.AmbientLight(0xffffff, 0.9))
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(1, 2, 1)
        session.app.scene.add(directionalLight)

        session.canvas.addEventListener('pointerdown', onPointerDown)
        removePointerListener = () => {
          session.canvas.removeEventListener('pointerdown', onPointerDown)
        }
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Erreur lors du démarrage de la validation AR.',
        )
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    initAR()

    return () => {
      cancelled = true
      removePointerListener?.()

      const targetMesh = targetMeshRef.current
      if (targetMesh) {
        targetMesh.geometry.dispose()
        ;(targetMesh.material as Material).dispose()
        targetMeshRef.current = null
      }

      sessionRef.current?.dispose()
      sessionRef.current = null
    }
  }, [arMarkerType])

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-black">
      <div className="absolute left-0 right-0 top-0 z-[2001] flex items-center justify-between gap-3 bg-black/70 px-4 py-3 text-white backdrop-blur">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting || found}
          className="rounded-lg border border-white/30 px-3 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
        >
          Retour carte
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold">Validation AR</p>
          <p className="truncate text-xs text-white/70">{stepTitle}</p>
        </div>
        <div className="w-[88px]" />
      </div>

      <div ref={containerRef} className="relative min-h-0 flex-1 pt-[52px]" />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 pt-[52px] text-white">
          Ouverture de la caméra...
        </div>
      )}

      {!isLoading && !error && !found && (
        <div className="pointer-events-none absolute bottom-6 left-4 right-4 z-[2002] rounded-lg bg-black/70 px-4 py-3 text-center text-sm text-white backdrop-blur">
          Déplace ton téléphone pour trouver l&apos;objet, puis touche-le pour valider l&apos;étape.
        </div>
      )}

      {found && (
        <div className="pointer-events-none absolute bottom-6 left-4 right-4 z-[2002] rounded-lg bg-green-600/90 px-4 py-3 text-center text-sm font-medium text-white">
          {isSubmitting ? 'Validation en cours...' : 'Objet trouvé !'}
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-4 right-4 z-[2002] rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
