import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaHome,
  FaProjectDiagram,
  FaRocket,
  FaChartLine,
  FaCog,
  FaPlus,
  FaChevronRight,
  FaTerminal,
  FaFlask,
  FaEye,
  FaPlug,
  FaUser,
} from "react-icons/fa";
import { FiActivity } from "react-icons/fi";

const DashboardBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentProject } = useSelector((state) => state.projects);

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const crumbs = [];

    // Always start with Dashboard
    crumbs.push({
      label: "Dashboard",
      icon: FaHome,
      path: "/dashboard",
      isActive: false,
    });

    // Process each segment
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const isLast = i === pathSegments.length - 1;
      const path = "/" + pathSegments.slice(0, i + 1).join("/");

      switch (segment) {
        case "projects":
          if (pathSegments[i + 1] === "create") {
            crumbs.push({
              label: "Projects",
              icon: FaProjectDiagram,
              path: "/dashboard/projects",
              isActive: false,
            });
            crumbs.push({
              label: "Create Project",
              icon: FaPlus,
              path: "/dashboard/projects/create",
              isActive: true,
            });
            i++; // Skip next iteration
          } else if (pathSegments[i + 1] && pathSegments[i + 1] !== "create") {
            // Project details
            crumbs.push({
              label: "Projects",
              icon: FaProjectDiagram,
              path: "/dashboard/projects",
              isActive: false,
            });
            crumbs.push({
              label: currentProject?.name || "Project",
              icon: FaProjectDiagram,
              path: `/dashboard/projects/${id}`,
              isActive: !pathSegments[i + 2],
            });
            i++; // Skip project ID
          } else {
            crumbs.push({
              label: "Projects",
              icon: FaProjectDiagram,
              path,
              isActive: isLast,
            });
          }
          break;

        case "deployments":
          if (pathSegments[i - 1] === "projects") {
            // Project deployments
            crumbs.push({
              label: "Deployments",
              icon: FaRocket,
              path,
              isActive: isLast,
            });
          } else {
            // Global deployments
            crumbs.push({
              label: "Deployments",
              icon: FaRocket,
              path,
              isActive: isLast,
            });
          }
          break;

        case "analytics":
          if (pathSegments[i - 1] === "projects") {
            // Project analytics
            crumbs.push({
              label: "Analytics",
              icon: FaChartLine,
              path,
              isActive: isLast,
            });
          } else {
            // Global analytics
            crumbs.push({
              label: "Analytics",
              icon: FaChartLine,
              path,
              isActive: isLast,
            });
          }
          break;

        case "settings":
          if (pathSegments[i - 1] === "projects") {
            // Project settings
            crumbs.push({
              label: "Settings",
              icon: FaCog,
              path,
              isActive: isLast,
            });
          }
          break;

        case "activity":
          crumbs.push({
            label: "Activity",
            icon: FiActivity,
            path,
            isActive: isLast,
          });
          break;

        case "cli":
          crumbs.push({
            label: "CLI",
            icon: FaTerminal,
            path,
            isActive: isLast,
          });
          break;

        case "api-tester":
          crumbs.push({
            label: "API Tester",
            icon: FaFlask,
            path,
            isActive: isLast,
          });
          break;

        case "monitoring":
          crumbs.push({
            label: "Monitoring",
            icon: FaEye,
            path,
            isActive: isLast,
          });
          break;

        case "integrations":
          crumbs.push({
            label: "Integrations",
            icon: FaPlug,
            path,
            isActive: isLast,
          });
          break;

        case "profile":
          crumbs.push({
            label: "Profile",
            icon: FaUser,
            path,
            isActive: isLast,
          });
          break;

        default:
          // Skip unknown segments or IDs
          break;
      }
    }

    return crumbs;
  }, [location.pathname, currentProject?.name, id]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for just Dashboard
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 sm:mb-6"
    >
      <div className="flex items-center space-x-1 sm:space-x-2 text-sm overflow-x-auto">
        {breadcrumbs.map((crumb, index) => {
          const Icon = crumb.icon;
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div
              key={crumb.path}
              className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
            >
              <button
                onClick={() => handleNavigate(crumb.path)}
                className={`
                  flex items-center space-x-1 sm:space-x-2 px-2 py-1 rounded-lg transition-colors
                  ${
                    crumb.isActive
                      ? "text-blue-400 bg-blue-500/10"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }
                `}
                disabled={isLast}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  {crumb.label}
                </span>
              </button>
              {!isLast && (
                <FaChevronRight className="w-3 h-3 text-neutral-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default DashboardBreadcrumbs;
