import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, PlusCircle, UserCog } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const userFormSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters")
    .optional(),
  name: z.string().optional(),
  role: z.string().default("Technician"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

const UserForm = ({
  defaultValues,
  onSubmit,
  onCancel,
}: {
  defaultValues?: UserFormValues;
  onSubmit: (values: UserFormValues) => void;
  onCancel: () => void;
}) => {
  const isEditing = !!defaultValues?.username;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      isEditing
        ? userFormSchema.omit({ password: true }).extend({
            password: z.string().optional(),
          })
        : userFormSchema
    ),
    defaultValues: defaultValues || {
      username: "",
      password: "",
      name: "",
      role: "Technician",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEditing ? "New Password (leave blank to keep current)" : "Password"}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditing ? "New password (optional)" : "Password"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Full Name" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Admin">Administrator</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function UsersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const addUserMutation = useMutation({
    mutationFn: (newUser: UserFormValues) => 
      apiRequest("POST", "/api/users", newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User added successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormValues }) =>
      apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
      setDeletingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. If this is the last administrator user, it cannot be deleted.",
        variant: "destructive",
      });
      setDeletingUserId(null);
    },
  });

  const handleAddUser = (values: UserFormValues) => {
    addUserMutation.mutate(values);
  };

  const handleUpdateUser = (values: UserFormValues) => {
    if (editingUser) {
      // If password is empty string, remove it from the payload
      if (values.password === '') {
        const { password, ...dataWithoutPassword } = values;
        updateUserMutation.mutate({ id: editingUser.id, data: dataWithoutPassword });
      } else {
        updateUserMutation.mutate({ id: editingUser.id, data: values });
      }
    }
  };

  const handleDeleteUser = () => {
    if (deletingUserId !== null) {
      deleteUserMutation.mutate(deletingUserId);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">User Management</CardTitle>
            <CardDescription>
              Manage system users and their access roles
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specific access rights
                </DialogDescription>
              </DialogHeader>
              <UserForm
                onSubmit={handleAddUser}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading users...</div>
          ) : (
            <Table>
              <TableCaption>List of system users</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell>
                        <span className={
                          user.role === 'Admin' 
                            ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium' 
                            : user.role === 'Manager'
                              ? 'bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-medium'
                              : 'bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium'
                        }>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={editingUser?.id === user.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingUser(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="mr-2"
                              onClick={() => setEditingUser(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and access rights
                              </DialogDescription>
                            </DialogHeader>
                            {editingUser && (
                              <UserForm
                                defaultValues={{
                                  username: editingUser.username,
                                  password: "",
                                  name: editingUser.name || "",
                                  role: editingUser.role || "Technician",
                                }}
                                onSubmit={handleUpdateUser}
                                onCancel={() => setEditingUser(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => setDeletingUserId(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete User
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.username}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteUser}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}