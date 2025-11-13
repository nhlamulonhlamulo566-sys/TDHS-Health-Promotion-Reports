
'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Baby,
  CalendarDays,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Mic,
  School,
  Settings,
  Siren,
  Users,
  Volume2,
  Loader2,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser, useFirestore } from '@/firebase';
import { useActivities } from '@/hooks/use-activities';
import { doc, getDoc } from 'firebase/firestore';
import { useUsers } from '@/hooks/use-users';
import { UserProfile } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';
import ChunkErrorBoundary from '../chunk-error-handler';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/weekly-plans', label: 'Weekly Plans', icon: CalendarDays },
  { href: '/health-talks', label: 'Health Talks', icon: Mic },
  { href: '/schools', label: 'School', icon: School },
  { href: '/creche', label: 'Creche', icon: Baby },
  { href: '/campaigns', label: 'Health Campaigns', icon: Megaphone },
  { href: '/social-mobilization', label: 'Social Mobilization', icon: Volume2 },
  { href: '/imci-training', label: 'IMCI Training', icon: HeartPulse },
  { href: '/outbreak-response', label: 'Outbreak Response', icon: Siren },
  { href: '/support-groups', label: 'Support Groups', icon: Users },
  { href: '/corner-to-corner', label: 'Corner to Corner', icon: Home },
  { href: '/tish', label: 'TISH', icon: Home },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/user-management', label: 'Settings', icon: Settings },
];

// This component now correctly consumes the sidebar context
function LayoutWithSidebar({ children, userProfile, onLogout }) {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();
    const { user } = useUser();
  
    const handleLinkClick = () => {
      if (isMobile) {
        setOpenMobile(false);
      }
    };
  
    return (
        <>
            <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="md:hidden" asChild>
                    <SidebarTrigger />
                </Button>
                <Icons.logo className="size-6 text-primary" />
                <h1 className="font-headline text-base font-semibold">TDHS Health Promotion Reports System</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior={false}>
                        <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                        onClick={handleLinkClick}
                        >
                        <item.icon />
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex items-center justify-between gap-3 rounded-md p-2 transition-colors hover:bg-sidebar-accent">
                    {userProfile ? (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-10 w-10">
                            <AvatarImage src={userProfile?.photoURL || user?.photoURL || undefined} />
                            <AvatarFallback>{userProfile?.displayName?.[0].toUpperCase() || user?.email?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                            <span className="truncate font-medium">{userProfile?.displayName || 'Anonymous User'}</span>
                            <span className="truncate text-sm text-muted-foreground">{userProfile?.email}</span>
                            <span className="truncate text-xs text-muted-foreground">{userProfile?.role}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 overflow-hidden w-full">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex flex-col gap-1 w-full">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </div>
                    )}
                <TooltipProvider>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={onLogout}>
                        <LogOut />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Log Out</p>
                    </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                </div>
            </SidebarFooter>
            </Sidebar>
            <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
                <Button variant="ghost" size="icon" className="md:hidden" asChild>
                <SidebarTrigger />
                </Button>
                <div className="flex-1">
                {/* Can add a global search here in the future */}
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6"><ChunkErrorBoundary>{children}</ChunkErrorBoundary></main>
            </SidebarInset>
        </>
    );
  }

// This component now ONLY provides the context
function InnerLayout({ children, userProfile, onLogout }) {
    return (
      <SidebarProvider>
        <LayoutWithSidebar userProfile={userProfile} onLogout={onLogout}>
            {children}
        </LayoutWithSidebar>
      </SidebarProvider>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, auth, signOut, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);
  
  // Initialize data fetching hooks. They will manage their own loading state.
  useActivities();
  useUsers();
  
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      setProfileLoading(true);
      if (user && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            } else {
                setUserProfile({
                    id: user.uid,
                    displayName: user.displayName || 'New User',
                    email: user.email || '',
                    role: 'User'
                });
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Handle error, maybe show a toast
        } finally {
            setProfileLoading(false);
        }
      } else if (!user) {
          setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, firestore]);

  const handleLogout = async () => {
    if(auth) {
        await signOut(auth);
    }
    router.push('/login');
  };

  if (authLoading || profileLoading) {
     return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect component
  }

  return (
    <InnerLayout userProfile={userProfile} onLogout={handleLogout}>
      {children}
    </InnerLayout>
  );
}
