import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@services/api'
import { useCollection } from '@hooks/useCollection'

const CONDITIONS = ['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P']

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function ManualForm({ onSuccess }) {
  const { addEntry } = useCollection()
  const [form, setForm] = useState({
    title: '', artist: '', year: '', label: '',
    condition: 'VG', purchase_price: '', notes: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Solo se aceptan imágenes JPEG, PNG o WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.')
      return
    }
    setError('')
    setCoverFile(file)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(file))
  }

  const removeCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverFile(null)
    setCoverPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim() || !form.artist.trim()) {
      setError('Título y artista son obligatorios.')
      return
    }
    let entryId = null
    try {
      const res = await addEntry.mutateAsync({
        title: form.title.trim(),
        artist: form.artist.trim(),
        year: form.year ? parseInt(form.year, 10) : null,
        label: form.label.trim() || null,
        condition: form.condition,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        notes: form.notes.trim() || null,
      })
      entryId = res.data?.id
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
      return
    }

    // La entrada ya existe — la portada es un paso extra que no debe bloquear
    if (coverFile && entryId) {
      setUploadingCover(true)
      try {
        const formData = new FormData()
        formData.append('file', coverFile)
        await api.post(`/collection/${entryId}/cover`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch {
        console.warn('La portada no se pudo subir, pero el vinilo se guardó.')
      } finally {
        setUploadingCover(false)
      }
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Portada */}
      <div>
        <label className="block text-sm font-medium text-vinyl-black mb-1">Portada</label>
        {coverPreview ? (
          <div className="flex items-center gap-4">
            <img
              src={coverPreview}
              alt="Vista previa de portada"
              className="w-24 h-24 object-cover rounded-xl shadow-sm"
            />
            <div className="text-sm">
              <p className="text-gray-600 truncate max-w-[200px]">{coverFile?.name}</p>
              <button
                type="button"
                onClick={removeCover}
                className="text-xs text-red-500 hover:underline mt-1"
              >
                Quitar imagen
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-vinyl-groove/40 rounded-xl py-6 cursor-pointer hover:border-vinyl-label hover:bg-vinyl-cream/50 transition-colors">
            <span className="text-2xl">📷</span>
            <span className="text-sm text-gray-500">Subir foto de la portada</span>
            <span className="label-mono text-gray-400">JPEG, PNG o WebP · máx 5 MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Ej: Kind of Blue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">
            Artista <span className="text-red-500">*</span>
          </label>
          <input
            type="text" value={form.artist} onChange={(e) => set('artist', e.target.value)}
            placeholder="Ej: Miles Davis"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">Año</label>
          <input
            type="number" min="1877" max="2099" value={form.year}
            onChange={(e) => set('year', e.target.value)}
            placeholder="Ej: 1959"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">Sello discográfico</label>
          <input
            type="text" value={form.label} onChange={(e) => set('label', e.target.value)}
            placeholder="Ej: Columbia Records"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">Condición</label>
          <select
            value={form.condition} onChange={(e) => set('condition', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          >
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-vinyl-black mb-1">Precio de compra (USD)</label>
          <input
            type="number" step="0.01" min="0" value={form.purchase_price}
            onChange={(e) => set('purchase_price', e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-vinyl-black mb-1">Notas</label>
        <textarea
          value={form.notes} onChange={(e) => set('notes', e.target.value)}
          rows={2} placeholder="Ej: Edición especial, vinilo azul..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vinyl-label resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-red-600 text-xs">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={addEntry.isPending || uploadingCover}
        className="btn-primary w-full"
      >
        {uploadingCover
          ? 'Subiendo portada...'
          : addEntry.isPending
            ? 'Guardando...'
            : '+ Agregar a Mi Colección'}
      </button>
    </form>
  )
}

export default function AddVinylPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const timerRef = useRef(null)

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedTerm(e.target.value), 400)
  }

  const { data, isFetching } = useQuery({
    queryKey: ['add-vinyl-search', debouncedTerm],
    queryFn: async () => {
      const res = await api.get('/catalog', { params: { q: debouncedTerm, per_page: 12 } })
      return res.data
    },
    enabled: debouncedTerm.length >= 2 && mode === 'search',
  })

  const results = data?.items || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="label-mono text-gray-400 mb-1">Módulo B</p>
          <h1 className="font-display text-4xl text-vinyl-black tracking-wide">AGREGAR VINILO</h1>
        </div>
      </div>

      {/* Toggle modo */}
      <div className="flex gap-2 mb-6 mt-4">
        <button
          type="button"
          onClick={() => setMode('search')}
          className={`label-mono px-4 py-2 rounded-full border transition-colors ${
            mode === 'search'
              ? 'bg-vinyl-black text-vinyl-cream border-vinyl-black'
              : 'bg-transparent text-vinyl-black border-vinyl-groove/40 hover:border-vinyl-black'
          }`}
        >
          Buscar en Discogs
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`label-mono px-4 py-2 rounded-full border transition-colors ${
            mode === 'manual'
              ? 'bg-vinyl-black text-vinyl-cream border-vinyl-black'
              : 'bg-transparent text-vinyl-black border-vinyl-groove/40 hover:border-vinyl-black'
          }`}
        >
          Ingresar manualmente
        </button>
      </div>

      {/* Modo búsqueda Discogs */}
      {mode === 'search' && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Busca el álbum en Discogs. Luego elige el prensado exacto que tienes.
          </p>

          <input
            type="text"
            value={searchTerm}
            onChange={handleChange}
            placeholder="Buscar artista, álbum..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-vinyl-label mb-4"
            autoFocus
          />

          {isFetching && (
            <p className="label-mono text-gray-400 mb-4">Buscando en Discogs...</p>
          )}

          {debouncedTerm.length >= 2 && !isFetching && results.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-400 mb-3">Sin resultados para &quot;{debouncedTerm}&quot; en Discogs.</p>
              <button
                onClick={() => setMode('manual')}
                className="btn-secondary text-sm"
              >
                Ingresar manualmente
              </button>
            </div>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {results.map((vinyl) => (
                <li key={vinyl.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/catalog/${vinyl.id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-vinyl-cream transition-colors flex items-center gap-4"
                  >
                    {vinyl.cover_image_url ? (
                      <img
                        src={vinyl.cover_image_url}
                        alt=""
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-vinyl-groove rounded-lg flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-vinyl-black truncate">{vinyl.title}</p>
                      <p className="label-mono text-gray-500 truncate">{vinyl.artist}</p>
                      {vinyl.year && <p className="label-mono text-gray-400">{vinyl.year}</p>}
                    </div>
                    <span className="label-mono text-vinyl-label flex-shrink-0">
                      Ver prensados →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searchTerm.length < 2 && (
            <div className="card text-center py-12 mt-4">
              <p className="text-4xl mb-3">🎵</p>
              <p className="text-gray-500 text-sm">
                Escribe para buscar en Discogs o usa el modo manual si tu vinilo no aparece.
              </p>
            </div>
          )}
        </>
      )}

      {/* Modo manual */}
      {mode === 'manual' && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            Ingresa los datos de tu vinilo manualmente. Se agrega a tu colección al instante
            y queda <span className="font-medium text-vinyl-black">pendiente de revisión de un administrador</span> para
            entrar al catálogo de WaxVault.
          </p>
          <ManualForm onSuccess={() => navigate('/collection')} />
        </>
      )}
    </div>
  )
}
