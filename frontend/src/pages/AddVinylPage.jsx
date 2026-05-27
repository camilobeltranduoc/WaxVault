/**
 * Formulario para crear un nuevo vinilo — Módulo B.
 * El vinilo se crea en estado PENDING y queda en espera de aprobación admin.
 * TODO: Implementar integración con Discogs search y subida de portada.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { addVinylSchema } from '@utils/validators'

export default function AddVinylPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(addVinylSchema) })

  const onSubmit = async (data) => {
    // TODO: Llamar a api.post('/collection/add-vinyl', data)
    console.log('Form data:', data)
    navigate('/collection')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-vinyl-black mb-2">➕ Agregar Vinilo</h1>
      <p className="text-sm text-gray-500 mb-8">
        Los vinilos creados manualmente quedan en estado <strong>Pendiente de Aprobación</strong> hasta ser revisados por el administrador.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        {[
          { name: 'title', label: 'Título *', placeholder: 'The Dark Side of the Moon' },
          { name: 'artist', label: 'Artista *', placeholder: 'Pink Floyd' },
          { name: 'label', label: 'Sello Discográfico', placeholder: 'Harvest Records' },
          { name: 'country', label: 'País de Prensado', placeholder: 'UK' },
          { name: 'format', label: 'Formato', placeholder: 'LP, 7", 12", EP...' },
        ].map(({ name, label, placeholder }) => (
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

        {/* TODO: Agregar buscador de Discogs y subida de portada */}

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
