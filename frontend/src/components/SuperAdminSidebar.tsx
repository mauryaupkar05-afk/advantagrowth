"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const menus = [
  {
    name: "Dashboard",
    href: "/superadmin/dashboard",
    icon: "fa-tachometer-alt",
  },
  {
    name: "Restaurants",
    href: "/superadmin/restaurants",
    icon: "fa-store",
  },

  {
    name: "Subscriptions",
    href: "/superadmin/subscriptions",
    icon: "fa-credit-card",
  },

  {
    name: "System Settings",
    href: "/superadmin/settings",
    icon: "fa-cogs",
  },
];



export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const saved = localStorage.getItem("superAdminSidebarCollapsed");
    if (saved === "true" || window.innerWidth <= 1024) {
      setCollapsed(true);
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("superAdminSidebarCollapsed", String(newState));
    window.dispatchEvent(new CustomEvent("superAdminSidebarToggle", { detail: { collapsed: newState } }));
  };

  const handleMobileLinkClick = () => {
    if (isMobile) {
      setCollapsed(true);
      localStorage.setItem("superAdminSidebarCollapsed", "true");
      window.dispatchEvent(new CustomEvent("superAdminSidebarToggle", { detail: { collapsed: true } }));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "role"
    );

    localStorage.removeItem(
      "user"
    );

    window.dispatchEvent(
      new Event("storage")
    );

    router.replace(
      "/superadmin/login"
    );
  };

  const isActive = (href: string) => {
    if (href === "/superadmin/dashboard") {
      return pathname === "/superadmin/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu trigger — lives outside the sidebar so it stays reachable even when the sidebar is slid off-screen.
          Only needed while the sidebar is hidden; once it's open, its own header toggle closes it without overlapping the logo. */}
      {collapsed && (
        <button
          className="superadmin-mobile-toggle"
          onClick={toggleSidebar}
          aria-label="Open menu"
        >
          <i className="fas fa-bars"></i>
        </button>
      )}

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isMobile && !collapsed ? "sidebar-overlay-visible" : ""}`}
        onClick={toggleSidebar}
      ></div>

      <aside className={`superadmin-sidebar !bg-[#040a17] ${collapsed ? "sidebar-collapsed" : ""}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link href="/superadmin/dashboard" className="sidebar-logo">
            <i className="fas fa-shield-alt sidebar-logo-icon superadmin-logo-icon"></i>
            {!collapsed && <span className="!text-white">Super Admin</span>}
          </Link>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={`fas fa-${collapsed ? "chevron-right" : "chevron-left"}`}></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section !gap-1.5">
            {!collapsed && <span className="sidebar-section-title">Main Menu</span>}

            {menus.map((menu) => {
              const active = isActive(menu.href);
              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className={`sidebar-link !min-h-0 !py-3 ${active ? "sidebar-link-active superadmin-link-active" : ""}`}
                  title={collapsed ? menu.name : ""}
                  onClick={handleMobileLinkClick}
                >
                  <i className={`fas ${menu.icon} sidebar-link-icon`}></i>
                  {!collapsed && <span>{menu.name}</span>}
                  {active && !collapsed && <span className="sidebar-active-indicator superadmin-indicator"></span>}
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}

        </nav>

        {/* Sidebar Footer */}
        {!collapsed && (
          <div className="sidebar-footer relative" ref={profileMenuRef}>
            {profileMenuOpen && (
              <div className="absolute bottom-full left-0 z-30 mb-1.5 w-full overflow-hidden rounded-lg border border-white/10 bg-white/10 py-1 shadow-md backdrop-blur-md">
                <Link
                  href="/superadmin/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm text-gray-200 no-underline transition-colors hover:bg-white/10 hover:text-white"
                >
                  <i className="fas fa-user-gear text-xs text-gray-400"></i>
                  Profile Settings
                </Link>
              </div>
            )}
            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="sidebar-user-info"
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left" }}
            >
              <div className="sidebar-user-avatar superadmin-avatar">
                <i className="fas fa-circle-user"></i>
              </div>
              <div className="sidebar-user-details">
                <p className="sidebar-user-name">Super Admin</p>
                <p className="sidebar-user-role">System Control</p>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}