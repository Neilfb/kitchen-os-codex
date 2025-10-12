export type ActivityEventType = 'upload_ready' | 'item_promoted' | 'item_discarded'

export type ActivityEvent = {
  id?: string
  type: ActivityEventType
  timestamp: number
  uploadId: number
  restaurantId?: number
  menuId?: number
  itemId?: number
  itemName?: string
  itemCount?: number
  actorEmail?: string
  actorId?: string
  payload?: Record<string, unknown>
}

const MAX_ACTIVITY_EVENTS = 50

export function createActivityEventId(event: ActivityEvent): string {
  return [
    event.type,
    event.uploadId,
    event.itemId ?? 'na',
    event.timestamp,
    event.actorEmail ?? 'system',
  ].join(':')
}

export function appendActivityEvent(
  metadata: Record<string, unknown> | undefined,
  event: ActivityEvent
): Record<string, unknown> {
  const existingActivity = Array.isArray(metadata?.activityLog) ? metadata?.activityLog : []
  const enrichedEvent: ActivityEvent = {
    ...event,
    id: event.id ?? createActivityEventId(event),
  }

  const next = [...existingActivity, enrichedEvent]
    .slice(-MAX_ACTIVITY_EVENTS)
    .filter((entry) => entry && typeof entry === 'object')

  return {
    ...(metadata ?? {}),
    activityLog: next,
    lastActivityAt: enrichedEvent.timestamp,
    lastActivityType: enrichedEvent.type,
  }
}
