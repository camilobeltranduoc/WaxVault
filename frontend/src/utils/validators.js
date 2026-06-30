/**
 * Schemas de validación Zod para formularios de WaxVault.
 * Se usan junto con react-hook-form via @hookform/resolvers/zod.
 *
 * Uso en un formulario:
 *   import { zodResolver } from '@hookform/resolvers/zod'
 *   const form = useForm({ resolver: zodResolver(addVinylSchema) })
 */

import { z } from 'zod'

/** Schema para crear un vinilo nuevo (Módulo B — AddVinylPage) */
export const addVinylSchema = z.object({
  discogs_id: z.number().int().positive().optional(),
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(255, 'El título no puede exceder 255 caracteres'),
  artist: z
    .string()
    .min(1, 'El artista es requerido')
    .max(255, 'El artista no puede exceder 255 caracteres'),
  label: z.string().max(100, 'El sello no puede exceder 100 caracteres').optional(),
  year: z
    .number()
    .int()
    .min(1877, 'El año mínimo es 1877 (año del fonógrafo)')
    .max(new Date().getFullYear(), 'El año no puede ser futuro')
    .optional(),
  genre: z.array(z.string()).default([]),
  style: z.array(z.string()).default([]),
  country: z.string().max(100).optional(),
  format: z
    .string()
    .max(20, 'Formato no puede exceder 20 caracteres')
    .optional(),
})

/** Schema para agregar un vinilo de Discogs a la colección personal */
export const collectionEntrySchema = z.object({
  discogs_id: z.number().int().positive('Se requiere un Discogs ID válido'),
  condition: z.enum(['M', 'NM', 'VG+', 'VG', 'G+', 'G', 'F', 'P'], {
    errorMap: () => ({ message: 'Condición inválida' }),
  }),
  purchase_price: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .nullable(),
})

/** Schema para actualizar el perfil/rol de un usuario (Admin) */
export const userUpdateSchema = z.object({
  display_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  role: z.enum(['admin', 'collector']).optional(),
  is_active: z.boolean().optional(),
})

/** Schema para búsqueda en el catálogo */
export const searchSchema = z.object({
  q: z.string().max(200, 'La búsqueda no puede exceder 200 caracteres').default(''),
  genre: z.string().optional(),
  year: z.number().int().min(1877).max(new Date().getFullYear()).optional(),
})
