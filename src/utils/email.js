import nodemailer from 'nodemailer'
import Settings from '../models/Settings.js'
import User from '../models/User.js'

function getEmailConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    enabled:
      (process.env.EMAIL_ENABLED || '').toLowerCase() === 'true' ||
      (!!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS),
  }
}

async function sendMail({ to, subject, text, html }) {
  const cfg = getEmailConfig()

  if (!cfg.enabled) return { skipped: true, reason: 'EMAIL not enabled' }
  if (!cfg.host || !cfg.port || !cfg.user || !cfg.pass || !cfg.from) {
    return { skipped: true, reason: 'SMTP config missing' }
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465, // common default
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const mail = {
    from: cfg.from,
    to,
    subject,
    text,
    html,
  }

  await transporter.sendMail(mail)
  return { sent: true }
}

const inferEventTypeFromNotificationTitle = (title) => {
  const t = String(title || '').toLowerCase()
  if (t.includes('received')) return 'received'
  if (t.includes('dispatched') || t.includes('dispatch')) return 'dispatched'
  return 'statusChange'
}

export async function sendShipmentNotificationEmail({ notification, shipment }) {
  try {
    if (!notification || !shipment) return

    const settings = await Settings.getSettings()
    if (!settings?.emailNotifications) return

    const eventType = inferEventTypeFromNotificationTitle(notification.title)
    if (eventType === 'received' && !settings.notifyOnShipmentReceived) return
    if (eventType === 'dispatched' && !settings.notifyOnShipmentDispatched) return
    if (eventType === 'statusChange' && !settings.notifyOnStatusChange) return

    const roleTargets = Array.isArray(notification.roleTargets) ? notification.roleTargets : []
    const unreadBy = notification.unreadBy || {}
    const emails = new Set()

    // Resolve client email
    if (roleTargets.includes('client') && unreadBy.client === true && shipment.clientId) {
      const clientUser = await User.findOne({ id: shipment.clientId, role: 'client' })
      if (clientUser?.email) emails.add(clientUser.email)
    }

    // Resolve warehouse email
    if (roleTargets.includes('warehouse') && unreadBy.warehouse === true && shipment.warehouseId) {
      const warehouseUser = await User.findOne({ id: shipment.warehouseId, role: 'warehouse' })
      if (warehouseUser?.email) emails.add(warehouseUser.email)
    }

    // Resolve admins email (send to all active admins)
    if (roleTargets.includes('admin') && unreadBy.admin === true) {
      const admins = await User.find({ role: 'admin', active: true })
      admins.forEach(a => {
        if (a.email) emails.add(a.email)
      })
    }

    if (emails.size === 0) return

    const recipientContext = eventType === 'received' ? 'Shipment Received' : eventType === 'dispatched' ? 'Shipment Dispatched' : 'Shipment Update'
    const subject = `UZA Logistics — ${recipientContext}: ${shipment.id}`

    const lines = []
    lines.push('Hello,')
    lines.push('')
    lines.push(notification.message || `There is an update for shipment #${shipment.id}.`)
    lines.push('')
    lines.push('Shipment details:')
    lines.push(`- Shipment ID: ${shipment.id}`)
    lines.push(`- Status: ${shipment.status}`)
    lines.push(`- Client: ${shipment.clientName || shipment.client?.name || 'Unknown'}`)
    lines.push(`- Warehouse: ${shipment.warehouseName || shipment.warehouse?.name || 'Unknown'}`)
    lines.push(`- Last Updated: ${shipment.updatedAtIso || shipment.createdAtIso || '-'}`)
    lines.push('')
    lines.push('Next steps:')
    lines.push('- Please check the Admin/Warehouse/Client dashboard for full details.')
    lines.push('')
    lines.push('Regards,')
    lines.push('UZA Logistics')
    const text = lines.join('\n')

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.4;">
        <div style="margin-bottom: 12px;">
          <strong>${recipientContext}</strong>
        </div>
        <p style="margin: 0 0 12px 0;">${(notification.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') || `There is an update for shipment #${shipment.id}.`}</p>

        <div style="margin: 14px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;">
          <div style="font-weight: 700; margin-bottom: 8px;">Shipment details</div>
          <div><strong>Shipment ID:</strong> ${shipment.id}</div>
          <div><strong>Status:</strong> ${shipment.status}</div>
          <div><strong>Client:</strong> ${String(shipment.clientName || shipment.client?.name || 'Unknown')}</div>
          <div><strong>Warehouse:</strong> ${String(shipment.warehouseName || shipment.warehouse?.name || 'Unknown')}</div>
          <div><strong>Last Updated:</strong> ${String(shipment.updatedAtIso || shipment.createdAtIso || '-')}</div>
        </div>

        <div style="margin-top: 14px;">
          <div style="font-weight: 700; margin-bottom: 6px;">Next steps</div>
          <ul style="margin: 0; padding-left: 18px;">
            <li>Please check the Admin/Warehouse/Client dashboard for full details.</li>
          </ul>
        </div>

        <div style="margin-top: 18px; color: #334155;">
          Regards,<br />
          <strong>UZA Logistics</strong>
        </div>
      </div>
    `

    // Fire-and-forget for SMTP failures is handled by caller; still return result for debugging.
    await sendMail({ to: Array.from(emails).join(','), subject, text, html })
  } catch (err) {
    console.error('SendShipmentNotificationEmail failed:', err)
  }
}

