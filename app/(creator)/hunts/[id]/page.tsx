  'use client'

  import Link from 'next/link'
  import { useRouter } from 'next/navigation'
  import { FormEvent, use, useEffect, useMemo, useState } from 'react'
  import type { LatLngTuple } from 'leaflet'
  import AdminStepMapPicker from '@/components/AdminStepMapPicker'
  import { apiClient, ApiClientError, CreateClueInput, CreateStepInput, HuntOwnerDetail } from '@/lib/frontend/api-client'
  import { createHuntSchema } from '@/schemas/hunt'
  import { createStepSchema } from '@/schemas/step'
  import { createClueSchema } from '@/schemas/clue'
  import { Difficulty, HuntStatus, HuntVisibility } from '@prisma/client'

  type FormState = {
    title: string
    description?: string | null
    location: string
    difficulty: Difficulty
    visibility: HuntVisibility
    startLat: number
    startLng: number
  }

  export default function EditHuntPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = use(params)

    const router = useRouter()

    const [hunt, setHunt] = useState<HuntOwnerDetail | null>(null)

    const [formData, setFormData] = useState<FormState>({
      title: '',
      description: '',
      location: '',
      difficulty: Difficulty.MEDIUM,
      visibility: HuntVisibility.PUBLIC,
      startLat: 48.8566,
      startLng: 2.3522,
    })

    const [accessCode, setAccessCode] = useState('')
    const [error, setError] = useState<string>('')
    const [stepError, setStepError] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCreatingStep, setIsCreatingStep] = useState(false)
    const [isCreatingClue, setIsCreatingClue] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [selectedStepPosition, setSelectedStepPosition] = useState<LatLngTuple | null>(null)
    const [stepTitle, setStepTitle] = useState('')
    const [stepDescription, setStepDescription] = useState('')
    const [stepRadiusMeters, setStepRadiusMeters] = useState(100)
    const [stepOrderIndex, setStepOrderIndex] = useState(0)
    const [stepPointsReward, setStepPointsReward] = useState(10)
    const [stepArMarkerType, setStepArMarkerType] = useState<'' | 'IMAGE' | 'PATTERN' | 'MODEL_3D'>('')
    const [stepArAssetUrl, setStepArAssetUrl] = useState('')
    const [steps, setSteps] = useState<HuntOwnerDetail['steps']>([])
    const [activeStepId, setActiveStepId] = useState<string | null>(null)
    const [clueContent, setClueContent] = useState('')
    const [cluePenaltyPoints, setCluePenaltyPoints] = useState(0)
    const [clueOrderIndex, setClueOrderIndex] = useState(0)

    useEffect(() => {
      async function loadHunt() {
        try {
          setIsLoading(true)

          const huntDetail = await apiClient.getHuntDetail(id) as HuntOwnerDetail

          setHunt(huntDetail)

          setFormData({
            title: huntDetail.title,
            description: huntDetail.description,
            location: huntDetail.location,
            difficulty: huntDetail.difficulty as Difficulty,
            visibility: huntDetail.visibility as HuntVisibility,
            startLat: huntDetail.startLat,
            startLng: huntDetail.startLng,
          })

          setSteps(huntDetail.steps ?? [])
          setStepOrderIndex(huntDetail.steps?.length ?? 0)
          setAccessCode(huntDetail.accessCode ?? '')
        } catch (err) {
          const message =
            err instanceof ApiClientError
              ? err.message
              : 'Erreur lors du chargement de la chasse.'

          setError(message)
        } finally {
          setIsLoading(false)
        }
      }

      loadHunt()
    }, [id])

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()

      setError('')

      const payload = {
        ...formData,
        accessCode:
          formData.visibility === HuntVisibility.PRIVATE
            ? accessCode
            : undefined,
      }

      const validation = createHuntSchema.safeParse(payload)

      if (!validation.success) {
        setError(
          validation.error.issues[0]?.message ?? 'Formulaire invalide.'
        )

        return
      }

      try {
        setIsSubmitting(true)

        await apiClient.updateHunt(id, validation.data)

        router.push('/hunts')
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Erreur lors de la mise à jour de la chasse.'

        setError(message)
      } finally {
        setIsSubmitting(false)
      }
    }

    const isPublished = hunt?.status === HuntStatus.PUBLISHED

    const DEFAULT_MAP_CENTER: LatLngTuple = [48.8566, 2.3522]

    const nextStepOrderIndex = useMemo(
      () => Math.max(0, steps.length),
      [steps.length]
    )

    const activeStep = useMemo(
      () => steps.find((step) => step.id === activeStepId) ?? null,
      [steps, activeStepId]
    )

    useEffect(() => {
      if (activeStep) {
        setClueOrderIndex(activeStep.clues.length)
      }
    }, [activeStep?.id, activeStep?.clues.length])

    async function handleCreateStep(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (isPublished) return

      if (!selectedStepPosition) {
        setStepError('Sélectionne une position sur la carte pour créer l’étape.')
        return
      }

      setStepError('')

      const [latitude, longitude] = selectedStepPosition
      const payload: CreateStepInput = {
        title: stepTitle.trim(),
        description: stepDescription.trim(),
        latitude,
        longitude,
        radiusMeters: stepRadiusMeters,
        orderIndex: stepOrderIndex,
        pointsReward: stepPointsReward,
        huntId: id,
        arMarkerType: stepArMarkerType || null,
        arAssetUrl: stepArAssetUrl.trim() || null,
      }

      const validation = createStepSchema.safeParse(payload)
      if (!validation.success) {
        setStepError(validation.error.issues[0]?.message ?? 'Erreur de validation du step.')
        return
      }

      try {
        setIsCreatingStep(true)
        const createdStep = await apiClient.createStep(id, validation.data)

        setSteps((current) => [...current, createdStep])
        setHunt((current) =>
          current
            ? {
                ...current,
                steps: [...current.steps, createdStep],
              }
            : current
        )
        setActiveStepId(createdStep.id)
        setSelectedStepPosition(null)
        setStepTitle('')
        setStepDescription('')
        setStepRadiusMeters(100)
        setStepOrderIndex(nextStepOrderIndex + 1)
        setStepPointsReward(10)
        setStepArMarkerType('')
        setStepArAssetUrl('')
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Erreur lors de l'ajout de l'étape."
        setStepError(message)
      } finally {
        setIsCreatingStep(false)
      }
    }

    async function handleCreateClue(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      if (isPublished || !activeStep) return

      setStepError('')

      const payload: CreateClueInput = {
        stepId: activeStep.id,
        content: clueContent.trim(),
        penaltyPoints: cluePenaltyPoints,
        orderIndex: clueOrderIndex,
      }

      const validation = createClueSchema.safeParse(payload)
      if (!validation.success) {
        setStepError(validation.error.issues[0]?.message ?? "Erreur de validation de l'indice.")
        return
      }

      try {
        setIsCreatingClue(true)
        const createdClue = await apiClient.createClue(validation.data)

        setSteps((current) =>
          current.map((step) =>
            step.id === activeStep.id
              ? { ...step, clues: [...step.clues, createdClue] }
              : step
          )
        )
        setHunt((current) =>
          current
            ? {
                ...current,
                steps: current.steps.map((step) =>
                  step.id === activeStep.id
                    ? { ...step, clues: [...step.clues, createdClue] }
                    : step
                ),
              }
            : current
        )
        setClueContent('')
        setCluePenaltyPoints(0)
        setClueOrderIndex(activeStep.clues.length + 1)
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Erreur lors de l'ajout de l'indice."
        setStepError(message)
      } finally {
        setIsCreatingClue(false)
      }
    }

    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <Link
            href="/hunts"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            ← Retour
          </Link>

          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Modifier la chasse
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              Met à jour les détails de ta chasse au trésor
            </p>

            {isLoading ? (
              <div className="mt-8 space-y-4">
                <div className="h-6 rounded-lg bg-gray-200" />
                <div className="h-40 rounded-lg bg-gray-200" />
              </div>
            ) : (
              <div>
                {error && (
                  <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                    {error}
                  </div>
                )}

                {hunt && (
                  <div>
                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                      {isPublished && (
                        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
                        Cette chasse est publiée et ne peut plus être modifiée.
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Titre <span className="text-red-600">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            title: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                        placeholder="Ex: Le trésor de Marseille"
                        required
                        disabled={isPublished}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Description
                      </label>

                      <textarea
                        value={formData.description || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                        rows={3}
                        placeholder="Décrivez votre chasse..."
                        disabled={isPublished}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Localisation <span className="text-red-600">*</span>
                      </label>

                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                        placeholder="Ex: Marseille, France"
                        required
                        disabled={isPublished}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Coordonnées de départ
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Latitude *
                          </label>

                          <input
                            type="number"
                            step="0.0001"
                            min="-90"
                            max="90"
                            value={formData.startLat}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startLat: parseFloat(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                            required
                            disabled={isPublished}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Longitude *
                          </label>

                          <input
                            type="number"
                            step="0.0001"
                            min="-180"
                            max="180"
                            value={formData.startLng}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startLng: parseFloat(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                            required
                            disabled={isPublished}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Difficulté <span className="text-red-600">*</span>
                      </label>

                      <select
                        value={formData.difficulty}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            difficulty: e.target.value as Difficulty,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                        required
                        disabled={isPublished}
                      >
                        <option value={Difficulty.EASY}>Facile</option>
                        <option value={Difficulty.MEDIUM}>Moyen</option>
                        <option value={Difficulty.HARD}>Difficile</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Visibilité <span className="text-red-600">*</span>
                      </label>

                      <select
                        value={formData.visibility}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            visibility: e.target.value as HuntVisibility,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                        required
                        disabled={isPublished}
                      >
                        <option value={HuntVisibility.PUBLIC}>
                          Public - Tout le monde peut rejoindre
                        </option>

                        <option value={HuntVisibility.PRIVATE}>
                          Privé - Besoin d&apos;un code d&apos;accès
                        </option>
                      </select>
                    </div>

                    {formData.visibility === HuntVisibility.PRIVATE && (
                      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                        <label className="block text-sm font-semibold text-blue-900 mb-2">
                          Code d&apos;accès (8 chiffres){' '}
                          <span className="text-red-600">*</span>
                        </label>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={accessCode}
                          onChange={(e) =>
                            setAccessCode(
                              e.target.value
                                .replace(/\D/g, '')
                                .slice(0, 8)
                            )
                          }
                          className="w-full rounded-lg border-2 border-blue-300 px-4 py-3 text-center font-mono text-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                          placeholder="12345678"
                          maxLength={8}
                          required
                          disabled={isPublished}
                        />

                        <p className="mt-2 text-xs text-blue-700">
                          Les joueurs auront besoin de ce code pour rejoindre ta
                          chasse
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting || isPublished}
                        className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting
                          ? 'Mise à jour en cours...'
                          : isPublished
                          ? 'Impossible de modifier'
                          : 'Enregistrer les modifications'}
                      </button>

                      <Link
                        href="/hunts"
                        className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-center font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
                      >
                        Annuler
                      </Link>
                    </div>

                    <p className="mt-8 text-xs text-gray-600 text-center">
                      <span className="text-red-600">*</span> Champs obligatoires.
                    </p>
                  </form>

                  <div className="mt-12 rounded-3xl border border-gray-200 bg-slate-50 p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Ajouter une étape</h2>
                        <p className="mt-1 text-sm text-gray-600">
                          Clique sur la carte pour définir la position, puis remplis les détails de l&apos;étape.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                        {steps.length} étape{steps.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    {stepError && (
                      <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                        {stepError}
                      </div>
                    )}

                    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                      <AdminStepMapPicker
                        center={selectedStepPosition ?? [hunt.startLat, hunt.startLng]}
                        zoom={15}
                        height="360px"
                        selectedPosition={selectedStepPosition}
                        previewRadiusMeters={stepRadiusMeters}
                        onMapClick={setSelectedStepPosition}
                      />
                    </div>

                    <form onSubmit={handleCreateStep} className="mt-6 grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Titre</span>
                        <input
                          type="text"
                          value={stepTitle}
                          onChange={(e) => setStepTitle(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          required
                          disabled={isPublished}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Description</span>
                        <input
                          type="text"
                          value={stepDescription}
                          onChange={(e) => setStepDescription(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          required
                          disabled={isPublished}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Rayon (m)</span>
                        <input
                          type="number"
                          min={1}
                          value={stepRadiusMeters}
                          onChange={(e) => setStepRadiusMeters(Number(e.target.value))}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          required
                          disabled={isPublished}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Ordre</span>
                        <input
                          type="number"
                          min={0}
                          value={stepOrderIndex}
                          onChange={(e) => setStepOrderIndex(Number(e.target.value))}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          required
                          disabled={isPublished}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Points reward</span>
                        <input
                          type="number"
                          min={0}
                          value={stepPointsReward}
                          onChange={(e) => setStepPointsReward(Number(e.target.value))}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          required
                          disabled={isPublished}
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-gray-900">Type AR (optionnel)</span>
                        <select
                          value={stepArMarkerType}
                          onChange={(e) => setStepArMarkerType(e.target.value as 'IMAGE' | 'PATTERN' | 'MODEL_3D' | '')}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          disabled={isPublished}
                        >
                          <option value="">Aucun</option>
                          <option value="IMAGE">IMAGE</option>
                          <option value="PATTERN">PATTERN</option>
                          <option value="MODEL_3D">MODEL_3D</option>
                        </select>
                      </label>

                      <label className="grid gap-2 sm:col-span-2">
                        <span className="text-sm font-semibold text-gray-900">URL AR (optionnel)</span>
                        <input
                          type="text"
                          value={stepArAssetUrl}
                          onChange={(e) => setStepArAssetUrl(e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                          disabled={isPublished}
                        />
                      </label>

                      <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="submit"
                          disabled={isCreatingStep || isPublished}
                          className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isCreatingStep ? 'Création...' : 'Créer l’étape'}
                        </button>

                        <span className="text-sm text-gray-600">
                          {selectedStepPosition
                            ? `Latitude ${selectedStepPosition[0].toFixed(5)} | Longitude ${selectedStepPosition[1].toFixed(5)}`
                            : 'Clique sur la carte pour choisir la position.'}
                        </span>
                      </div>
                    </form>

                    <div className="mt-10 space-y-4">
                      {steps.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                          Aucune étape créée pour le moment.
                        </div>
                      ) : (
                        steps.map((step) => (
                          <div
                            key={step.id}
                            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="text-sm text-gray-500">Étape {step.orderIndex}</div>
                                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveStepId(step.id)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                  activeStepId === step.id
                                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                {activeStepId === step.id ? 'Sélectionnée' : 'Sélectionner'}
                              </button>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gray-600">
                              <div>Lat: {step.latitude.toFixed(5)}</div>
                              <div>Lng: {step.longitude.toFixed(5)}</div>
                              <div>Rayon: {step.radiusMeters} m</div>
                              <div>Points: {step.pointsReward}</div>
                            </div>

                            {step.clues.length > 0 && (
                              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                                <div className="text-sm font-semibold text-gray-900">Indices</div>
                                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                                  {step.clues.map((clue) => (
                                    <li key={clue.id} className="rounded-2xl border border-gray-200 bg-white px-3 py-2">
                                      <div className="font-medium">{clue.orderIndex}. {clue.content}</div>
                                      <div className="text-xs text-gray-500">Pénalité: {clue.penaltyPoints}</div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Ajouter un indice</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Sélectionne une étape ci-dessus pour y ajouter un indice.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {activeStep ? `Étape ${activeStep.orderIndex}` : 'Aucune sélection'}
                        </span>
                      </div>

                      <form onSubmit={handleCreateClue} className="mt-6 grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-gray-900">Contenu</span>
                          <input
                            type="text"
                            value={clueContent}
                            onChange={(e) => setClueContent(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                            required
                            disabled={isPublished || !activeStep}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-gray-900">Pénalité</span>
                          <input
                            type="number"
                            min={0}
                            value={cluePenaltyPoints}
                            onChange={(e) => setCluePenaltyPoints(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                            required
                            disabled={isPublished || !activeStep}
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="text-sm font-semibold text-gray-900">Ordre</span>
                          <input
                            type="number"
                            min={0}
                            value={clueOrderIndex}
                            onChange={(e) => setClueOrderIndex(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                            disabled={isPublished || !activeStep}
                          />
                        </label>

                        <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="submit"
                            disabled={isCreatingClue || isPublished || !activeStep}
                            className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isCreatingClue ? 'Ajout...' : 'Ajouter l’indice'}
                          </button>

                          <span className="text-sm text-gray-600">
                            {activeStep ? `Étape sélectionnée: ${activeStep.title}` : 'Sélectionne une étape pour commencer.'}
                          </span>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }