
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Laptop, Loader2, Smartphone, UserCircle } from "lucide-react";
import { useUser } from "@/firebase";
import { format } from 'date-fns';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function SecurityTab() {
  const { user } = useUser();
  const [loginHistory, setLoginHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user && user.metadata) {
      const { creationTime, lastSignInTime } = user.metadata;
      const history = [];

      if (creationTime) {
        history.push({
          device: "Account Created",
          location: "N/A",
          time: format(new Date(creationTime), 'PPP p'),
          icon: UserCircle,
        });
      }
      
      if (lastSignInTime) {
        history.push({
          device: "Last Sign-in",
          location: "Unknown",
          time: format(new Date(lastSignInTime), 'PPP p'),
          icon: Laptop,
        });
      }
      
      setLoginHistory(history);
    }
  }, [user]);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    if (!user || !user.email) {
        toast({ title: "Error", description: "You must be logged in to change your password.", variant: "destructive" });
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, data.newPassword);

        toast({
            title: "Password Updated",
            description: "Your password has been successfully changed.",
        });
        form.reset();
    } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
            toast({
                title: "Incorrect Password",
                description: "The current password you entered is incorrect.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        }
        console.error("Password update error:", error);
    }
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                Update your password regularly to keep your account secure.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Password</FormLabel>
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
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
        <Separator />
         <Card>
            <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>
                Review recent login activity on your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loginHistory.length > 0 ? loginHistory.map((login, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <login.icon className="h-4 w-4 text-muted-foreground" />
                                        <span>{login.device}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{login.location}</TableCell>
                                <TableCell>{login.time}</TableCell>
                            </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              No login history available.
                            </TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </CardContent>
        </Card>
    </div>
  );
}
