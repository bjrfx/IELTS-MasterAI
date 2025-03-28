import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Mail, Facebook } from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithFacebook } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await signInWithEmail(data.email, data.password);
      toast({
        title: "Login successful",
        description: "You have been logged in successfully.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      await signUpWithEmail(data.email, data.password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Google sign-in failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await signInWithFacebook();
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Facebook sign-in failed",
        description: error.message || "Failed to sign in with Facebook.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardContent className="px-6 py-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 rounded-md bg-primary/10 p-2 w-16 h-16 flex items-center justify-center">
              <svg 
                className="h-10 w-10 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">IELTS Mock Test</h2>
            <p className="text-gray-600">
              {isLogin ? "Sign in to start your preparation" : "Create an account to get started"}
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    {...loginForm.register("rememberMe")}
                  />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Button variant="link" className="p-0 h-auto text-sm">
                  Forgot password?
                </Button>
              </div>

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...signupForm.register("email")}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register("password")}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...signupForm.register("confirmPassword")}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Sign Up
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center"
              >
                <Mail className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFacebookSignIn}
                className="flex items-center justify-center"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <Button
                variant="link"
                className="p-0 h-auto ml-1"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
