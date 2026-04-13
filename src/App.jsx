import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardingPage } from "./pages/OnboardingPage";

export default function App() {
  const [session, setSession] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkProfile(currentSession) {
    if (!currentSession) {
      setProfileReady(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    setProfileReady(!!data);
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      await checkProfile(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession ?? null);
      await checkProfile(currentSession ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session) return <LoginPage />;
  if (!profileReady) return <OnboardingPage session={session} onDone={() => setProfileReady(true)} />;

  return <DashboardPage session={session} />;
}