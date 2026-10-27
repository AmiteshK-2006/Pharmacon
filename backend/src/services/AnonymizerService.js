import { supabaseAdmin } from '../config/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const ANONYMIZER_URL = (process.env.ANONYMIZER_SERVICE_URL || 'https://pharmacon-prescription-anonymizer.onrender.com').replace(/\/+$/, '');

/**
 * Sends a prescription file buffer to the external ML Anonymizer service.
 * Endpoint: POST /api/v1/anonymize/preview?jurisdiction=AUTO
 */
export async function anonymizeFileBuffer({ fileBuffer, fileName, mimeType, jurisdiction = 'AUTO' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for cold starts

  try {
    const form = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' });
    form.append('file', blob, fileName || 'prescription.png');

    const targetUrl = `${ANONYMIZER_URL}/api/v1/anonymize/preview?jurisdiction=${encodeURIComponent(jurisdiction)}`;
    console.log(`[AnonymizerService] Calling ${targetUrl} for file="${fileName}" (${fileBuffer.length} bytes)...`);

    const res = await fetch(targetUrl, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Anonymizer responded with status ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();

    // The service returns download_file_base64 as a Data URI (e.g., "data:image/jpeg;base64,...")
    let rawBase64 = data.download_file_base64 || data.redacted_image_base64 || '';
    let outMime = data.mime_type || mimeType || 'image/jpeg';

    if (rawBase64.startsWith('data:')) {
      const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        outMime = match[1];
        rawBase64 = match[2];
      }
    }

    const anonymizedBuffer = Buffer.from(rawBase64, 'base64');

    return {
      success: true,
      anonymizedBuffer,
      mimeType: outMime,
      fileName: data.anonymized_filename || `anonymized_${fileName}`,
      metadata: {
        engine: data.engine || 'Pharmacon Layout-Agnostic Redactor',
        jurisdiction: data.jurisdiction || 'GLOBAL',
        format_type: data.format_type || 'SCANNED_RASTER',
        total_entities_redacted: data.total_entities_redacted || 0,
        confidence_score: data.confidence_score ?? 1.0,
        triage_status: data.triage_status || 'AUTO_APPROVED',
        review_reasons: data.review_reasons || [],
        redacted_targets: data.redacted_targets || [],
        processed_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error(`[AnonymizerService] Anonymization failed for ${fileName}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Full end-to-end processing pipeline for a prescription ID:
 * 1. Retrieves raw scan from Supabase Storage
 * 2. Runs through the Anonymizer Service
 * 3. Saves de-identified output to Supabase Storage under `anonymized/`
 * 4. Inserts file_assets row & updates prescription.anonymized_file_asset_id
 */
export async function processPrescriptionAnonymization(prescriptionId) {
  try {
    // 1. Fetch prescription record
    const { data: prescription, error: presErr } = await supabaseAdmin
      .from('prescriptions')
      .select('id, file_asset_id, anonymized_status')
      .eq('id', prescriptionId)
      .single();

    if (presErr || !prescription) {
      throw new Error(`Prescription ${prescriptionId} not found: ${presErr?.message}`);
    }

    if (!prescription.file_asset_id) {
      throw new Error(`Raw file asset missing for prescription ${prescriptionId}`);
    }

    // Fetch raw file asset directly by primary key
    const { data: rawAsset, error: assetErr } = await supabaseAdmin
      .from('file_assets')
      .select('*')
      .eq('id', prescription.file_asset_id)
      .single();

    if (assetErr || !rawAsset) {
      throw new Error(`File asset ${prescription.file_asset_id} not found: ${assetErr?.message}`);
    }

    // Mark as PROCESSING
    await supabaseAdmin
      .from('prescriptions')
      .update({ anonymized_status: 'PROCESSING' })
      .eq('id', prescriptionId);

    // 2. Download raw file from Supabase storage
    const { data: fileData, error: downloadErr } = await supabaseAdmin.storage
      .from(rawAsset.bucket)
      .download(rawAsset.storage_path);

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download raw file from storage: ${downloadErr?.message}`);
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Send to external Anonymizer
    const result = await anonymizeFileBuffer({
      fileBuffer,
      fileName: rawAsset.original_name,
      mimeType: rawAsset.mime_type,
    });

    if (!result.success) {
      await supabaseAdmin
        .from('prescriptions')
        .update({
          anonymized_status: 'FAILED',
          anonymization_metadata: { error: result.error, failed_at: new Date().toISOString() },
        })
        .eq('id', prescriptionId);
      return { success: false, error: result.error };
    }

    // 4. Upload anonymized file to storage
    const anonymizedFileId = uuidv4();
    const ext = result.fileName.split('.').pop() || 'jpg';
    const anonymizedStoragePath = `anonymized/${anonymizedFileId}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('private-prescriptions')
      .upload(anonymizedStoragePath, result.anonymizedBuffer, {
        contentType: result.mimeType,
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`Failed to upload anonymized file to storage: ${uploadErr.message}`);
    }

    // 5. Create file_assets record
    const { data: newAsset, error: newAssetErr } = await supabaseAdmin
      .from('file_assets')
      .insert({
        id: anonymizedFileId,
        bucket: 'private-prescriptions',
        storage_path: anonymizedStoragePath,
        original_name: result.fileName,
        mime_type: result.mimeType,
        size: result.anonymizedBuffer.length,
        visibility: 'private',
        uploaded_by: rawAsset.uploaded_by || null,
      })
      .select()
      .single();

    if (newAssetErr) {
      throw new Error(`Failed to record anonymized file asset: ${newAssetErr.message}`);
    }

    // 6. Update prescription record
    await supabaseAdmin
      .from('prescriptions')
      .update({
        anonymized_file_asset_id: newAsset.id,
        anonymized_status: 'COMPLETED',
        anonymization_metadata: result.metadata,
      })
      .eq('id', prescriptionId);

    console.log(`[AnonymizerService] Successfully anonymized prescription ${prescriptionId} -> Asset ${newAsset.id}`);
    return { success: true, assetId: newAsset.id, metadata: result.metadata };
  } catch (err) {
    console.error(`[AnonymizerService] Pipeline failure for prescription ${prescriptionId}:`, err);
    await supabaseAdmin
      .from('prescriptions')
      .update({
        anonymized_status: 'FAILED',
        anonymization_metadata: { error: err.message, failed_at: new Date().toISOString() },
      })
      .eq('id', prescriptionId);
    return { success: false, error: err.message };
  }
}
