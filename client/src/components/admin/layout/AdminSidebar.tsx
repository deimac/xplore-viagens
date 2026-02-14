import { Link, useLocation } from "wouter";
import {
    LayoutDashboard,
    Plane,
    Building2,
    MapPin,
    Image,
    Star,
    X,
    ChevronDown,
    ChevronRight,
    Bed,
    DoorOpen,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    icon: any;
    label: string;
    href?: string;
    children?: MenuItem[];
}

const menuItems: MenuItem[] = [
    {
        icon: LayoutDashboard,
        label: "Dashboard",
        href: "/admin/dashboard",
    },
    {
        icon: Plane,
        label: "Voos Premium",
        href: "/admin/voos-premium",
    },
    {
        icon: Building2,
        label: "Hospedagens",
        children: [
            {
                icon: Building2,
                label: "Lista de Hospedagens",
                href: "/admin/hospedagens",
            },
            {
                icon: DoorOpen,
                label: "Espaços",
                href: "/admin/tipos-quartos",
            },
            {
                icon: Bed,
                label: "Tipos de Camas",
                href: "/admin/tipos-camas",
            },
        ],
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
    {
        icon: Settings,
        label: "Configurações",
        href: "/admin/configuracoes",
    },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const [location] = useLocation();
    const [expandedItems, setExpandedItems] = useState<string[]>(["Hospedagens"]);

    const toggleExpanded = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const isItemActive = (item: MenuItem): boolean => {
        if (item.href && location === item.href) return true;
        if (item.children) {
            return item.children.some(child => child.href === location);
        }
        return false;
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        const Icon = item.icon;
        const isActive = isItemActive(item);
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.label);

        if (hasChildren) {
            return (
                <div key={item.label}>
                    <button
                        className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors",
                            isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                        onClick={() => toggleExpanded(item.label)}
                    >
                        <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </div>
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                    {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                            {item.children?.map(child => renderMenuItem(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link key={item.href} href={item.href || "#"}>
                <a
                    className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                        level > 0 && "text-sm",
                        location === item.href
                            ? "bg-primary text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                    onClick={onClose}
                >
                    <Icon className={cn("h-5 w-5", level > 0 && "h-4 w-4")} />
                    <span>{item.label}</span>
                </a>
            </Link>
        );
    };

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
                    "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out",
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
                    {menuItems.map((item) => renderMenuItem(item))}
                </nav>
            </aside>
        </>
    );
}
