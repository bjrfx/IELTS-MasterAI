import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IELTSGeneral() {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && (!currentUser || !isAdmin)) {
      navigate("/");
    }
  }, [currentUser, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <PageLayout title="IELTS General">
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
    <PageLayout title="IELTS General">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ai-chat')}
            className="rounded-full h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">IELTS General</h1>
        </div>
        
        <Card className="p-6">
          <p className="text-gray-600">IELTS General content will be implemented here.</p>
        </Card>
      </div>
    </PageLayout>
  );
}