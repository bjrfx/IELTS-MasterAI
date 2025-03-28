import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/Dashboard";
import AuthForm from "@/components/AuthForm";

export default function Home() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {currentUser ? (
        <Dashboard />
      ) : (
        <AuthForm />
      )}
    </div>
  );
}
