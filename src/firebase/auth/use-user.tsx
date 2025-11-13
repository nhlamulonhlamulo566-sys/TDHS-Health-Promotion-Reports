
'use client';
import { onAuthStateChanged, type Auth, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useAuth } from '../provider';

export type UseUser = {
  user: User | null;
  auth: Auth | null;
  signOut: (auth: Auth) => Promise<void>;
  loading: boolean;
};

export function useUser(): UseUser {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const signOut = async (auth: Auth) => {
    await auth.signOut();
  };

  return { user, auth, signOut, loading };
}
