'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'

import { useToast } from '@/components/ui/toast'
import { createRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

export function CreateRestaurantForm() {
  const { data } = useSession()
  const actor = data?.user
  const actorRole = actor?.role ?? 'manager'
  const ownerId = useMemo(() => {
    if (!actor) {
      return ''
    }

    if (typeof actor.ncdbUserId === 'number' && Number.isFinite(actor.ncdbUserId)) {
      return String(actor.ncdbUserId)
    }

    const identifier = (actor as { id?: string | number }).id
    if (typeof identifier === 'string' && identifier.trim()) {
      return identifier.trim()
    }
    if (typeof identifier === 'number' && Number.isFinite(identifier)) {
      return String(identifier)
    }

    return actor.email ?? ''
  }, [actor])

  const { toast } = useToast()
  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPublicId, setLogoPublicId] = useState('')
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')
    startTransition(async () => {
      if (logoUrl) {
        formData.set('logo_url', logoUrl)
      }

      const result = await createRestaurantAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'Restaurant created' : 'Unable to create restaurant',
        description: result.message,
        variant,
      })

      if (result.status === 'success') {
        formRef.current?.reset()
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl)
        }
        setLogoPreviewUrl(null)
        setLogoUrl('')
        setLogoPublicId('')
        setLogoUploadError(null)
        if (logoInputRef.current) {
          logoInputRef.current.value = ''
        }
      }
    })
  }

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 1_000_000) {
      setLogoUploadError('Logo must be smaller than 1MB')
      toast({
        title: 'Logo too large',
        description: 'Please choose a PNG, JPG, or WebP logo up to 1MB.',
        variant: 'error',
      })
      event.target.value = ''
      return
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const inferredMime = file.type || ''
    const normalizedMime = inferredMime.toLowerCase()

    if (normalizedMime && !allowedMimeTypes.includes(normalizedMime)) {
      setLogoUploadError('Unsupported logo format')
      toast({
        title: 'Unsupported format',
        description: 'Logos must be PNG, JPG, or WebP images.',
        variant: 'error',
      })
      event.target.value = ''
      return
    }

    setLogoUploadError(null)
    setIsUploadingLogo(true)

    let previewUrl: string | null = null

    try {
      previewUrl = URL.createObjectURL(file)
      setLogoPreviewUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }
        return previewUrl
      })

      const payload = new FormData()
      payload.append('file', file)

      const response = await fetch('/api/uploads/logo', {
        method: 'POST',
        body: payload,
      })

      const result = await response.json()

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message ?? 'Logo upload failed')
      }

      setLogoUrl(result.data?.logoUrl ?? '')
      setLogoPublicId(result.data?.publicId ?? '')

      toast({
        title: 'Logo uploaded',
        description: 'The logo is ready to save with this restaurant.',
        variant: 'success',
      })
    } catch (error) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setLogoPreviewUrl(null)
      setLogoUrl('')
      setLogoPublicId('')
      setLogoUploadError(error instanceof Error ? error.message : 'Logo upload failed')
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while uploading the logo.',
        variant: 'error',
      })
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl)
    }
    setLogoPreviewUrl(null)
    setLogoUrl('')
    setLogoPublicId('')
    setLogoUploadError(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">Add a restaurant</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="name" placeholder="Restaurant name" required aria-label="Restaurant name" />
        {actorRole === 'superadmin' ? (
          <Input name="owner_id" placeholder="Owner ID" required aria-label="Owner ID" />
        ) : (
          <div className="md:col-span-1">
            <input type="hidden" name="owner_id" value={ownerId} />
            <p className="text-sm text-slate-600">
              Owner ID will be set to <span className="font-medium">{ownerId || 'your account'}</span>
            </p>
          </div>
        )}
        <Input name="email" type="email" placeholder="Email (optional)" aria-label="Email" />
        <Input name="phone" placeholder="Phone (optional)" aria-label="Phone" />
        <Input name="address" placeholder="Address (optional)" aria-label="Address" className="md:col-span-2" />
        <Input name="website" placeholder="Website (optional)" aria-label="Website" />
        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700">Logo</p>
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
              {logoPreviewUrl ? (
                <img src={logoPreviewUrl} alt="Selected logo preview" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
                {logoUrl ? (
                  <Button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="bg-transparent px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                    disabled={isUploadingLogo}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, or WebP up to 1MB.</p>
              {logoUploadError ? <p className="text-sm text-red-600">{logoUploadError}</p> : null}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoSelect}
              />
              <input type="hidden" name="logo_url" value={logoUrl} />
              {logoPublicId ? <input type="hidden" name="logo_public_id" value={logoPublicId} /> : null}
            </div>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Creating…' : 'Create restaurant'}
      </Button>
      <p aria-live="polite" className="sr-only">
        {ariaMessage}
      </p>
    </form>
  )
}
