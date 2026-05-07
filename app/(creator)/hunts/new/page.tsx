'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { apiClient, ApiClientError, CreateHuntInput } from '@/lib/frontend/api-client'
import { createHuntSchema } from '@/schemas/hunt'
import { Difficulty, HuntVisibility } from '@prisma/client'

export default function CreateHuntPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateHuntInput>({
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const dataToValidate = {
      ...formData,
      accessCode: formData.visibility === HuntVisibility.PRIVATE ? accessCode : undefined,
    }

    const validation = createHuntSchema.safeParse(dataToValidate)
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    try {
      setIsSubmitting(true)
      await apiClient.createHunt(validation.data)
      router.push('/creator/hunts')
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erreur lors de la création'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/hunts" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
          ← Retour
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Créer une nouvelle chasse</h1>
          <p className="mt-3 text-lg text-gray-600">Définissez les détails de base de votre chasse au trésor</p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Titre <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                placeholder="Ex: Le trésor de Marseille"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                rows={3}
                placeholder="Décrivez votre chasse..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Localisation <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                placeholder="Ex: Marseille, France"
                required
              />
            </div>

            {/* Coordinates */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Coordonnées de départ</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    value={formData.startLat}
                    onChange={(e) => setFormData({ ...formData, startLat: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    value={formData.startLng}
                    onChange={(e) => setFormData({ ...formData, startLng: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Difficulté <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                required
              >
                <option value={Difficulty.EASY}>Facile</option>
                <option value={Difficulty.MEDIUM}>Moyen</option>
                <option value={Difficulty.HARD}>Difficile</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Visibilité <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none"
                required
              >
                <option value={HuntVisibility.PUBLIC}>Public - Tout le monde peut rejoindre</option>
                <option value={HuntVisibility.PRIVATE}>Privé - Besoin d'un code d'accès</option>
              </select>
            </div>

            {/* Access Code - only for PRIVATE */}
            {formData.visibility === HuntVisibility.PRIVATE && (
              <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Code d'accès (8 chiffres) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full rounded-lg border-2 border-blue-300 px-4 py-3 text-center font-mono text-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="12345678"
                  maxLength={8}
                  required
                />
                <p className="mt-2 text-xs text-blue-700">Les joueurs auront besoin de ce code pour rejoindre ta chasse</p>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex flex-col gap-3 sm:flex-row pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Création en cours...' : 'Créer la chasse'}
              </button>
              <Link
                href="/creator/hunts"
                className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 text-center font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
              >
                Annuler
              </Link>
            </div>
          </form>

          <p className="mt-8 text-xs text-gray-600 text-center">
            <span className="text-red-600">*</span> Champs obligatoires. Vous pourrez ajouter les étapes après création.
          </p>
        </div>
      </div>
    </main>
  )
}
