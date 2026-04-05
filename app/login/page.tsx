"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-12">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-green to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-green/50">
            <Zap className="w-6 h-6 text-black font-bold" />
          </div>
          <span className="text-white font-bold text-2xl">Veloce</span>
        </Link>

        {/* Login Card */}
        <div className="glass-panel-dark p-8 mb-6 animate-fadeInUp">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-accent-green/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
              <p className="text-text-muted text-sm">Access your project pipeline</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@veloce.io"
                  className="input-field pl-12"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 w-5 h-5 text-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-12"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                <span className="font-semibold mt-0.5">•</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-border-color/30">
            <p className="text-text-muted text-xs font-medium mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs text-text-muted">
              <p><span className="text-accent-green font-semibold">Admin:</span> admin@veloce.io / admin123</p>
              <p><span className="text-accent-green font-semibold">Reviewer:</span> reviewer@veloce.io / reviewer123</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <p className="text-text-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/" className="text-accent-green font-semibold hover:text-accent-green-light transition-colors">
              Submit a brief
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
