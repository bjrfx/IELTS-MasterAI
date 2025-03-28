import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Settings } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';

export default function Profile() {
  const { currentUser, userProfile, isPaidUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testsTaken, setTestsTaken] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [_, navigate] = useLocation();

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setTestsTaken(userProfile.testsCompleted || 0);
      setAvgScore(userProfile.averageScore || 0);
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      await updateUserProfile(currentUser.uid, {
        displayName
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <PageLayout title="Profile">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Your Profile">
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
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-2 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent pb-6">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarImage src={userProfile.photoURL || ''} alt={displayName} />
                <AvatarFallback className="text-lg bg-primary text-white">
                  {displayName?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{userProfile.displayName || 'User'}</CardTitle>
                  <div className="flex gap-2">
                    {isPaidUser && (
                      <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-semibold">
                        Premium
                      </Badge>
                    )}
                    {isAdmin && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{userProfile.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4 p-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">{userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Account type</span>
                    <span className="font-medium">{isPaidUser ? 'Premium' : 'Free'}</span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 rounded-b-xl">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="ml-auto hover:bg-primary/10">
                  <Settings className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Stats Card */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle>Your Statistics</CardTitle>
              <CardDescription>Summary of your test performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Tests completed</span>
                <span className="font-semibold text-lg">{testsTaken}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Average score</span>
                <span className="font-semibold text-lg">{avgScore.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Tests remaining</span>
                <span className="font-semibold text-lg">{isPaidUser ? 'Unlimited' : Math.max(0, 3 - testsTaken)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-xl">
              {!isPaidUser && (
                <div className="w-full">
                  <div className="text-sm text-muted-foreground mb-2">
                    {testsTaken >= 3 ? 
                      'You have used all your free tests. Upgrade to premium for unlimited access.' : 
                      `You have ${3 - testsTaken} free tests remaining.`
                    }
                  </div>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-300 text-black hover:from-amber-600 hover:to-yellow-400">
                    Upgrade to Premium
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}