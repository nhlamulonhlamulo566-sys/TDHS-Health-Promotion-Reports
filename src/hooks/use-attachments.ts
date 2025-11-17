
"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import useStore, { UserProfile } from '@/lib/store';
import { useToast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useAttachments() {
    const { attachments, setAttachments } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
          if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                  setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
                }
            } catch (e) {
                console.error("Error fetching user profile", e);
            }
          }
           if (!user) {
            setUserProfile(null);
          }
        };
        fetchUserProfile();
    }, [user, firestore]);

    useEffect(() => {
        if (!firestore || !user) {
            setIsLoading(false);
            setAttachments([]); 
            return;
        }
        
        if (!userProfile) {
            return;
        }

        setIsLoading(true);
        
        let attachmentsQuery;
        if (userProfile.role === 'Super Administrator') {
            attachmentsQuery = query(collection(firestore, 'attachments'));
        } else if (userProfile.role === 'Administrator') {
            if (userProfile.district) {
                attachmentsQuery = query(
                    collection(firestore, 'attachments'),
                    where('district', '==', userProfile.district)
                );
            } else {
                setAttachments([]);
                setIsLoading(false);
                return;
            }
        } else {
            attachmentsQuery = query(
                collection(firestore, 'attachments'),
                where('userId', '==', userProfile.id)
            );
        }

        const unsubscribe = onSnapshot(attachmentsQuery, (snapshot) => {
            const attachmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setAttachments(attachmentsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching attachments:", error);
             const permissionError = new FirestorePermissionError({
                path: 'attachments', 
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Error",
                description: "Could not fetch attachments. You may not have the required permissions.",
                variant: "destructive",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user, userProfile, setAttachments, toast]);

    return { attachments, isLoading };
}
