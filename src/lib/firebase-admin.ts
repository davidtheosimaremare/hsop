/**
 * Firebase Admin SDK — Singleton Initializer
 *
 * Pastikan env berikut sudah ada:
 *  - FIREBASE_PROJECT_ID
 *  - FIREBASE_CLIENT_EMAIL
 *  - FIREBASE_PRIVATE_KEY
 *
 * Atau gunakan FIREBASE_SERVICE_ACCOUNT_JSON (seluruh JSON dalam 1 variabel).
 */

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let app: App;

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Opsi 1: Semua credential dalam satu variabel JSON
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    return app;
  }

  // Opsi 2: Variabel terpisah
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "[FCM] Firebase Admin credentials tidak dikonfigurasi. " +
      "Isi FIREBASE_SERVICE_ACCOUNT_JSON atau FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY di .env"
    );
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return app;
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getFirebaseAdminApp());
}
