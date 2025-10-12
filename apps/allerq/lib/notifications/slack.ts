const DEFAULT_WEBHOOK = process.env.ALLERQ_SLACK_WEBHOOK?.trim()

export type SlackSeverity = 'info' | 'warning' | 'error'

export async function sendSlackMessage(message: string, options: {
  webhookUrl?: string
  severity?: SlackSeverity
  metadata?: Record<string, unknown>
} = {}): Promise<void> {
  const webhook = options.webhookUrl?.trim() || DEFAULT_WEBHOOK
  if (!webhook) {
    return
  }

  const payload: Record<string, unknown> = {
    text: message,
  }

  if (options.metadata) {
    payload.blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: Object.entries(options.metadata).map(([key, value]) => ({
          type: 'mrkdwn',
          text: `*${key}:* ${String(value)}`,
        })),
      },
    ]
  }

  if (options.severity === 'error') {
    payload.attachments = [
      {
        color: '#ef4444',
        text: '⚠️ Worker failure',
      },
    ]
  } else if (options.severity === 'warning') {
    payload.attachments = [
      {
        color: '#f59e0b',
        text: '⚠️ Worker warning',
      },
    ]
  }

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.warn('[slack] Failed to post message', error)
  }
}
