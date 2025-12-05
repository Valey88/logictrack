import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Map as MapIcon,
  Truck,
  Package,
  Fuel,
  Users,
  Settings,
  LogOut,
  Menu,
  Bell,
  Smartphone,
  Globe,
  Wrench,
  Compass,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
}) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-blue-600 text-white shadow-md"
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Truck className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              LogiTrack
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <SidebarItem
              to="/"
              icon={LayoutDashboard}
              label="Панель управления"
              active={isActive("/")}
            />
            <SidebarItem
              to="/map"
              icon={MapIcon}
              label="Карта мониторинга"
              active={isActive("/map")}
            />
            <SidebarItem
              to="/fleet"
              icon={Truck}
              label="Транспорт"
              active={
                isActive("/fleet") || location.pathname.startsWith("/fleet/")
              }
            />
            <SidebarItem
              to="/logistics"
              icon={Package}
              label="Логистика"
              active={isActive("/logistics")}
            />
            <SidebarItem
              to="/planner"
              icon={Compass}
              label="Планировщик маршрутов"
              active={isActive("/planner")}
            />
            <SidebarItem
              to="/fuel"
              icon={Fuel}
              label="Учет топлива"
              active={isActive("/fuel")}
            />
            <SidebarItem
              to="/maintenance"
              icon={Wrench}
              label="ТО и ремонты"
              active={isActive("/maintenance")}
            />

            <div className="pt-6 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Приложения и порталы
            </div>
            <SidebarItem
              to="/driver"
              icon={Smartphone}
              label="Приложение водителя"
              active={isActive("/driver")}
            />
            <SidebarItem
              to="/client-portal"
              icon={Globe}
              label="Клиентский портал"
              active={isActive("/client-portal")}
            />

            <div className="pt-6 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Система
            </div>
            <SidebarItem
              to="/drivers"
              icon={Users}
              label="Водители"
              active={isActive("/drivers")}
            />
            <SidebarItem
              to="/settings"
              icon={Settings}
              label="Настройки"
              active={isActive("/settings")}
            />
          </div>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 text-slate-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">
                  {user?.full_name || user?.email || "Пользователь"}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.role || "Пользователь"}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                {(user?.full_name || user?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
