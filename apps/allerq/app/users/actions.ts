'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextAuth'
import { createUser } from '@/lib/ncb/createUser'
import { updateUser } from '@/lib/ncb/updateUser'
import { deleteUser } from '@/lib/ncb/deleteUser'

const CreateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['superadmin', 'admin', 'manager', 'staff', 'auditor']).default('manager'),
})

const UpdateUserSchema = z.object({
  id: z.coerce.number().int().positive('User is required'),
  fullName: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['superadmin', 'admin', 'manager', 'staff', 'auditor']).optional(),
})

export async function createUserAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return { status: 'error' as const, message: 'Unauthorized' }
  }

  const raw = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  }

  const parsed = CreateUserSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid data'
    return { status: 'error' as const, message }
  }

  try {
    await createUser({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
    })

    revalidatePath('/users')
    return { status: 'success' as const, message: 'User created successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return { status: 'error' as const, message }
  }
}

export async function updateUserAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return { status: 'error' as const, message: 'Unauthorized' }
  }

  const raw = {
    id: formData.get('id'),
    fullName: formData.get('fullName'),
    password: formData.get('password'),
    role: formData.get('role'),
  }

  const parsed = UpdateUserSchema.safeParse(raw)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid data'
    return { status: 'error' as const, message }
  }

  try {
    await updateUser({
      id: parsed.data.id,
      fullName: parsed.data.fullName,
      password: parsed.data.password,
      role: parsed.data.role,
    })

    revalidatePath('/users')
    return { status: 'success' as const, message: 'User updated successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    return { status: 'error' as const, message }
  }
}

export async function deleteUserAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
    return { status: 'error' as const, message: 'Unauthorized' }
  }

  const idRaw = formData.get('id')
  const id = Number(idRaw)

  if (!Number.isFinite(id) || id <= 0) {
    return { status: 'error' as const, message: 'User must be selected' }
  }

  try {
    await deleteUser({ id })
    revalidatePath('/users')
    return { status: 'success' as const, message: 'User deleted successfully' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    return { status: 'error' as const, message }
  }
}
