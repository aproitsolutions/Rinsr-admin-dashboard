'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('from') || '/dashboard/overview';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.message || 'Login failed');
      router.replace(redirectTo);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <PageContainer scrollable={false}>
      <div className='bg-background flex min-h-screen w-full items-center justify-center'>
        <Card className='border-border bg-card w-full max-w-md border shadow-lg'>
          <CardHeader className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-bold tracking-tight'>
              Admin Login
            </CardTitle>
            <CardDescription>Sign in to manage your dashboard</CardDescription>
          </CardHeader>

          <Separator />

          <CardContent>
            <form onSubmit={onSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='admin@example.com'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className='relative space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    className='pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute top-1/2 right-2 -translate-y-1/2 hover:bg-transparent'
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className='text-muted-foreground h-4 w-4' />
                    ) : (
                      <Eye className='text-muted-foreground h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <Button type='submit' disabled={loading} className='mt-4 w-full'>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className='text-muted-foreground flex justify-center text-sm'>
            <p>© {new Date().getFullYear()} Rinsr Admin Panel</p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
