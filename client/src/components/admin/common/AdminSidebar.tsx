import { Link, useLocation } from "wouter";
import {
    LayoutDashboard,
    Plane,
    Building2,
    MapPin,
    Image,
    Star,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/admin",
    },
    {
        icon: Plane,
        label: "Voos Premium",
        href: "/admin/voos-premium",
    },
    {
        icon: Building2,
        label: "Hospedagens",
        href: "/admin/hospedagens",
    },
    {
        icon: MapPin,
        label: "Viagens",
        href: "/admin/viagens",
    },
    {
        icon: Image,
        label: "Slides Hero",
        href: "/admin/slides-hero",
    },
    {
        icon: Star,
        label: "Avaliações",
        href: "/admin/avaliacoes",
    },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const [location] = useLocation();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Plane className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg">Xplore Viagens</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-white hover:bg-gray-800"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;

                        return (
                            <Link key={item.href} href={item.href}>
                                <a
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-primary text-white"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    )}
                                    onClick={onClose}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </a>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
