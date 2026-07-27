import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Ielts from "./pages/Ielts";
import Habits from "./pages/Habits";
import Content from "./pages/Content";
import Setup from "./pages/Setup";

const nav = [
  { to: "/", label: "Today", icon: "🏠", end: true },
  { to: "/ielts", label: "IELTS", icon: "📚" },
  { to: "/habits", label: "Habits", icon: "💪" },
  { to: "/content", label: "Brand", icon: "🚀" },
  { to: "/setup", label: "Block", icon: "🔒" },
];

export default function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="flex-1 px-4 pb-24 pt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ielts" element={<Ielts />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/content" element={<Content />} />
          <Route path="/setup" element={<Setup />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-md justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-lg px-3 py-1 text-[11px] ${
                  isActive ? "text-brand-light" : "text-slate-400"
                }`
              }
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
