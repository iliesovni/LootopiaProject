'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Map, { Destination } from '@/components/Map'
import {
  apiClient,
  ApiClientError,
  CompleteStepResult,
  ParticipationGameplay,
} from '@/lib/frontend/api-client'

type HuntGameplayMapProps = {
  participationId: string
  initialGameplay: ParticipationGameplay
  onGameplayChange: (gameplay: ParticipationGameplay) => void
}

type Position = { lat: number; lng: number }

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

export default function HuntGameplayMap({
  participationId,
  initialGameplay,
  onGameplayChange,
}: HuntGameplayMapProps) {
  const [gameplay, setGameplay] = useState(initialGameplay)
  const [position, setPosition] = useState<Position | null>(null)
  const [isGeoReady, setIsGeoReady] = useState(false)
  const [isInRange, setIsInRange] = useState(false)
  const [actionError, setActionError] = useState('')
  const [isUsingClue, setIsUsingClue] = useState(false)
  const [isCompletingStep, setIsCompletingStep] = useState(false)
  const [lastPointsEarned, setLastPointsEarned] = useState<number | null>(null)

  const currentStep = gameplay.participation.currentStep
  const stepNumber = currentStep ? currentStep.step.orderIndex + 1 : gameplay.participation.totalStepsCount

  const destinations: Destination[] = useMemo(() => {
    if (!currentStep) return []

    return [
      {
        id: currentStep.stepId,
        position: [currentStep.step.latitude, currentStep.step.longitude],
        radius: currentStep.step.radiusMeters,
        label: currentStep.step.title,
        description: currentStep.step.description,
      },
    ]
  }, [currentStep])

  const mapCenter: [number, number] = useMemo(() => {
    if (currentStep) {
      return [currentStep.step.latitude, currentStep.step.longitude]
    }
    return [48.8566, 2.3522]
  }, [currentStep])

  const revealedClues = currentStep?.step.clues.filter((clue) => clue.content) ?? []
  const nextClue = currentStep?.step.clues[currentStep.cluesUsed]
  const remainingClues = currentStep
    ? currentStep.step.clues.length - currentStep.cluesUsed
    : 0

  const refreshGameplay = useCallback(async () => {
    const updated = await apiClient.getParticipationGameplay(participationId)
    setGameplay(updated)
    onGameplayChange(updated)
    return updated
  }, [onGameplayChange, participationId])

  useEffect(() => {
    setIsInRange(false)
  }, [currentStep?.stepId])

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsGeoReady(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
        setIsGeoReady(true)
      },
      () => setIsGeoReady(true),
      { enableHighAccuracy: true, timeout: 8000 },
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (isValidCoord(lat, lng)) setPosition({ lat, lng })
      },
      () => {},
      { enableHighAccuracy: true },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  async function handleUseClue() {
    if (!currentStep || !nextClue) return

    try {
      setIsUsingClue(true)
      setActionError('')
      await apiClient.useClue(participationId, { stepId: currentStep.stepId })
      await refreshGameplay()
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : 'Impossible de révéler un indice.')
    } finally {
      setIsUsingClue(false)
    }
  }

  async function handleCompleteStep() {
    if (!currentStep) return

    try {
      setIsCompletingStep(true)
      setActionError('')
      const result: CompleteStepResult = await apiClient.completeStep(participationId, {
        stepId: currentStep.stepId,
      })
      setIsInRange(false)
      await refreshGameplay()
      setLastPointsEarned(result.pointsEarned)
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "Impossible de valider l'étape.")
    } finally {
      setIsCompletingStep(false)
    }
  }

  async function handleFinishHunt() {
    try {
      setActionError('')
      await apiClient.finishParticipation(participationId)
      window.location.href = `/play/${participationId}`
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : 'Impossible de terminer la chasse.')
    }
  }

  if (!isGeoReady) {
    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-slate-100 text-gray-600">
        Localisation en cours...
      </div>
    )
  }

  return (
    <div className="relative flex h-[calc(100vh-60px)] flex-col">
      <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between gap-3 bg-white/95 px-4 py-3 shadow-md backdrop-blur">
        <Link
          href={`/play/${participationId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          Pause
        </Link>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-gray-900">{gameplay.hunt.title}</p>
          {currentStep && (
            <p className="text-xs text-gray-500">
              Étape {stepNumber}/{gameplay.participation.totalStepsCount}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-semibold text-purple-800">
          {gameplay.participation.totalScore} pts
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 top-[60px]">
          <Map
            center={mapCenter}
            zoom={16}
            height="100%"
            markerPosition={position ? [position.lat, position.lng] : null}
            destinations={destinations}
            onDestinationReached={() => setIsInRange(true)}
            onDestinationLeft={() => setIsInRange(false)}
          />
        </div>
      </div>

      <div className="z-[1000] max-h-[45vh] overflow-y-auto border-t border-gray-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        {!currentStep ? (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold text-gray-900">Chasse terminée !</h2>
            <p className="text-gray-600">Tu as validé toutes les étapes de cette chasse.</p>
            {lastPointsEarned !== null && (
              <p className="text-sm text-green-700">Dernière étape : +{lastPointsEarned} points</p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleFinishHunt}
                className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-5 py-3 font-semibold text-white hover:from-green-700 hover:to-green-800"
              >
                Terminer la chasse
              </button>
              <Link
                href={`/play/${participationId}`}
                className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-900 hover:bg-gray-50"
              >
                Retour à la pré-partie
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentStep.step.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{currentStep.step.description}</p>
              <p className="mt-2 text-xs text-gray-500">
                Récompense : {currentStep.step.pointsReward} pts · Zone : {currentStep.step.radiusMeters} m
              </p>
            </div>

            {lastPointsEarned !== null && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Étape validée : +{lastPointsEarned} points
              </div>
            )}

            {revealedClues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Indices révélés</p>
                {revealedClues.map((clue) => (
                  <div
                    key={`${currentStep.stepId}-${clue.orderIndex}`}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                  >
                    <p className="text-xs font-medium text-amber-700">
                      Indice {clue.orderIndex + 1} (−{clue.penaltyPoints} pts à la validation)
                    </p>
                    <p className="mt-1">{clue.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {remainingClues > 0 && nextClue && (
                <button
                  type="button"
                  onClick={handleUseClue}
                  disabled={isUsingClue || isCompletingStep}
                  className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUsingClue
                    ? 'Indice en cours...'
                    : `Révéler un indice (−${nextClue.penaltyPoints} pts)`}
                </button>
              )}

              <button
                type="button"
                onClick={handleCompleteStep}
                disabled={!isInRange || isCompletingStep || isUsingClue}
                className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-sm font-semibold text-white hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCompletingStep
                  ? 'Validation...'
                  : isInRange
                    ? "Valider l'étape"
                    : 'Approche-toi du point'}
              </button>
            </div>

            {!isInRange && (
              <p className="text-center text-xs text-gray-500">
                Entre dans la zone bleue sur la carte pour pouvoir valider cette étape.
              </p>
            )}
          </div>
        )}

        {actionError && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}
      </div>
    </div>
  )
}
