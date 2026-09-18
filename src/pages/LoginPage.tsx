import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, BarChart3, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: TrendingUp, title: "Track Every IPO", desc: "Monitor open, upcoming, and listed IPOs in one place." },
  { icon: BarChart3, title: "Subscription Data", desc: "QIB, HNI, and retail subscription figures at a glance." },
  { icon: ShieldCheck, title: "Multi-Account", desc: "Manage applications across multiple demat accounts." },
  { icon: Zap, title: "P&L Dashboard", desc: "Instant profit & loss overview across all your investments." },
];

export default function LoginPage() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp] = useState(false);

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      navigate("/", { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branded panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold backdrop-blur-sm">
              📈
            </div>
            <span className="text-xl font-bold tracking-tight">IPO Tracker</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Your IPO investments,<br />
              <span className="text-white/70">beautifully organized.</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg leading-relaxed">
              Track applications, monitor allotments, and analyze your P&L — all from a single dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <Icon className="h-5 w-5 mb-2 text-white/70" />
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} IPO Tracker. All rights reserved.
        </p>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/30">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-lg">
            📈
          </div>
          <span className="text-lg font-bold">IPO Tracker</span>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {isSignUp
                  ? "Start tracking your IPO investments today."
                  : "Sign in to continue to your dashboard."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 bg-destructive/8 text-destructive text-sm p-3.5 rounded-lg border border-destructive/20">
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11"
                />
                {!isSignUp && (
                  <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={loading}
              >
                {loading
                  ? "Please wait…"
                  : isSignUp
                  ? "Create account"
                  : "Sign in"}
              </Button>
            </form>

            
          </div>
        </div>
      </div>
    </div>
  );
}
