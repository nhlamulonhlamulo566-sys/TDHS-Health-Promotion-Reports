
"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import useStore, { UserProfile } from '@/lib/store';
import { useToast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useActivities() {
    const { activities, setActivities } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchUserProfile = async () => {
          if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (isMounted && docSnap.exists()) {
              setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            }
          }
        };
        fetchUserProfile();
        return () => {
            isMounted = false;
        };
    }, [user, firestore]);

    useEffect(() => {
        if (!firestore || !userProfile) {
            if (!user) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        let activitiesQuery;
        let queryPath = 'activities'; // For error reporting

        if (userProfile.role === 'Super Administrator') {
            activitiesQuery = query(collection(firestore, 'activities'));
        } else if (userProfile.role === 'Administrator') {
            if (userProfile.district) {
                activitiesQuery = query(
                    collection(firestore, 'activities'),
                    where('district', '==', userProfile.district)
                );
                queryPath += `?district==${userProfile.district}`;
            } else {
                // Admin with no district sees nothing for now. Can be changed.
                setActivities([]);
                setIsLoading(false);
                return;
            }
        } else {
            activitiesQuery = query(
                collection(firestore, 'activities'),
                where('userId', '==', userProfile.id)
            );
            queryPath += `?userId==${userProfile.id}`;
        }

        const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setActivities(activitiesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching activities:", error);
            // Create and emit a contextual error instead of a generic toast
            const permissionError = new FirestorePermissionError({
                path: queryPath,
                operation: 'list',
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, userProfile, setActivities, user?.uid]);


    return { activities, isLoading };
}
