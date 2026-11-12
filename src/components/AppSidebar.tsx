import { useState } from "react";
import { Home, Calendar, Trophy, Dumbbell, Shield, User, Users, CalendarDays, BarChart3, Beer, ClipboardList, ListOrdered } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const { isSuperuser, isTrainer } = useUserRole();

  const isActive = (path: string) => currentPath === path;
  const isExpanded = mainItems.some((i) => isActive(i.url));
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const handleNavClick = () => {
    // Close mobile menu when navigating
    setOpenMobile(false);
  };

  return (
    <Sidebar
      className={state === "collapsed" ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} onClick={handleNavClick}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Persoonlijk</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/my-training" className={getNavCls} onClick={handleNavClick}>
                      <User className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Mijn Trainingen</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/my-matches" className={getNavCls} onClick={handleNavClick}>
                      <Users className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Mijn Wedstrijden</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/my-events" className={getNavCls} onClick={handleNavClick}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Mijn Evenementen</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/statistics" className={getNavCls} onClick={handleNavClick}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Statistieken</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSuperuser && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/bar-duties" className={getNavCls} onClick={handleNavClick}>
                        <Beer className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>Bardiensten</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isSuperuser && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/admin" className={getNavCls} onClick={handleNavClick}>
                        <Shield className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>Admin</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Training</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isTrainer && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink to="/training-plans" className={getNavCls} onClick={handleNavClick}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>Training plannen</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/my-positions" className={getNavCls} onClick={handleNavClick}>
                      <ListOrdered className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Mijn voorkeur</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/drills" className={getNavCls} onClick={handleNavClick}>
                      <Dumbbell className="mr-2 h-4 w-4" />
                      {state !== "collapsed" && <span>Oefeningen</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}