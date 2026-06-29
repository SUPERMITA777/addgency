import { getApps, initializeApp, cert, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

// Ensure singleton instance and prevent build failures when env variables are not yet loaded or invalid
if (getApps().length === 0) {
  if (privateKey && clientEmail && projectId) {
    try {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      console.warn('Failed to initialize Firebase Admin with credentials, using build fallback:', error);
      app = initializeApp({
        projectId: projectId || 'mock-project',
      });
    }
  } else {
    // Fallback for Next.js build-time static analysis
    app = initializeApp({
      projectId: projectId || 'mock-project',
    });
  }
} else {
  app = getApp();
}

export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);
export const adminStorage = getStorage(app);
