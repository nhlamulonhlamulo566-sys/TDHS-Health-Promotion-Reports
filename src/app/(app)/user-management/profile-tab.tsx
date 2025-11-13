
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Crown, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
    uid: string | null;
    displayName: string | null;
    email: string | null;
    phone: string;
    organization: string;
    role: string;
    createdAt: any;
    persalNumber: string;
    district: string;
}

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Name is required."),
  phone: z.string().optional(),
  persalNumber: z.string().length(8, { message: "Persal number must be exactly 8 characters." }).optional().or(z.literal('')),
  district: z.string().optional(),
  organization: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const districts = [
    "TDHS",
    "Sub-district 1A",
    "Sub-district 1B",
    "Sub-district 2",
    "Sub-district 3 & 4",
    "Sub-district 5 & 7",
    "Sub-district 6",
];

export function ProfileTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    uid: null,
    displayName: "Loading...",
    email: "Loading...",
    phone: "Loading...",
    organization: "Loading...",
    role: "Loading...",
    createdAt: null,
    persalNumber: "Loading...",
    district: "Loading...",
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  const fetchUserProfile = React.useCallback(async () => {
    if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const userProfileData = {
                uid: user.uid,
                displayName: data.displayName || user.displayName,
                email: data.email || user.email,
                phone: data.phone || 'N/A',
                organization: data.organization || 'N/A',
                role: data.role || 'User',
                createdAt: user.metadata.creationTime,
                persalNumber: data.persalNumber || 'N/A',
                district: data.district || 'N/A',
            };
            setProfile(userProfileData);
            form.reset({
                displayName: userProfileData.displayName || "",
                phone: userProfileData.phone === 'N/A' ? '' : userProfileData.phone,
                persalNumber: userProfileData.persalNumber === 'N/A' ? '' : userProfileData.persalNumber,
                district: userProfileData.district === 'N/A' ? '' : userProfileData.district,
                organization: userProfileData.organization === 'N/A' ? '' : userProfileData.organization,
            });
        } else {
             const userProfileData = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                phone: 'N/A',
                organization: 'N/A',
                role: 'User',
                createdAt: user.metadata.creationTime,
                persalNumber: 'N/A',
                district: 'N/A',
            };
            setProfile(userProfileData);
            form.reset({
                displayName: userProfileData.displayName || "",
            });
        }
    }
  }, [user, firestore, form]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);
  
  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore) {
      toast({
        title: "Error",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
          displayName: data.displayName,
          phone: data.phone,
          persalNumber: data.persalNumber,
          district: data.district,
          organization: data.organization,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      await fetchUserProfile(); // Refetch profile to show updated data
      setIsEditDialogOpen(false);
    } catch(error) {
        console.error("Error updating profile:", error);
        toast({
            title: "Error",
            description: "An error occurred while updating your profile.",
            variant: "destructive",
        });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Information</CardTitle>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="link">Edit Profile</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="persalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Persal Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a district" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {districts.map((district) => (
                                <SelectItem key={district} value={district}>
                                    {district}
                                </SelectItem>
                            ))}
                        </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profile.displayName || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profile.email || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={profile.phone || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="persalNumber">Persal Number</Label>
                <Input id="persalNumber" value={profile.persalNumber || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" value={profile.district || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" value={profile.organization || ''} readOnly />
            </div>
            <div className="space-y-2">
                <Label>Position/Role</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                    {profile.role === 'Administrator' && <Crown className="mr-2 h-4 w-4 text-amber-500" />}
                    {profile.role === 'Super Administrator' && <Crown className="mr-2 h-4 w-4 text-purple-500" />}
                    {profile.role}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </div>
            </div>
            </div>
      </CardContent>
    </Card>
  );
}
