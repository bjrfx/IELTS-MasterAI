import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import AdminPanel from "@/components/AdminPanel";
import UsersManagement from "@/components/UsersManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCog, PenSquare, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/ui/PageLayout";
import { Card } from "@/components/ui/card";

export default function Admin() {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("tests");

  useEffect(() => {
    if (!isLoading && (!currentUser || !isAdmin)) {
      navigate("/");
    }
  }, [currentUser, isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <PageLayout title="Admin">
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
    <PageLayout title="Admin Dashboard">
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
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
        </div>
        
        <Card className="shadow-md overflow-hidden">
          <div className="p-6 pb-0">
            <Tabs defaultValue="tests" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto bg-primary/10">
                <TabsTrigger value="tests" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <PenSquare className="h-4 w-4" /> Test Management
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <UserCog className="h-4 w-4" /> User Management
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tests" className="space-y-6 pb-6">
                <AdminPanel />
              </TabsContent>
              
              <TabsContent value="users" className="space-y-6 pb-6">
                <UsersManagement />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
