import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';
import { Cloud } from 'lucide-react';
import { Redirect } from 'wouter';

// Extended schemas for form validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };
  
  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };
  
  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen flex items-stretch bg-neutral-50">
      {/* Left column - Forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-2">
                <Cloud className="text-primary h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {isLogin ? 'Sign in to CloudStore' : 'Create your account'}
              </h2>
              <p className="text-neutral-500 mt-1">
                {isLogin 
                  ? 'Access your files from anywhere'
                  : 'Get 10GB free storage when you sign up'}
              </p>
            </div>
            
            {isLogin ? (
              // Login Form
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="your@email.com"
                    {...loginForm.register('username')}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    {...loginForm.register('rememberMe')}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-neutral-700"
                  >
                    Remember me
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                </Button>
                
                <p className="text-center text-sm text-neutral-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Create one
                  </button>
                </p>
              </form>
            ) : (
              // Register Form
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Smith"
                    {...registerForm.register('fullName')}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="your@email.com"
                    {...registerForm.register('username')}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('password')}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">Password must be at least 8 characters</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register('confirmPassword')}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                

                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                </Button>
                
                <p className="text-center text-sm text-neutral-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right column - Hero */}
      <div className="hidden md:block md:w-1/2 bg-primary p-12 text-white flex items-center">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Store, access, and share your files securely
          </h1>
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Access your files from any device, anywhere</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Organize your documents with folders</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Share files securely with friends and colleagues</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Preview documents, images, and videos without downloading</span>
            </li>
          </ul>
          <div className="mt-8 p-4 bg-white/10 rounded-lg">
            <p className="text-white/90 italic">
              "CloudStore has transformed how I manage my files. It's simple, secure, and just works!"
            </p>
            <p className="mt-2 font-medium">— Sarah Johnson, Designer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
