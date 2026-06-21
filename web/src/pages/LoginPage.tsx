import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { isInternalSchoolRole } from "../lib/format";
import type { LoginProfile } from "../types";

interface ProfileOption {
  id: LoginProfile;
  label: string;
  hint: string;
  demoIdentifier: string;
  demoSchoolCode?: string;
}

const PROFILES: ProfileOption[] = [
  {
    id: "superadmin",
    label: "Super Admin Somafrik",
    hint: "Pilotage global de la plateforme",
    demoIdentifier: "superadmin",
  },
  {
    id: "country",
    label: "Admin Pays",
    hint: "Pilotage d'un pays",
    demoIdentifier: "admin-rdc",
  },
  {
    id: "school",
    label: "Établissement",
    hint: "Compte interne d'une école",
    demoIdentifier: "admin",
    demoSchoolCode: "CD-2026-0001",
  },
];

export function LoginPage() {
  const { login, changePassword, setSession, session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<LoginProfile>("superadmin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("CD-2026-0001");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.accessToken && !session.user?.mustChangePassword) {
      navigate(isInternalSchoolRole(session.user?.role) ? "/etablissement" : "/tableau-de-bord", {
        replace: true,
      });
    }
  }, [session, navigate]);

  function applyDemo(option: ProfileOption) {
    setProfile(option.id);
    setIdentifier(option.demoIdentifier);
    setPassword("1234");
    if (option.demoSchoolCode) setSchoolCode(option.demoSchoolCode);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login({
        identifier,
        password,
        profile,
        schoolCode: profile === "school" ? schoolCode : undefined,
      });

      if (result.user?.mustChangePassword) {
        const newPassword = window.prompt(
          "Mot de passe temporaire accepté. Saisissez votre nouveau mot de passe (minimum 6 caractères).",
        );
        if (!newPassword || newPassword.trim().length < 6) {
          setSession(null);
          throw new Error("Vous devez définir un nouveau mot de passe pour continuer.");
        }
        const confirmation = window.prompt("Confirmez le nouveau mot de passe.");
        if (newPassword.trim() !== String(confirmation ?? "").trim()) {
          setSession(null);
          throw new Error("Les mots de passe ne correspondent pas.");
        }
        await changePassword(newPassword);
      }

      showToast("Connexion réussie", "success");
      const role = result.user?.role ?? "";
      navigate(isInternalSchoolRole(role) ? "/etablissement" : "/tableau-de-bord", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-gradient-to-br from-brand to-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black">
            SF
          </div>
          <div>
            <p className="text-lg font-black">Somafrik</p>
            <p className="text-sm text-white/70">ERP scolaire SaaS</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h2 className="text-3xl font-black leading-tight">
            Centralisez la gestion scolaire, du pays à la classe.
          </h2>
          <p className="text-white/80">
            Établissements, utilisateurs, droits, élèves, enseignants, présences, notes,
            paiements, communications et rapports — pilotés depuis un BackOffice unique et sécurisé.
          </p>
        </div>

        <p className="text-sm text-white/60">© {new Date().getFullYear()} Somafrik</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted transition hover:text-brand"
            >
              <span aria-hidden>←</span> Retour à l’accueil
            </Link>
            <h1 className="text-2xl font-black text-ink">Connexion BackOffice</h1>
            <p className="mt-1 text-sm text-muted">
              Sélectionnez votre profil puis saisissez vos identifiants.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setProfile(option.id)}
                className={`rounded-xl border px-2 py-3 text-center text-xs font-bold transition ${
                  profile === option.id
                    ? "border-brand bg-brand-50 text-brand"
                    : "border-line bg-white text-slate-600 hover:border-brand/40"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Identifiant" htmlFor="identifier">
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ex. superadmin"
                autoComplete="username"
                required
              />
            </Field>

            <Field label="Mot de passe" htmlFor="password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                autoComplete="current-password"
                required
              />
            </Field>

            {profile === "school" ? (
              <Field label="Code établissement" htmlFor="schoolCode">
                <Input
                  id="schoolCode"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  placeholder="ex. CD-2026-0001"
                  required
                />
              </Field>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <div className="rounded-xl border border-dashed border-line bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Comptes de démonstration
            </p>
            <div className="flex flex-wrap gap-2">
              {PROFILES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyDemo(option)}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand/40 hover:text-brand"
                >
                  {option.demoIdentifier}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
