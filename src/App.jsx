import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardingPage } from "./pages/OnboardingPage";

export default function App() {
  const [session, setSession] = useState(null);
  const [booted, setBooted] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        setSession(data.session ?? null);
      } catch (err) {
        console.error("Erro ao buscar sessão:", err);
        if (!alive) return;
        setSession(null);
      } finally {
        if (alive) setBooted(true);
      }
    }

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!alive) return;
      setSession(currentSession ?? null);
      setBooted(true);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!session) {
        if (!alive) return;
        setProfileReady(false);
        setCheckingProfile(false);
        return;
      }

      setCheckingProfile(true);

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("user_id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          console.error("Erro ao checar perfil:", error);
          setProfileReady(false);
        } else {
          setProfileReady(!!data);
        }
      } catch (err) {
        console.error("Erro inesperado ao checar perfil:", err);
        if (!alive) return;
        setProfileReady(false);
      } finally {
        if (alive) setCheckingProfile(false);
      }
    }

    loadProfile();

    return () => {
      alive = false;
    };
  }, [session]);

  if (!booted) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (checkingProfile) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Carregando perfil...</h1>
        </div>
      </div>
    );
  }

  if (!profileReady) {
    return <OnboardingPage session={session} onDone={() => setProfileReady(true)} />;
  }

  return <DashboardPage session={session} />;
}