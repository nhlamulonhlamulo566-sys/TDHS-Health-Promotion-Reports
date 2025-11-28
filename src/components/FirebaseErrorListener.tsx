
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A client component that listens for 'permission-error' events and displays a toast notification.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: Error) => {
      if (error instanceof FirestorePermissionError) {
        console.error(error); // Log the detailed error for developers
        toast({
          title: "Permission Denied",
          description: "You do not have permission to perform this action. Contact your administrator if you believe this is an error.",
          variant: "destructive",
          duration: 10000,
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
