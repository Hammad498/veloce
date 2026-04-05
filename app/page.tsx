import IntakeForm from "@/components/forms/IntakeForm";
import { Zap, ArrowRight, Check, Sparkles, Rocket } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Veloce — AI-Powered Project Analysis",
  description: "Get project estimates, requirements, and complexity analysis in seconds using AI.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-green to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-green/50">
            <Zap className="w-5 h-5 text-black font-bold" />
          </div>
          <span className="text-xl font-bold text-white">Veloce</span>
        </div>
        <Link href="/login" className="btn-primary text-sm">
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 glass-panel px-4 py-2">
          <Sparkles className="w-4 h-4 text-accent-green" />
          <span className="text-sm text-text-secondary">AI-Powered Project Analysis</span>
        </div>

        {/* Main heading */}
        <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter max-w-4xl mx-auto animate-fadeInUp">
          Get Project Estimates in <span className="gradient-text">Seconds</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          Submit your brief and our AI instantly extracts requirements, estimates timelines, and assigns a complexity score. No more guesswork.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
          <button className="btn-primary group flex items-center gap-2 justify-center">
            Submit a Brief
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <Link href="/login" className="btn-secondary flex items-center gap-2 justify-center">
            View Dashboard
          </Link>
        </div>

        {/* Form Card */}
        <div className="max-w-2xl mx-auto mb-20 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
          <div className="glass-panel-dark p-8 md:p-10 border-accent-green/20 hover:border-accent-green/40 transition-all duration-300">
            <h2 className="text-2xl font-bold text-white mb-8">Tell us about your project</h2>
            <IntakeForm />
          </div>
          <p className="text-text-muted text-sm mt-6 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-accent-green" />
            Reviewed by our team within 24 hours · All submissions are confidential
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Why Choose Veloce?</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Rocket,
              title: "Lightning Fast",
              description: "Get AI-powered estimates in seconds, not days"
            },
            {
              icon: Sparkles,
              title: "AI-Powered",
              description: "Advanced AI extracts requirements automatically"
            },
            {
              icon: Check,
              title: "Accurate",
              description: "Real estimates based on project complexity"
            }
          ].map((feature, i) => (
            <div key={i} className="card group hover:border-accent-green/50" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 bg-gradient-to-br from-accent-green/20 to-emerald-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-accent-green/30 transition-all">
                <feature.icon className="w-6 h-6 text-accent-green" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-color/20 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-text-muted">
          <p>&copy; 2026 Veloce. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
