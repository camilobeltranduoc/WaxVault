/**
 * Formulario para crear un nuevo vinilo — Módulo B.
 * El vinilo se crea en estado PENDING y queda en espera de aprobación admin.
 * Incluye búsqueda en el catálogo para pre-llenar el formulario.
 */

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addVinylSchema } from '@utils/validators'
import api from '@services/api'

function CatalogSearchPanel({ onSelect }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const timerRef = useRef(null)

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedTerm(e.target.value), 500)
  }

  const { data, isFetching } = useQuery({
    queryKey: ['catalog-search', debouncedTerm],
    queryFn: async () => {
      const res = await api.get('/catalog', { params: { q: debouncedTerm, per_page: 8 } })
      return res.data
    },
    enabled: debouncedTerm.length >= 2,
  })

  const results = data?.items || []

  return (
    <div className="card mb-6 border-vinyl-label border">
      <h2 className="text-sm font-semibold text-vinyl-label mb-3 uppercase tracking-wide">
        Buscar en el catálogo para pre-llenar
      </h2>
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Buscar por título o artista..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm mb-3"
      />
      {isFetching && <p className="text-xs text-gray-400">Buscando...</p>}
      {results.length > 0 && (
        <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
          {results.map((vinyl) => (
            <li key={vinyl.id}>
              <button
                type="button"
                onClick={() => onSelect(vinyl)}
                className="w-full text-left px-2 py-2 hover:bg-vinyl-label/10 rounded text-sm flex items-center gap-3"
              >
                {vinyl.cover_image_url && (
                  <img src={vinyl.cover_image_url} alt="" className="w-10 h-10 object-cover rounded" />
                )}
                <span>
                  <span className="font-medium">{vinyl.title}</span>
                  <span className="text-gray-500"> — {vinyl.artist}</span>
                  {vinyl.year && <span className="text-gray-400 ml-1">({vinyl.year})</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {debouncedTerm.length >= 2 && !isFetching && results.length === 0 && (
        <p className="text-xs text-gray-400">Sin resultados. Completa el formulario manualmente.</p>
      )}
    </div>
  )
}

export default function AddVinylPage() {
  const navigate = useNavigate()
  const [coverFile, setCoverFile] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(addVinylSchema) })

  const handleCatalogSelect = (vinyl) => {
    setValue('title', vinyl.title || '')
    setValue('artist', vinyl.artist || '')
    setValue('label', vinyl.label || '')
    setValue('year', vinyl.year || undefined)
    setValue('country', vinyl.country || '')
    setValue('format', vinyl.format || '')
  }

  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
      )
      if (cleanData.year) cleanData.year = Number(cleanData.year)

      const response = await api.post('/collection/add-vinyl', cleanData)
      const newVinylId = response.data?.id

      if (coverFile && newVinylId) {
        const formData = new FormData()
        formData.append('file', coverFile)
        await api.post(`/collection/${newVinylId}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/collection')
    } catch (err) {
      const detail = err?.response?.data?.detail
      setSubmitError(detail || 'Error al enviar el vinilo. Intenta de nuevo.')
    }
  }

  const fields = [
    { name: 'title', label: 'Título *', placeholder: 'The Dark Side of the Moon' },
    { name: 'artist', label: 'Artista *', placeholder: 'Pink Floyd' },
    { name: 'label', label: 'Sello Discográfico', placeholder: 'Harvest Records' },
    { name: 'country', label: 'País de Prensado', placeholder: 'UK' },
    { name: 'format', label: 'Formato', placeholder: 'LP, 7", 12", EP...' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-vinyl-black mb-2">Agregar Vinilo</h1>
      <p className="text-sm text-gray-500 mb-6">
        Los vinilos creados manualmente quedan en estado{' '}
        <strong>Pendiente de Aprobación</strong> hasta ser revisados por el administrador.
      </p>

      <CatalogSearchPanel onSelect={handleCatalogSelect} />

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        {fields.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-vinyl-black mb-1">{label}</label>
            <input
              {...register(name)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
            />
            {errors[name] && (
              <p className="text-red-500 text-xs mt-1">{errors[name]?.message}</p>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">Año</label>
          <input
            {...register('year', { valueAsNumber: true })}
            type="number"
            placeholder="1973"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinyl-label text-sm"
          />
          {errors.year && (
            <p className="text-red-500 text-xs mt-1">{errors.year?.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">
            Portada (imagen JPG/PNG — opcional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-vinyl-label file:text-white hover:file:opacity-80"
          />
          {coverFile && (
            <p className="text-xs text-gray-400 mt-1">Seleccionado: {coverFile.name}</p>
          )}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? 'Enviando...' : 'Enviar para Aprobación'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/collection')}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
