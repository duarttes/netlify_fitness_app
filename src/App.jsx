import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return session ? <DashboardPage session={session} /> : <LoginPage />;
}
