/*
 * App.jsx — Route guard and page switch.
 *
 * Signed out, every path falls back to the auth page. Signed in, landing on the
 * auth page sends you to the dashboard; the welcome page is where a fresh
 * sign-in lands.
 */

import { useEffect } from "react";

import { Auth } from "./api.js";
import AuthPage from "./pages/AuthPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import WelcomePage from "./pages/WelcomePage.jsx";
import { ROUTES, navigate, useRoute } from "./router.js";

export default function App() {
  const path = useRoute();
  const loggedIn = Auth.isLoggedIn;

  useEffect(() => {
    if (!loggedIn && path !== ROUTES.auth) {
      navigate(ROUTES.auth, { replace: true });
    } else if (loggedIn && path === ROUTES.auth) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [loggedIn, path]);

  if (!loggedIn) return <AuthPage />;
  if (path === ROUTES.welcome) return <WelcomePage />;
  return <DashboardPage />;
}
