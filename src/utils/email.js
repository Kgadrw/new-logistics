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

    const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL || 'https://new-logistics.onrender.com'
    const shipmentUrl = `${DASHBOARD_BASE_URL}/admin/shipments/${shipment.id}`

    const escapeHtml = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    const safeMessage = escapeHtml(notification.message || `There is an update for shipment #${shipment.id}.`)
    const safeClientName = escapeHtml(String(shipment.clientName || shipment.client?.name || 'Unknown'))
    const safeWarehouseName = escapeHtml(String(shipment.warehouseName || shipment.warehouse?.name || 'Unknown'))
    const safeUpdatedAt = escapeHtml(String(shipment.updatedAtIso || shipment.createdAtIso || '-'))

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
    lines.push(`Open shipment: ${shipmentUrl}`)
    lines.push('')
    lines.push('Next steps:')
    lines.push('- Please check the Admin/Warehouse/Client dashboard for full details.')
    lines.push('')
    lines.push('Regards,')
    lines.push('UZA Logistics')
    const text = lines.join('\n')

    const html = `
      <div style="font-family: Arial, sans-serif; background: #f1f5f9; padding: 24px; color: #0f172a; line-height: 1.5;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden;">
          <div style="padding: 18px 22px; background: linear-gradient(90deg, #1d4ed8, #2563eb); color: #ffffff;">
            <div style="font-weight: 800; letter-spacing: 0.2px;">UZA Logistics</div>
            <div style="margin-top: 6px; font-size: 14px; opacity: 0.95; font-weight: 700;">${recipientContext}</div>
          </div>

          <div style="padding: 18px 22px;">
            <p style="margin: 0 0 14px 0; color: #111827; font-size: 14.5px;">
              ${safeMessage}
            </p>

            <div style="margin: 16px 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc;">
              <div style="font-weight: 800; margin-bottom: 10px; font-size: 14px;">Shipment summary</div>

              <div style="display: table; width: 100%; border-collapse: collapse;">
                <div style="display: table-row;">
                  <div style="display: table-cell; width: 40%; padding: 6px 0; color: #334155; font-weight: 700; font-size: 13px;">Shipment ID</div>
                  <div style="display: table-cell; padding: 6px 0; font-weight: 800; font-size: 13px; text-align: right;">${escapeHtml(shipment.id)}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 6px 0; color: #334155; font-weight: 700; font-size: 13px;">Status</div>
                  <div style="display: table-cell; padding: 6px 0; font-weight: 800; font-size: 13px; text-align: right;">${escapeHtml(shipment.status)}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 6px 0; color: #334155; font-weight: 700; font-size: 13px;">Client</div>
                  <div style="display: table-cell; padding: 6px 0; font-weight: 800; font-size: 13px; text-align: right;">${safeClientName}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 6px 0; color: #334155; font-weight: 700; font-size: 13px;">Warehouse</div>
                  <div style="display: table-cell; padding: 6px 0; font-weight: 800; font-size: 13px; text-align: right;">${safeWarehouseName}</div>
                </div>
                <div style="display: table-row;">
                  <div style="display: table-cell; padding: 6px 0; color: #334155; font-weight: 700; font-size: 13px;">Last Updated</div>
                  <div style="display: table-cell; padding: 6px 0; font-weight: 800; font-size: 13px; text-align: right;">${safeUpdatedAt}</div>
                </div>
              </div>
            </div>

            <div style="text-align: left; margin-top: 4px;">
              <div style="font-weight: 800; margin-bottom: 10px; font-size: 14px;">Open shipment</div>
              <div style="margin-bottom: 10px;">
                <a href="${escapeHtml(shipmentUrl)}"
                   style="display: inline-block; padding: 12px 16px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px;">
                  Open Shipment Details
                </a>
              </div>
              <div style="font-size: 12.5px; color: #475569;">
                If the button doesn&apos;t work, copy and open this link:
                <br />
                <span style="word-break: break-word;">${escapeHtml(shipmentUrl)}</span>
              </div>
            </div>

            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #e5e7eb;">
              <div style="font-weight: 800; margin-bottom: 8px; font-size: 14px;">Next steps</div>
              <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 13.5px;">
                <li>Please check the Admin/Warehouse/Client dashboard for full details.</li>
              </ul>
            </div>
          </div>

          <div style="padding: 14px 22px; background: #f8fafc; color: #64748b; font-size: 12.5px;">
            Regards, <strong style="color:#0f172a;">UZA Logistics</strong>
          </div>
        </div>
      </div>
    `

    // Fire-and-forget for SMTP failures is handled by caller; still return result for debugging.
    const result = await sendMail({ to: Array.from(emails).join(','), subject, text, html })
    if (result?.sent) {
      settings.totalEmailsSent = (settings.totalEmailsSent || 0) + 1
      settings.updatedAtIso = new Date().toISOString()
      await settings.save()
    }
  } catch (err) {
    console.error('SendShipmentNotificationEmail failed:', err)
  }
}

