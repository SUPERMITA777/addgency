import { getApps, initializeApp, cert, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function getFirebaseApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Strategy 1: Base64-encoded service account JSON (most reliable on Vercel)
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (serviceAccountBase64) {
    try {
      const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', error);
    }
  }

  // Strategy 2: Raw JSON service account (alternative)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error);
    }
  }

  // Strategy 3: Individual env vars (works locally with .env.local)
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      const cleanedKey = privateKey.replace(/^"|"$/g, '');
      const formattedPrivateKey = cleanedKey.replace(/\\n/g, '\n');
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.warn('Failed to init Firebase Admin with individual env vars:', error);
    }
  }

  // Fallback for build-time static analysis
  console.warn('Firebase Admin: No valid credentials found, using build-time fallback.');
  return initializeApp({
    projectId: projectId || 'build-fallback',
  });
}

const app = getFirebaseApp();

export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);
export const adminStorage = getStorage(app);
