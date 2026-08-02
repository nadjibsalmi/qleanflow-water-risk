import { LayoutDashboard, Map, Cpu, FlaskConical, FileText } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/regions", label: "Regions", icon: Map },
  { href: "/model", label: "Model", icon: Cpu },
  { href: "/methodology", label: "Methodology", icon: FlaskConical },
  { href: "/about", label: "About", icon: FileText },
] as const;
