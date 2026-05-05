'use client'

import { FormEvent, useMemo, useState } from 'react'
import type { LatLngTuple } from 'leaflet'
import type { z } from 'zod'
import AdminStepMapPicker from '@/components/AdminStepMapPicker'
import { createStepSchema } from '@/schemas/step'

type StepItem = z.infer<typeof createStepSchema>
type ARMarkerType = Exclude<StepItem['arMarkerType'], null>

const DEFAULT_CENTER: LatLngTuple = [48.98770993680927, 1.6861476692966049]

export default function TestMapAdminPage() {
  const [selectedPosition, setSelectedPosition] = useState<LatLngTuple | null>(null)
  const [steps, setSteps] = useState<StepItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [radiusMeters, setRadiusMeters] = useState(100)
  const [orderIndex, setOrderIndex] = useState(1)
  const [pointsReward, setPointsReward] = useState(10)
  const [arMarkerType, setArMarkerType] = useState<ARMarkerType | ''>('')
  const [arAssetUrl, setArAssetUrl] = useState('')
  const [huntId, setHuntId] = useState('')
  const [formError, setFormError] = useState('')

  const nextOrderIndex = useMemo(() => steps.length + 1, [steps.length])

  function handleCreateStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!selectedPosition) {
      return
    }

    const [latitude, longitude] = selectedPosition

    const candidateStep = {
      title: title.trim(),
      description: description.trim(),
      latitude,
      longitude,
      radiusMeters,
      orderIndex,
      pointsReward,
      arMarkerType: arMarkerType || null,
      arAssetUrl: arAssetUrl.trim() || null,
      huntId: huntId.trim(),
    }

    const validationResult = createStepSchema.safeParse(candidateStep)
    if (!validationResult.success) {
      setFormError(validationResult.error.issues[0]?.message ?? 'Erreur de validation du step.')
      return
    }

    setSteps((current) => [...current, validationResult.data])
    setTitle('')
    setDescription('')
    setRadiusMeters(100)
    setOrderIndex(nextOrderIndex)
    setPointsReward(10)
    setArMarkerType('')
    setArAssetUrl('')
    setSelectedPosition(null)
  }

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Test Map Admin</h1>
      <p style={{ marginTop: 0, color: '#4b5563' }}>
        Clique sur la carte pour choisir la position d un step, puis remplis les champs du schema Prisma.
      </p>
      {formError && (
        <p style={{ marginTop: 0, color: '#b91c1c', fontWeight: 500 }}>
          {formError}
        </p>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
        <AdminStepMapPicker
          center={selectedPosition ?? DEFAULT_CENTER}
          zoom={15}
          height="430px"
          selectedPosition={selectedPosition}
          previewRadiusMeters={radiusMeters}
          onMapClick={setSelectedPosition}
        />
      </div>

      <form
        onSubmit={handleCreateStep}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Titre</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Description</span>
          <input value={description} onChange={(event) => setDescription(event.target.value)} required />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Rayon (m)</span>
          <input
            type="number"
            min={1}
            value={radiusMeters}
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
            required
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Ordre</span>
          <input
            type="number"
            min={1}
            value={orderIndex}
            onChange={(event) => setOrderIndex(Number(event.target.value))}
            required
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Points reward</span>
          <input
            type="number"
            min={0}
            value={pointsReward}
            onChange={(event) => setPointsReward(Number(event.target.value))}
            required
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>AR marker type (optionnel)</span>
          <select value={arMarkerType} onChange={(event) => setArMarkerType(event.target.value as ARMarkerType | '')}>
            <option value="">Aucun</option>
            <option value="IMAGE">IMAGE</option>
            <option value="PATTERN">PATTERN</option>
            <option value="MODEL_3D">MODEL_3D</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>AR asset URL (optionnel)</span>
          <input value={arAssetUrl} onChange={(event) => setArAssetUrl(event.target.value)} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span>Hunt ID (UUID)</span>
          <input value={huntId} onChange={(event) => setHuntId(event.target.value)} required />
        </label>

        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={!selectedPosition}>
            Créer le point localement
          </button>
          <span style={{ color: '#6b7280', fontSize: '0.92rem' }}>
            {selectedPosition
              ? `Latitude: ${selectedPosition[0].toFixed(7)} | Longitude: ${selectedPosition[1].toFixed(7)}`
              : 'Clique sur la carte pour choisir latitude/longitude.'}
          </span>
        </div>
      </form>

      <section>
        <h2 style={{ marginBottom: '0.75rem' }}>Points créés (non persistants)</h2>

        {steps.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Aucun point créé pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {steps.map((step) => (
              <article
                key={`${step.huntId}-${step.orderIndex}-${step.latitude}-${step.longitude}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '0.9rem',
                  background: '#fafafa',
                }}
              >
                <strong>{step.orderIndex}. {step.title}</strong>
                <p style={{ margin: '0.4rem 0 0.6rem', color: '#374151' }}>{step.description}</p>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#374151' }}>
                  lat: {step.latitude.toFixed(7)} | lng: {step.longitude.toFixed(7)} | radius: {step.radiusMeters}m |
                  points: {step.pointsReward}
                </p>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#6b7280' }}>
                  arMarkerType: {step.arMarkerType || 'null'} | arAssetUrl: {step.arAssetUrl || 'null'} | huntId:{' '}
                  {step.huntId || 'non défini'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
