'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { createRestaurant } from '@/lib/ncb/createRestaurant'
import { updateRestaurant } from '@/lib/ncb/updateRestaurant'
import { deleteRestaurant } from '@/lib/ncb/deleteRestaurant'
import { requireAnyCapability } from '@/lib/auth/guards'

const CreateRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  owner_id: z.string().min(1, 'Owner ID is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  cuisine_type: z.string().optional(),
})

const UpdateRestaurantSchema = z.object({
  id: z.coerce.number().int().positive('Restaurant is required'),
  name: z.string().optional(),
  owner_id: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
})

export async function createRestaurantAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  requireAnyCapability(session, ['restaurant.create', 'restaurant.manage:any'])

  const raw = {
    name: formData.get('name'),
    owner_id: formData.get('owner_id'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    website: formData.get('website'),
    cuisine_type: formData.get('cuisine_type'),
  }

  const parsed = CreateRestaurantSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: parsed.error.issues[0]?.message ?? 'Invalid data',
    }
  }

  try {
    await createRestaurant({
      name: parsed.data.name,
      owner_id: parsed.data.owner_id,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      website: parsed.data.website || undefined,
      cuisine_type: parsed.data.cuisine_type || undefined,
    })

    revalidatePath('/restaurants')

    return {
      status: 'success' as const,
      message: 'Restaurant created successfully',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create restaurant'
    return {
      status: 'error' as const,
      message,
    }
  }
}

export async function updateRestaurantAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  requireAnyCapability(session, ['restaurant.manage:any', 'restaurant.manage:own'])

  const raw = {
    id: formData.get('id'),
    name: formData.get('name'),
    owner_id: formData.get('owner_id'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    website: formData.get('website'),
  }

  const parsed = UpdateRestaurantSchema.safeParse(raw)
  if (!parsed.success) {
    return { status: 'error' as const, message: parsed.error.issues[0]?.message ?? 'Invalid data' }
  }

  try {
    await updateRestaurant({
      id: parsed.data.id,
      name: parsed.data.name || undefined,
      owner_id: parsed.data.owner_id?.trim() || undefined,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      website: parsed.data.website || undefined,
    })

    revalidatePath('/restaurants')

    return { status: 'success' as const, message: 'Restaurant updated successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update restaurant'
    return { status: 'error' as const, message }
  }
}

export async function deleteRestaurantAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  requireAnyCapability(session, ['restaurant.manage:any', 'restaurant.manage:own'])

  const idRaw = formData.get('id')
  const id = Number(idRaw)

  if (!Number.isFinite(id) || id <= 0) {
    return { status: 'error' as const, message: 'Restaurant must be selected' }
  }

  try {
    await deleteRestaurant({ id })
    revalidatePath('/restaurants')
    return { status: 'success' as const, message: 'Restaurant deleted successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete restaurant'
    return { status: 'error' as const, message }
  }
}
