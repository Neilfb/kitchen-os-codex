'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { createRestaurant } from '@/lib/ncb/createRestaurant'
import { updateRestaurant } from '@/lib/ncb/updateRestaurant'
import { deleteRestaurant } from '@/lib/ncb/deleteRestaurant'
import { requireAnyCapability } from '@/lib/auth/guards'
import { getUserByEmail } from '@/lib/ncb/getUserByEmail'
import { createUserRestaurantAssignment } from '@/lib/ncb/userRestaurantAssignments'

const getFormString = (formData: FormData, key: string) => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : undefined
}

const CreateRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  owner_id: z
    .string({ required_error: 'Owner ID is required' })
    .optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z
    .string({ required_error: 'Address is required' })
    .min(1, 'Address is required'),
  website: z.string().optional(),
  cuisine_type: z.string().optional(),
  logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
})

const UpdateRestaurantSchema = z.object({
  id: z.coerce.number().int().positive('Restaurant is required'),
  name: z.string().optional(),
  owner_id: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  logo_url: z.string().url('Invalid logo URL').optional().or(z.literal('')),
})

export async function createRestaurantAction(formData: FormData) {
  const session = await getServerSession(authOptions)
  const actor = requireAnyCapability(session, ['restaurant.create', 'restaurant.manage:any'])

  const raw = {
    name: getFormString(formData, 'name'),
    owner_id: getFormString(formData, 'owner_id'),
    email: getFormString(formData, 'email'),
    phone: getFormString(formData, 'phone'),
    address: getFormString(formData, 'address'),
    website: getFormString(formData, 'website'),
    cuisine_type: getFormString(formData, 'cuisine_type'),
    logo_url: getFormString(formData, 'logo_url'),
  }

  const parsed = CreateRestaurantSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      status: 'error' as const,
      message: parsed.error.issues[0]?.message ?? 'Invalid data',
    }
  }

  try {
    let ownerUserId = Number.isFinite(actor.ncdbUserId) && actor.ncdbUserId > 0 ? actor.ncdbUserId : undefined

    if (actor.role === 'superadmin') {
      const providedOwner = parsed.data.owner_id?.trim() ?? ''
      if (!providedOwner) {
        throw new Error('Owner email or user ID is required for new restaurants')
      }

      let ownerRecord: Awaited<ReturnType<typeof getUserByEmail>> = null

      if (/^\d+$/.test(providedOwner)) {
        ownerUserId = Number(providedOwner)
      } else {
        ownerRecord = await getUserByEmail({ email: providedOwner })
      }

      if (!ownerRecord && ownerUserId === undefined) {
        throw new Error('Owner account not found. Please invite the user before creating the restaurant.')
      }

      if (ownerRecord) {
        if (ownerRecord.id === undefined || ownerRecord.id === null) {
          throw new Error('Owner account is missing an id. Contact support.')
        }
        ownerUserId = Number(ownerRecord.id)
      }

      parsed.data.owner_id = ownerUserId?.toString() ?? ''
    }

    if (typeof ownerUserId !== 'number' || ownerUserId <= 0) {
      throw new Error('Unable to determine owner for restaurant creation')
    }

    const restaurant = await createRestaurant({
      name: parsed.data.name,
      owner_id: ownerUserId.toString(),
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
      website: parsed.data.website || undefined,
      cuisine_type: parsed.data.cuisine_type || undefined,
      logo_url: parsed.data.logo_url?.trim() || undefined,
    })

    const restaurantId = Number(restaurant.id)

    if (Number.isFinite(restaurantId)) {
      try {
        await createUserRestaurantAssignment({
          userId: Number(ownerUserId),
          restaurantId,
          role: 'owner',
        })
      } catch (assignmentError) {
        console.warn('[createRestaurantAction] assignment creation failed', assignmentError)
      }
    }

    revalidatePath('/restaurants')
    revalidatePath('/dashboard')

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
    name: getFormString(formData, 'name'),
    owner_id: getFormString(formData, 'owner_id'),
    email: getFormString(formData, 'email'),
    phone: getFormString(formData, 'phone'),
    address: getFormString(formData, 'address'),
    website: getFormString(formData, 'website'),
    logo_url: getFormString(formData, 'logo_url'),
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
      logo_url:
        parsed.data.logo_url === undefined
          ? undefined
          : typeof parsed.data.logo_url === 'string'
            ? parsed.data.logo_url.trim()
            : undefined,
    })

    revalidatePath('/restaurants')
    revalidatePath('/dashboard')

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
    revalidatePath('/dashboard')
    return { status: 'success' as const, message: 'Restaurant deleted successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete restaurant'
    return { status: 'error' as const, message }
  }
}
