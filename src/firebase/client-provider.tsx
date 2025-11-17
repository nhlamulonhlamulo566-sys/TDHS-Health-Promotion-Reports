
'use client';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider, type FirebaseContextType } from './provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2 } from 'lucide-react';

const FirebaseClientContext = createContext<FirebaseContextType | null>(null);

/**
 * Provides the Firebase app, auth, and firestore instances to the client-side of the application.
 * This provider should be used at the root of the application to ensure that all components have access to the Firebase instances.
 * This provider should only be used in client components.
 *
 * @param {React.PropsWithChildren}
 * @returns {React.ReactElement}
 *
 */
export function FirebaseClientProvider({ children }: React.PropsWithChildren) {
  const [firebaseState, setFirebaseState] = useState<{
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
    loading: boolean;
  }>({ app: null, auth: null, firestore: null, loading: true });

  useEffect(() => {
    const { app } = initializeFirebase();
    const auth = getAuth(app);
    
    // Use the modern initializeFirestore with localCache setting
    const firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({})
    });

    // Since initialization is now synchronous for the most part,
    // we can set the state directly. The persistence itself will work in the background.
    console.log("Firestore with offline persistence configured.");
    setFirebaseState({ app, auth, firestore, loading: false });

  }, []);

  if (firebaseState.loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-lg">Initializing App...</span>
            </div>
        </div>
    );
  }

  return (
    <FirebaseClientContext.Provider
      value={{
        app: firebaseState.app!,
        auth: firebaseState.auth!,
        firestore: firebaseState.firestore!,
      }}
    >
      <FirebaseProvider
        app={firebaseState.app!}
        auth={firebaseState.auth!}
        firestore={firebaseState.firestore!}
      >
        <FirebaseErrorListener />
        {children}
      </FirebaseProvider>
    </FirebaseClientContext.Provider>
  );
}

export const useFirebaseClient = () => {
  const context = useContext(FirebaseClientContext);
  if (context === undefined) {
    throw new Error(
      'useFirebaseClient must be used within a FirebaseClientProvider'
    );
  }
  return context;
};
