import { useEffect, useMemo, useState } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import LanguageSwitcher from "@/components/language-switcher";
import PageTransitionWrapper from "@/components/layouts/PageTransitionWrapper";
import LogoutConfirmButton from "@/components/layouts/header/components/LogoutConfirmButton";
import { AppStatusToggle } from "@/components/layouts/header/components/AppStatusToggle";
import { ZonePricingToggle } from "@/components/layouts/header/components/ZonePricingToggle";
import ThemeSwitcher from "@/components/theme-switcher";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import DashboardLoading from "@/pages/dashboard/dashboard/loading";
import { TOKEN } from "@/utils/config";
import RouteErrorPage from "@/app/error";
import { useLocale, useSetLocale } from "@/lib/i18n";

const dashboardPages = import.meta.glob("../pages/dashboard/**/page.tsx");
const authPages = import.meta.glob("../pages/auth/**/page.tsx");
const supportedLocales = new Set(["ar", "en"]);
export const routeResultCache = new Map();

function LoadingRoute() {
  const location = useLocation();
  const isDashboardRoute = /^\/(?:ar|en)\/(dashboard|logs|stores|orders|zones|branches|services|category|coupons|offers|banners|home-builder|special-delivery-banners|modules|schedule|users|employees|customers|roles|permissions|fund|transactions|withdraw|complaint|socialMedia|rating|delivery|settings|profile|customer-categories|store-templates|analytics|notifications|partner-settlements|loyalty|table-reservations|service-schedules)(?:\/|$)/.test(location.pathname);

  if (isDashboardRoute) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function toSearchParamsObject(searchParams) {
  const output = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    output[key] = values.length > 1 ? values : values[0];
  }

  return output;
}

function isAsyncComponent(Component) {
  return Component?.constructor?.name === "AsyncFunction";
}

function createLazyPage(loader, filePath) {
  return function LazyRoute() {
    const params = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [moduleState, setModuleState] = useState({ Component: null, error: null });
    const [asyncState, setAsyncState] = useState({ element: null, error: null, routeKey: "" });
    const routeKey = `${filePath}:${location.pathname}${location.search}`;

    const routeProps = useMemo(
      () => ({
        params,
        searchParams: toSearchParamsObject(searchParams)
      }),
      [routeKey]
    );

    useEffect(() => {
      let cancelled = false;

      loader()
        .then(module => {
          if (!cancelled) {
            setModuleState({ Component: module.default, error: null });
          }
        })
        .catch(error => {
          if (!cancelled) {
            setModuleState({ Component: null, error });
          }
        });

      return () => {
        cancelled = true;
      };
    }, [loader]);

    useEffect(() => {
      const Component = moduleState.Component;
      if (!Component || !isAsyncComponent(Component)) return;

      let cancelled = false;

      setAsyncState({ element: null, error: null, routeKey });

      const promise = Component(routeProps);

      Promise.resolve(promise)
        .then(element => {
          if (!cancelled) {
            setAsyncState({ element, error: null, routeKey });
          }
        })
        .catch(error => {
          if (!cancelled) {
            setAsyncState({ element: null, error, routeKey });
          }
        });

      return () => {
        cancelled = true;
      };
    }, [moduleState.Component, routeKey, routeProps]);

    useEffect(() => {
      const handleRefresh = () => {
        const Component = moduleState.Component;
        if (!Component || !isAsyncComponent(Component)) return;

        setAsyncState({ element: null, error: null, routeKey: "" });

        const promise = Component(routeProps);

        Promise.resolve(promise)
          .then(element => {
            setAsyncState({ element, error: null, routeKey });
          })
          .catch(error => {
            routeResultCache.delete(routeKey);
            setAsyncState({ element: null, error, routeKey });
          });
      };

      window.addEventListener("router-refresh", handleRefresh);
      return () => {
        window.removeEventListener("router-refresh", handleRefresh);
      };
    }, [moduleState.Component, routeKey, routeProps]);

    if (moduleState.error) throw moduleState.error;
    if (!moduleState.Component) return <LoadingRoute />;

    const Component = moduleState.Component;

    if (isAsyncComponent(Component)) {
      if (asyncState.error) throw asyncState.error;
      if (asyncState.routeKey !== routeKey || !asyncState.element) return <LoadingRoute />;
      return asyncState.element;
    }

    return <Component {...routeProps} />;
  };
}

function toRoutePath(filePath, root) {
  const relative = filePath
    .replace(root, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/index$/, "");

  const path = relative
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith("[") && segment.endsWith("]"))
        return `:${segment.slice(1, -1)}`;
      return segment;
    })
    .join("/");

  return path || "";
}

function createRoutesFromGlob(modules, root, stripPrefix = "") {
  return Object.entries(modules).map(([filePath, loader]) => {
    const routePath = toRoutePath(filePath, root);
    const path = routePath === "dashboard" || routePath.startsWith("dashboard/")
      ? routePath
      : routePath.replace(new RegExp(`^${stripPrefix}`), "");

    return {
      path,
      Component: createLazyPage(loader, filePath),
    };
  });
}

function ProtectedRoute() {
  const { locale = "ar" } = useParams();
  const location = useLocation();
  const token = localStorage.getItem(TOKEN);
  const safeLocale = supportedLocales.has(locale) ? locale : "ar";
  const activeLocale = useLocale();
  const setLocale = useSetLocale();

  useEffect(() => {
    if (supportedLocales.has(locale) && activeLocale !== locale) {
      setLocale(locale);
    }
  }, [activeLocale, locale, setLocale]);

  if (!supportedLocales.has(locale)) {
    return (
      <Navigate
        to={`/${safeLocale}${location.pathname}${location.search}`.replace(/\/+/g, "/")}
        replace
      />
    );
  }

  if (!token) {
    const signinPath = `/${safeLocale}/signin`;
    if (location.pathname !== signinPath) {
      return <Navigate to={signinPath} replace state={{ from: location }} />;
    }
  }

  return <Outlet />;
}

function PublicRoute() {
  const { locale = "ar" } = useParams();
  const location = useLocation();
  const token = localStorage.getItem(TOKEN);
  const safeLocale = supportedLocales.has(locale) ? locale : "ar";
  const activeLocale = useLocale();
  const setLocale = useSetLocale();

  useEffect(() => {
    if (supportedLocales.has(locale) && activeLocale !== locale) {
      setLocale(locale);
    }
  }, [activeLocale, locale, setLocale]);

  if (!supportedLocales.has(locale)) {
    return (
      <Navigate
        to={`/${safeLocale}${location.pathname}${location.search}`.replace(/\/+/g, "/")}
        replace
      />
    );
  }

  if (token && location.pathname === `/${safeLocale}/signin`) {
    return <Navigate to={`/${safeLocale}/dashboard`} replace />;
  }

  return <Outlet />;
}

function DashboardLayout() {
  const { locale = "ar" } = useParams();

  return (
    <SidebarProvider>
      <AppSidebar side={locale === "ar" ? "right" : "left"} />
      <SidebarInset>
        <header className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4 z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 w-full flex-row-reverse me-3">
            <LogoutConfirmButton />
            <LanguageSwitcher />
            <ThemeSwitcher />
            <div className="h-5 w-px bg-border mx-1" />
            <ZonePricingToggle />
            <div className="h-5 w-px bg-border mx-1" />
            <AppStatusToggle />
          </div>
        </header>
        <main className="p-5 md:p-10">
          <PageTransitionWrapper>
            <Outlet />
          </PageTransitionWrapper>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

const authRoutes = createRoutesFromGlob(authPages, "../pages/auth");
const dashboardRoutes = createRoutesFromGlob(
  dashboardPages,
  "../pages/dashboard",
  "dashboard/",
);

function CatchAllLocaleRedirect() {
  const { locale = "ar" } = useParams();
  const safeLocale = supportedLocales.has(locale) ? locale : "ar";
  return <Navigate to={`/${safeLocale}/dashboard`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/ar/dashboard" replace />,
  },
  {
    path: "/:locale",
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        element: <PublicRoute />,
        children: authRoutes,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="dashboard" replace />,
              },
              ...dashboardRoutes,
            ],
          },
        ],
      },
      {
        path: "*",
        element: <CatchAllLocaleRedirect />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/ar/dashboard" replace />,
  },
]);
