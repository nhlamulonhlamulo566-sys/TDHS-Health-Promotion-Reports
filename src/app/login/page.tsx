
'use client';
import Image from "next/image";
import { getLogoPath, DEFAULT_LOGO_PATH } from '@/lib/logo';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!auth) {
        toast({
            title: 'Login Failed',
            description: "Authentication service is not available.",
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
        router.push('/dashboard');
    } catch (error: any) {
        toast({
            title: 'Login Failed',
            description: "Invalid email or password.",
            variant: 'destructive',
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-6 pb-6">
          {/* Enhanced Logo Section */}
          <div className="flex justify-center items-center">
            <div className="relative w-full">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl" />
              
              {/* Logo Container */}
              <div className="relative flex justify-center py-6 px-4">
                <div className="group cursor-default transition-transform duration-300 hover:scale-105">
                  <Image
                    src={getLogoPath() || DEFAULT_LOGO_PATH}
                    alt="Provincial Health Logo"
                    width={280}
                    height={180}
                    priority
                    className="h-auto w-full max-w-xs drop-shadow-md transition-shadow duration-300 group-hover:drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back!</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-100"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-white border-gray-200 focus:border-green-500 focus:ring-green-100"
              />
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 mt-6"
              disabled={isLoading || !auth}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Footer Message */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
            If you don't have an account, please contact an administrator to create one for you.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
