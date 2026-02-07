// Centralized Lucide icons map for dynamic usage across components
// To add new icons: import from 'lucide-react' and add to iconsMap below.
// Use lowercase and hyphen for keys (ex: 'bed', 'door-open')

import {
    DoorOpen,
    DoorClosed,
    Bath,
    Sofa,
    Bed,
    ChefHat,
    Home,
    MapPin,
    Users,
    ShowerHead,
    Ruler,
    CheckCircle,
    ExternalLink,
} from "lucide-react";

export const iconsMap: Record<string, any> = {
    "door-open": DoorOpen,
    "door-closed": DoorClosed,
    bath: Bath,
    sofa: Sofa,
    bed: Bed,
    "chef-hat": ChefHat,
    home: Home,
    "map-pin": MapPin,
    users: Users,
    "shower-head": ShowerHead,
    ruler: Ruler,
    "check-circle": CheckCircle,
    "external-link": ExternalLink,
};

// Helper for fallback
export function getIconByName(name: string) {
    const normalized = name?.toLowerCase().replace(/_/g, "-");
    return iconsMap[normalized] || Home;
}
