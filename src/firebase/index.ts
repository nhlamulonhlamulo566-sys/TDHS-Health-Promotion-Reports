import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
import { FirebaseClientProvider } from './client-provider';

/**
 * Initializes the Firebase app.
 *
 * @returns {{
 *   app: FirebaseApp;
 * }}
 */
function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  return { app };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
