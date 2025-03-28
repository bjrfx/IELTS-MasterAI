import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();

  // Redirect to home if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <AuthForm />
    </div>
  );
}
