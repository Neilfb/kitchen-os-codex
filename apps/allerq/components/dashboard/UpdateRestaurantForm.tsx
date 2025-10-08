'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'

import { useToast } from '@/components/ui/toast'
import { updateRestaurantAction } from '@/app/restaurants/actions'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'

interface RestaurantOption {
  id: number | string
  name: string
  owner_id?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  logo_url?: string | null
}

export function UpdateRestaurantForm({ restaurants }: { restaurants: RestaurantOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const { toast } = useToast()

  const [ariaMessage, setAriaMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('')
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

const selectedRestaurant = useMemo(
  () => restaurants.find((restaurant) => String(restaurant.id) === selectedRestaurantId),
  [restaurants, selectedRestaurantId]
)

const sanitizeField = (value?: string | null) => {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
    return ''
  }
  return trimmed
}

  const ownerDisplay = sanitizeField(selectedRestaurant?.owner_id ?? '')
  const nameValue = sanitizeField(selectedRestaurant?.name ?? '')
  const emailValue = sanitizeField(selectedRestaurant?.email ?? '')
  const phoneValue = sanitizeField(selectedRestaurant?.phone ?? '')
  const addressValue = sanitizeField(selectedRestaurant?.address ?? '')

  useEffect(() => {
    if (selectedRestaurant) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }

      const normalizedPrimaryLogo = sanitizeField(selectedRestaurant.logo_url ?? '')
      const normalizedFallbackLogo = sanitizeField(selectedRestaurant.logo ?? '')
      const existingLogo = normalizedPrimaryLogo || normalizedFallbackLogo

      setLogoUrl(existingLogo)
      setLogoPreviewUrl(existingLogo || null)
      setLogoUploadError(null)
      setIsUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }, [selectedRestaurant])

  const handleSubmit = (formData: FormData) => {
    setAriaMessage('')
    formData.set('logo_url', logoUrl.trim())

    startTransition(async () => {
      const result = await updateRestaurantAction(formData)
      const variant = result.status === 'success' ? 'success' : 'error'
      setAriaMessage(result.message ?? '')

      toast({
        title: result.status === 'success' ? 'Restaurant updated' : 'Unable to update restaurant',
        description: result.message,
        variant,
      })

      if (result.status === 'success') {
        formRef.current?.reset()
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        setLogoPreviewUrl(null)
        setLogoUrl('')
        setSelectedRestaurantId('')
      }
    })
  }

  const handleRestaurantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRestaurantId(event.target.value)
  }

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!selectedRestaurantId) {
      setLogoUploadError('Select a restaurant before uploading a logo')
      event.target.value = ''
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
    const normalizedMime = (file.type || '').toLowerCase()

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

    const previousPreviewUrl = logoPreviewUrl
    const previousObjectUrl = objectUrlRef.current

    const newObjectUrl = URL.createObjectURL(file)
    objectUrlRef.current = newObjectUrl
    setLogoPreviewUrl(newObjectUrl)
    setLogoUploadError(null)
    setIsUploadingLogo(true)

    const payload = new FormData()
    payload.append('file', file)

    try {
      const response = await fetch('/api/uploads/logo', {
        method: 'POST',
        body: payload,
      })

      const result = await response.json()

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message ?? 'Logo upload failed')
      }

      const uploadedUrl = result.data?.logoUrl ?? ''
      setLogoUrl(uploadedUrl)
      setLogoPreviewUrl(uploadedUrl || null)
      setLogoUploadError(null)
      toast({
        title: 'Logo uploaded',
        description: 'The logo is ready to save with this restaurant.',
        variant: 'success',
      })

      URL.revokeObjectURL(newObjectUrl)
      objectUrlRef.current = null

      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl)
      }

      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    } catch (error) {
      URL.revokeObjectURL(newObjectUrl)
      objectUrlRef.current = previousObjectUrl ?? null
      setLogoPreviewUrl(previousPreviewUrl ?? null)
      setLogoUploadError(error instanceof Error ? error.message : 'Logo upload failed')
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred while uploading the logo.',
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
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setLogoPreviewUrl(null)
    setLogoUrl('')
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
      <h3 className="text-lg font-semibold text-slate-900">Update restaurant</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="restaurant-id" className="text-sm font-medium text-slate-700">
            Restaurant
          </label>
          <select
            id="restaurant-id"
            name="id"
            required
            value={selectedRestaurantId}
            onChange={handleRestaurantChange}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <option value="" disabled>
              Select restaurant
            </option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="restaurant-name" className="text-sm font-medium text-slate-700">
            Restaurant name
          </label>
          <Input
            key={`name-${selectedRestaurant?.id ?? 'none'}`}
            id="restaurant-name"
            name="name"
            defaultValue={nameValue}
            placeholder="Restaurant name"
            aria-label="Restaurant name"
          />
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-sm font-medium text-slate-700">AllerQ Account ID</span>
          <span className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {ownerDisplay || '—'}
          </span>
        </div>
        <div className="flex flex-col">
          <label htmlFor="restaurant-email" className="text-sm font-medium text-slate-700">
            Contact email (optional)
          </label>
          <Input
            key={`email-${selectedRestaurant?.id ?? 'none'}`}
            id="restaurant-email"
            name="email"
            type="email"
            defaultValue={emailValue}
            placeholder="team@example.com"
            aria-label="Contact email"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="restaurant-phone" className="text-sm font-medium text-slate-700">
            Contact phone (optional)
          </label>
          <Input
            key={`phone-${selectedRestaurant?.id ?? 'none'}`}
            id="restaurant-phone"
            name="phone"
            defaultValue={phoneValue}
            placeholder="(555) 123-4567"
            aria-label="Contact phone"
          />
        </div>
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="restaurant-address" className="text-sm font-medium text-slate-700">
            Street address
          </label>
          <Input
            key={`address-${selectedRestaurant?.id ?? 'none'}`}
            id="restaurant-address"
            name="address"
            defaultValue={addressValue}
            placeholder="Street, city, postal code"
            aria-label="Street address"
          />
          <p className="mt-1 text-xs text-slate-500">
            Billing requires an up-to-date address. Update it here if the venue has moved.
          </p>
        </div>
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
                  disabled={isUploadingLogo || !selectedRestaurantId}
                >
                  {isUploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
                {logoUrl || logoPreviewUrl ? (
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
                aria-label="Upload logo"
              />
              <input type="hidden" name="logo_url" value={logoUrl} />
            </div>
          </div>
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="bg-orange-600 text-white">
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
      <p aria-live="polite" className="sr-only">
        {ariaMessage}
      </p>
    </form>
  )
}
