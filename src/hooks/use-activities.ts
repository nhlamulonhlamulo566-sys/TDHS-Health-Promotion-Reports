
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
            setActivities([]); 
            return;
        }
        
        if (!userProfile) {
            return;
        }

        setIsLoading(true);
        
        let activitiesQuery;
        if (userProfile.role === 'Super Administrator') {
            activitiesQuery = query(collection(firestore, 'activities'));
        } else if (userProfile.role === 'Administrator') {
            if (userProfile.district) {
                activitiesQuery = query(
                    collection(firestore, 'activities'),
                    where('district', '==', userProfile.district)
                );
            } else {
                setActivities([]);
                setIsLoading(false);
                return;
            }
        } else {
            activitiesQuery = query(
                collection(firestore, 'activities'),
                where('userId', '==', userProfile.id)
            );
        }

        const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setActivities(activitiesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching activities:", error);
             const permissionError = new FirestorePermissionError({
                path: 'activities', 
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Error",
                description: "Could not fetch activities. You may not have the required permissions.",
                variant: "destructive",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user, userProfile, setActivities, toast]);

    return { activities, isLoading };
}
