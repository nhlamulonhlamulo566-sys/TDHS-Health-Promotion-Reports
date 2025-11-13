
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserPlus,
  Crown,
  Trash2,
  ShieldCheck,
  User as UserIcon,
  Loader2,
  Gem,
  KeyRound,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useAuth } from "@/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useUsers } from "@/hooks/use-users";

const addUserFormSchema = z.object({
  displayName: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  role: z.string().min(1, "Role is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
  persalNumber: z.string().length(8, { message: "Persal number must be exactly 8 characters." }).optional().or(z.literal('')),
  district: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

const districts = [
    "TDHS",
    "Sub-district 1A",
    "Sub-district 1B",
    "Sub-district 2",
    "Sub-district 3 & 4",
    "Sub-district 5 & 7",
    "Sub-district 6",
];

function AddUserDialog({ onUserAdded, currentUserRole }) {
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      role: "Health Promoter",
      password: "",
      confirmPassword: "",
      persalNumber: "",
      district: "",
    },
  });

  async function onSubmit(data: AddUserFormValues) {
    const success = await onUserAdded(data, form.setError);
    if (success) {
        form.reset();
        setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account and profile in the system.
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
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="persalNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Persal Number</FormLabel>
                    <FormControl>
                        <Input placeholder="12345678" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {currentUserRole === 'Super Administrator' && (
                            <SelectItem value="Super Administrator">
                                <div className="flex items-center gap-2">
                                <Gem className="h-4 w-4 text-purple-500" />
                                Super Administrator
                                </div>
                            </SelectItem>
                        )}
                        <SelectItem value="Administrator">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            Administrator
                          </div>
                        </SelectItem>
                        <SelectItem value="Health Promoter">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                            Health Promoter
                          </div>
                        </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export function UserManagementTab() {
  const { users, isLoading } = useUsers();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const currentUserProfile = users.find(u => u.id === currentUser?.uid);
  const currentUserRole = currentUserProfile?.role;
  const isAdministrator = currentUserRole === 'Administrator' || currentUserRole === 'Super Administrator';
  
  const filteredUsers = React.useMemo(() => {
    if (!users || !currentUserRole) return [];
    if (currentUserRole === 'Administrator') {
      return users.filter(user => user.role !== 'Super Administrator');
    }
    return users;
  }, [users, currentUserRole]);

  const handleAddUser = async (data: AddUserFormValues, setError: Function) => {
      if (!firestore || !auth) {
        toast({
            title: "Error",
            description: "Firebase not initialized. Please try again.",
            variant: "destructive"
        });
        return false;
      }
      
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth: getAuthInstance, createUserWithEmailAndPassword } = await import('firebase/auth');
        const { firebaseConfig } = await import('@/firebase/config');

        const tempAppName = `temp-app-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuthInstance(tempApp);

        const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
        const newUser = userCredential.user;

        if (newUser) {
            const userDocRef = doc(firestore, "users", newUser.uid);
            const userProfile = {
                uid: newUser.uid,
                displayName: data.displayName,
                email: data.email,
                role: data.role,
                persalNumber: data.persalNumber || "",
                district: data.district || "",
            };
            await setDoc(userDocRef, userProfile);
            
            toast({
                title: "User Created Successfully",
                description: "The new user account and profile have been created.",
            });
            return true;
        }
        return false;

      } catch (error: any) {
        console.error("Error creating user:", error);
        if (error.code === 'auth/email-already-in-use') {
            setError('email', {
                type: 'manual',
                message: 'This email is already in use by another account.'
            });
        } else if (error.name === 'FirestorePermissionError') {
             errorEmitter.emit('permission-error', error);
        }
        else {
            toast({
                title: "Error Creating User",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive"
            });
        }
        return false;
      }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, "users", userId);
    const updatedData = { role: newRole };
    
    updateDoc(userDocRef, updatedData)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  const handleDeleteUser = async (userId) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, "users", userId);
    
    deleteDoc(userDocRef)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };
  
  const handlePasswordReset = async (email: string) => {
    if (!auth) {
        toast({ title: "Error", description: "Authentication service not available.", variant: "destructive" });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({
            title: "Password Reset Email Sent",
            description: `A password reset link has been sent to ${email}.`,
        });
    } catch (error) {
        console.error("Error sending password reset email:", error);
        toast({
            title: "Error",
            description: "Could not send password reset email. Please try again.",
            variant: "destructive",
        });
    }
  };

  const getInitials = (name) => {
    if (!name || name === "Unknown") return <UserIcon className="h-5 w-5" />;
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  const canManageUser = (targetUserRole) => {
    if (currentUserRole === 'Super Administrator') {
        return true;
    }
    if (currentUserRole === 'Administrator') {
        return targetUserRole !== 'Super Administrator' && targetUserRole !== 'Administrator';
    }
    return false;
  }

  const RoleIcon = ({ role }) => {
    if (role === "Super Administrator") {
        return <Gem className="h-4 w-4 text-purple-500" />;
    }
    if (role === "Administrator") {
      return <Crown className="h-4 w-4 text-amber-500" />;
    }
    return <ShieldCheck className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
        {isAdministrator && <AddUserDialog onUserAdded={handleAddUser} currentUserRole={currentUserRole} />}
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription>
          <h3 className="font-semibold mb-2">Role Descriptions</h3>
           <div className="flex items-start md:items-center gap-4 mb-1 flex-col md:flex-row">
            <div className="flex items-center gap-2 w-44 shrink-0">
                <Gem className="h-4 w-4 text-purple-500" />
                <strong>Super Administrator:</strong>
            </div>
            <span>Ultimate access, can manage all users including Administrators.</span>
          </div>
          <div className="flex items-start md:items-center gap-4 mb-1 flex-col md:flex-row">
            <div className="flex items-center gap-2 w-44 shrink-0">
              <Crown className="h-4 w-4 text-amber-500" />
              <strong>Administrator:</strong>
            </div>
            <span>Can manage users and create reports. Cannot manage other Admins.</span>
          </div>
          <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
            <div className="flex items-center gap-2 w-44 shrink-0">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <strong>Health Promoter:</strong>
            </div>
            <span>Can create and manage their own health reports.</span>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                        Loading users...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                 {!isLoading && filteredUsers?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                        No users found.
                        </TableCell>
                    </TableRow>
                )}
                {filteredUsers && filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.displayName || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground break-all">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }
                        disabled={!canManageUser(user.role) || user.id === currentUser?.uid}
                      >
                        <SelectTrigger className="w-full md:w-[200px]">
                          <div className="flex items-center gap-2">
                            <RoleIcon role={user.role} />
                            <SelectValue placeholder="Select a role" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {currentUserRole === 'Super Administrator' && (
                            <SelectItem value="Super Administrator">
                                <div className="flex items-center gap-2">
                                <Gem className="h-4 w-4 text-purple-500" />
                                Super Administrator
                                </div>
                            </SelectItem>
                          )}
                          <SelectItem value="Administrator">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-amber-500" />
                              Administrator
                            </div>
                          </SelectItem>
                          <SelectItem value="Health Promoter">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-blue-500" />
                              Health Promoter
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                       {canManageUser(user.role) && user.id !== currentUser?.uid && (
                           <div className="flex justify-end gap-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will send a password reset link to <span className="font-semibold">{user.email}</span>. Are you sure you want to continue?
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePasswordReset(user.email)}>
                                            Send Reset Link
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    >
                                    <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the user profile for <span className="font-semibold">{user.displayName}</span> from the database. It will not delete their authentication account.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                           </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
