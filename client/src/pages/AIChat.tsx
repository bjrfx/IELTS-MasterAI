import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import AIChat from "@/components/AIChat";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/card";

export default function AIChatPage() {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (!currentUser || !isAdmin)) {
      navigate("/");
    }
  }, [currentUser, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <PageLayout title="AI Chat">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!currentUser || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <PageLayout title="AI Chat">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Chat</h1>
          </div>
        </div>
        
        <div className="w-full">
          <AIChat />
        </div>
      </div>
    </PageLayout>
  );
}