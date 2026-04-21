import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno"

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
const WHATSAPP_ENDPOINT = Deno.env.get('WHATSAPP_ENDPOINT')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const TABLES = [
  'company_documents',
  'compliance_documents',
  'project_approval',
  'calibration_certificate',
  'subscription'
]

const STAGES = [
  { name: '3_months', days: 90, label: '3 Months' },
  { name: '2_months', days: 60, label: '2 Months' },
  { name: '1_month', days: 30, label: '1 Month' },
  { name: '15_days', days: 15, label: '15 Days' },
]

serve(async (req) => {
  try {
    console.log("Starting Document Renewal Alert Check...")

    const results = []

    for (const tableName of TABLES) {
      console.log(`Checking table: ${tableName}`)

      // Fetch documents needing renewal with a whatsapp number
      // REMOVED 'renewable' filter for testing to ensure we find documents
      const { data: docs, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .not('whatsapp_no', 'is', null)

      if (fetchError) {
        console.error(`Error fetching from ${tableName}:`, fetchError)
        continue
      }

      for (const doc of docs) {
        // Use renewable_date and id_no for all tables as requested
        const dateStr = doc.renewable_date
        const docId = doc.id_no ? doc.id_no.toString() : null

        if (!dateStr || !docId) {
          console.log(`Skipping record in ${tableName}: Missing renewable_date or id_no`)
          continue
        }

        const renewalDate = new Date(dateStr)
        const today = new Date()

        const diffTime = renewalDate.getTime() - today.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        console.log(`Checking ${tableName} doc ${docId}: Diff is ${diffDays} days`)

        let targetStage = null

        if (diffDays <= 0) {
          targetStage = { name: 'expired', label: 'Expired' }
        } else {
          // Find the closest stage
          for (const stage of STAGES) {
            // Send alert if we are within 2 days of the stage (to handle cron variations)
            if (diffDays <= stage.days && diffDays > (stage.days - 3)) {
              targetStage = stage
              break
            }
          }
        }

        if (targetStage) {
          console.log(`Found stage ${targetStage.label} for ${docId} (Diff: ${diffDays} days)`)
          // Check if already notified
          const { data: existingLog } = await supabase
            .from('notification_logs')
            .select('*')
            .eq('doc_id', docId)
            .eq('table_name', tableName)
            .eq('stage', targetStage.name)
            .order('created_at', { ascending: false })
            .limit(1)

          let shouldSend = false
          if (!existingLog || existingLog.length === 0) {
            shouldSend = true
          } else if (targetStage.name === 'expired') {
            // FOR EXPIRED: Only send every 7 days as requested
            const lastSent = new Date(existingLog[0].created_at)
            const daysSinceLast = (today.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
            console.log(`Expired doc ${docId} last sent ${daysSinceLast.toFixed(1)} days ago`)
            if (daysSinceLast >= 7) {
              shouldSend = true
            }
          }

          if (shouldSend) {
            const docName = doc.document_name || doc.instrument_name || doc.service_name || 'Document'
            const recipient = doc.whatsapp_no.toString().replace(/\D/g, '')
            const fullNumber = recipient.startsWith('91') ? recipient : `91${recipient}`

            console.log(`Sending ${targetStage.label} alert for ${docName} to ${fullNumber}`)

            const waResponse = await sendWhatsApp(
              fullNumber,
              docName,
              dateStr,
              targetStage.label,
              tableName,
              doc.validity_period || 'N/A'
            )

            if (waResponse.ok) {
              // Log the notification
              await supabase.from('notification_logs').insert({
                doc_id: docId,
                table_name: tableName,
                stage: targetStage.name,
                sent_to: fullNumber
              })
              results.push({ doc: docName, status: 'sent', stage: targetStage.name })
            } else {
              const errData = await waResponse.json()
              console.error(`Failed to send WhatsApp:`, errData)
              results.push({ doc: docName, status: 'failed', error: errData })
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      message: "Check completed",
      totalAlertsSent: results.length,
      results
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Critical Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})

async function sendWhatsApp(to: string, docName: string, renewalDate: string, stageLabel: string, category: string, validity: string) {
  if (!WHATSAPP_ENDPOINT || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error("WhatsApp configuration missing")
  }

  return await fetch(WHATSAPP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "document_renewal_alert",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: docName },      // {{1}} Document Name
              { type: "text", text: renewalDate },  // {{2}} Renewal Date
              { type: "text", text: stageLabel },   // {{3}} Alert Level
              { type: "text", text: category },     // {{4}} Category
              { type: "text", text: validity }     // {{5}} Validity Period
            ]
          }
        ]
      }
    }),
  })
}
