import { Search, Bell, Plus, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    // @ts-expect-error - tRPC types are generated when server is running
    const userQuery = trpc.auth.me.useQuery();
    // @ts-expect-error - tRPC types are generated when server is running
    const logoutMutation = trpc.auth.logout.useMutation();

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            toast.success("Logout realizado");
            window.location.href = "/";
        } catch (e) {
            toast.error("Erro ao deslogar");
        }
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            const parts = name.split(" ");
            if (parts.length >= 2) {
                return (parts[0][0] + parts[1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return "AD";
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 px-4 lg:px-6 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onMenuClick}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white"
                        disabled
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                {/* New Button */}
                <Button size="sm" className="hidden sm:flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Novo
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {/* Notification badge (placeholder) */}
                    {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span> */}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-2 px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {getInitials(userQuery.data?.name, userQuery.data?.email)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <div className="text-sm font-medium leading-none">
                                    {userQuery.data?.name || "Admin"}
                                </div>
                                <div className="text-xs text-gray-500 leading-none mt-1">
                                    {userQuery.data?.email}
                                </div>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                            <User className="mr-2 h-4 w-4" />
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
