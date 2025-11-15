import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Search, Bell } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TopNavProps {
  onMenuToggle: () => void;
}

export default function TopNav({ onMenuToggle }: TopNavProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get initials from user name
  const getInitials = () => {
    if (!user) return "U";
    if (user.name) {
      return user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user.username.slice(0, 2).toUpperCase();
  };
  return (
    <header className="bg-white border-b border-slate-200 flex items-center justify-between p-4">
      {/* Mobile menu toggle */}
      <button 
        className="md:hidden text-slate-500 hover:text-slate-600"
        onClick={onMenuToggle}
      >
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            type="text" 
            placeholder="Search components, clients, or repairs..." 
            className="w-full pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <span className="font-medium">Low stock alert:</span> LM7805 Voltage Regulator
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="font-medium">New repair:</span> Sarah Johnson's inverter received
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="font-medium">Repair completed:</span> Michael Brown's inverter ready
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Profile */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 hover:bg-transparent" data-testid="button-user-menu">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2 bg-primary-600">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-slate-700">{user?.name || user?.username || "User"}</div>
                    <div className="text-xs text-slate-500">{user?.role || "User"}</div>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLocation("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
