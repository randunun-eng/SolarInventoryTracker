import { Link, useLocation } from "wouter";
import { useState } from "react";
import TopNav from "./top-nav";
import {
  LucideIcon,
  LayoutDashboard,
  Cpu,
  Tags,
  Truck,
  AlertTriangle,
  Users,
  Wrench,
  FileText,
  Settings,
  UserCog,
  Zap,
  ChevronDown,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

function SidebarSection({ title, children, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <div 
        className="flex items-center justify-between py-2 px-3 text-slate-300 font-medium cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <ChevronDown className={cn("text-xs transition-transform", isOpen ? "" : "-rotate-90")} size={16} />
      </div>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label }: SidebarLinkProps) {
  const [location] = useLocation();
  const isActive = location === href || 
    (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <div className={cn("sidebar-link", isActive && "active")}>
        <Icon className="w-5 mr-2" size={18} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "sidebar fixed inset-0 z-40 md:relative md:translate-x-0 transition-transform duration-300",
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="sidebar-header">
          <h1 className="text-xl font-bold flex items-center">
            <Zap className="mr-2 text-primary-400" />
            ElectroTrack
          </h1>
          <p className="text-sm text-slate-400">Inventory & Repair Management</p>
        </div>
        <nav className="p-2">
          {/* All users see all menu items - admin password required for restricted areas */}
          <div className="mb-1">
            <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>

          <SidebarSection title="INVENTORY">
            <SidebarLink href="/components" icon={Cpu} label="Components" />
            <SidebarLink href="/categories" icon={Tags} label="Categories" />
            <SidebarLink href="/suppliers" icon={Truck} label="Suppliers" />
            <SidebarLink href="/stockalerts" icon={AlertTriangle} label="Stock Alerts" />
          </SidebarSection>

          <SidebarSection title="REPAIR MANAGEMENT">
            <SidebarLink href="/clients" icon={Users} label="Clients" />
            <SidebarLink href="/repairs" icon={Wrench} label="Repair Logs" />
            <SidebarLink href="/invoices" icon={FileText} label="Invoices" />
          </SidebarSection>

          <SidebarSection title="SETTINGS">
            <SidebarLink href="/settings" icon={Settings} label="General" />
            <SidebarLink href="/users" icon={UserCog} label="Users" />
          </SidebarSection>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav onMenuToggle={toggleMobileMenu} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50">
          {children}
        </div>
      </main>

      {/* Backdrop for mobile menu */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}
    </div>
  );
}
