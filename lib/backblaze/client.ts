const B2_API_URL = 'https://api.backblazeb2.com/b2api/v2';

export interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
}

export interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

/**
 * Authorizes with the Backblaze B2 API using account credentials.
 */
async function authorizeAccount(): Promise<B2AuthResponse> {
  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;
  if (!keyId || !applicationKey) {
    throw new Error('Missing B2 credentials');
  }

  const credentials = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');
  const res = await fetch(`${B2_API_URL}/b2_authorize_account`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    throw new Error(`B2 Authorization failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Gets an upload URL for uploading files to B2.
 */
export async function getB2UploadUrl(bucketId: string): Promise<B2UploadUrlResponse> {
  const auth = await authorizeAccount();
  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  });

  if (!res.ok) {
    throw new Error(`B2 Get Upload URL failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Uploads a file buffer directly to Backblaze B2.
 */
export async function uploadToB2(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; url: string }> {
  const bucketId = process.env.B2_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME;
  const cdnBaseUrl = process.env.B2_CDN_BASE_URL;

  if (!bucketId || !bucketName) {
    throw new Error('Missing B2 Bucket configuration');
  }

  const { uploadUrl, authorizationToken } = await getB2UploadUrl(bucketId);

  // Compute SHA1 check sum (B2 requires this in headers or as 'hex')
  const crypto = await import('crypto');
  const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': mimeType,
      'X-Bz-Content-Sha1': sha1,
    },
    body: fileBuffer as unknown as BodyInit,
  });

  if (!res.ok) {
    throw new Error(`B2 file upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  const fileUrl = cdnBaseUrl
    ? `${cdnBaseUrl}/file/${bucketName}/${fileName}`
    : `https://f002.backblazeb2.com/file/${bucketName}/${fileName}`;

  return {
    fileId: data.fileId,
    url: fileUrl,
  };
}

/**
 * Generates a signed temporary URL for downloading/viewing a file from B2.
 */
export async function getSignedUrl(fileName: string, validitySeconds: number = 7200): Promise<string> {
  const bucketId = process.env.B2_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME;
  const cdnBaseUrl = process.env.B2_CDN_BASE_URL;

  if (!bucketId || !bucketName) {
    throw new Error('Missing B2 Bucket configuration');
  }

  const auth = await authorizeAccount();

  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      Authorization: auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: validitySeconds,
    }),
  });

  if (!res.ok) {
    throw new Error(`B2 Get Download Authorization failed: ${res.statusText}`);
  }

  const data = await res.json();
  const token = data.authorizationToken;

  const base = cdnBaseUrl || `${auth.downloadUrl}/file/${bucketName}`;
  return `${base}/${fileName}?Authorization=${token}`;
}
