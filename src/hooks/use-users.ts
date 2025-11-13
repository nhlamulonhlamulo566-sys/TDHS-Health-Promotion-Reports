
"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc, where } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import useStore from '@/lib/store';
import { useToast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { UserProfile } from '@/lib/store';

export function useUsers() {
    const { users, setUsers } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

     useEffect(() => {
        const fetchUserProfile = async () => {
          if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            }
          }
        };
        fetchUserProfile();
    }, [user, firestore]);

    useEffect(() => {
        if (!firestore || !userProfile) {
             if (!user) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        let usersQuery;
        if (userProfile.role === 'Super Administrator') {
            usersQuery = query(collection(firestore, 'users'));
        } else if (userProfile.role === 'Administrator') {
             if (userProfile.district) {
                usersQuery = query(
                    collection(firestore, 'users'),
                    where('district', '==', userProfile.district)
                );
            } else {
                // Admin with no district sees only themself.
                usersQuery = query(collection(firestore, 'users'), where('uid', '==', userProfile.id));
            }
        } else {
            // Health promoters only see themselves
            usersQuery = query(collection(firestore, 'users'), where('uid', '==', userProfile.id));
        }


        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            setUsers(usersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            const permissionError = new FirestorePermissionError({
                path: 'users',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({
                title: "Error",
                description: "Could not fetch users. You may not have the required permissions.",
                variant: "destructive",
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, userProfile, setUsers, toast, user]);

    return { users, isLoading };
}
