import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, setUserPaidStatus, setUserAsAdmin } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserCheck, Users } from 'lucide-react';

interface User {
  id: string;
  displayName: string;
  email: string;
  isPaidUser: boolean;
  isAdmin: boolean;
  createdAt: any;
  testsCompleted: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const usersData = await getAllUsers();
        setUsers(usersData as User[]);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const handleTogglePaidStatus = async (userId: string, isPaid: boolean) => {
    setUpdatingUser(userId);
    try {
      await setUserPaidStatus(userId, isPaid);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isPaidUser: isPaid } : user
      ));
      toast({
        title: 'User Updated',
        description: `User is now ${isPaid ? 'a premium' : 'a free'} user.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update user status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleToggleAdminStatus = async (userId: string, isAdmin: boolean) => {
    setUpdatingUser(userId);
    try {
      await setUserAsAdmin(userId, isAdmin);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin } : user
      ));
      toast({
        title: 'User Updated',
        description: `User is now ${isAdmin ? 'an admin' : 'a regular user'}.`,
      });
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update admin status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> User Management
            </CardTitle>
            <CardDescription>Manage user accounts and their access levels</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.displayName || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.isPaidUser && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black">Premium</Badge>
                        )}
                        {user.isAdmin && (
                          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">Admin</Badge>
                        )}
                        {!user.isPaidUser && !user.isAdmin && (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.testsCompleted || 0}</TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`user-paid-${user.id}`}
                            checked={user.isPaidUser}
                            disabled={updatingUser === user.id}
                            onCheckedChange={(checked) => handleTogglePaidStatus(user.id, checked)}
                          />
                          <Label htmlFor={`user-paid-${user.id}`} className="text-xs">
                            {updatingUser === user.id ? 
                              <Loader2 className="h-3 w-3 animate-spin" /> : 
                              'Premium'
                            }
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`user-admin-${user.id}`}
                            checked={user.isAdmin}
                            disabled={updatingUser === user.id}
                            onCheckedChange={(checked) => handleToggleAdminStatus(user.id, checked)}
                          />
                          <Label htmlFor={`user-admin-${user.id}`} className="text-xs">
                            {updatingUser === user.id ? 
                              <Loader2 className="h-3 w-3 animate-spin" /> : 
                              'Admin'
                            }
                          </Label>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}