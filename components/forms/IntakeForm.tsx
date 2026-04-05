"use client";
import { useRef, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Sparkles } from "lucide-react";

const BUDGET_OPTIONS = [
  { value: "under-5k", label: "Under $5,000" },
  { value: "5k-15k", label: "$5,000 – $15,000" },
  { value: "15k-50k", label: "$15,000 – $50,000" },
  { value: "50k-100k", label: "$50,000 – $100,000" },
  { value: "100k-plus", label: "$100,000+" },
];

const URGENCY_OPTIONS = [
  { value: "asap", label: "ASAP (< 1 month)" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "flexible", label: "Flexible / No rush" },
];

type Status = "idle" | "loading" | "success" | "error";

export default function IntakeForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", budgetRange: "", urgency: "",
    contactName: "", contactEmail: "",
  });

  const plainDescription = form.description
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 3) e.title = "Project title must be at least 3 characters";
    if (!plainDescription || plainDescription.length < 50) e.description = "Please provide at least 50 characters describing your project";
    if (!form.budgetRange) e.budgetRange = "Please select a budget range";
    if (!form.urgency) e.urgency = "Please select your timeline";
    if (!form.contactName.trim()) e.contactName = "Your name is required";
    if (!form.contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.contactEmail = "Please enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, description: plainDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Submission failed. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-accent-green/30 to-emerald-600/30 rounded-full flex items-center justify-center mb-6 border border-accent-green/30">
          <CheckCircle className="w-10 h-10 text-accent-green animate-bounce" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Brief Received!</h2>
        <p className="text-text-secondary max-w-sm mb-8">
          Our AI is analyzing your project now. We&apos;ll review the results and reach out within 24 hours with detailed estimates.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setForm({ title:"",description:"",budgetRange:"",urgency:"",contactName:"",contactEmail:"" });
            if (editorRef.current) editorRef.current.innerHTML = "";
          }}
          className="text-accent-green hover:text-accent-green-light font-semibold flex items-center gap-2 transition-colors"
        >
          Submit another brief <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg bg-slate-800/50 border transition-all outline-none text-white placeholder-text-muted
    ${errors[field] ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30" : "border-slate-700 focus:border-accent-green focus:ring-1 focus:ring-accent-green/30"}`;

  const selectClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg bg-slate-800/50 border transition-all outline-none text-white
    ${errors[field] ? "border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/30" : "border-slate-700 focus:border-accent-green focus:ring-1 focus:ring-accent-green/30"}`;

  const applyFormat = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    set("description", editorRef.current?.innerHTML ?? "");
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Project Title */}
        <div className="animate-fadeInUp">
          <label className="block text-sm font-semibold text-white mb-2">Project Title</label>
          <input
            type="text"
            placeholder="e.g. E-commerce platform for handmade goods"
            className={inputClass("title")}
            value={form.title}
            onChange={e => set("title", e.target.value)}
          />
          {errors.title && <p className="mt-2 text-xs text-red-400">{errors.title}</p>}
        </div>

        {/* Description */}
        <div className="animate-fadeInUp" style={{ animationDelay: "0.05s" }}>
          <label className="block text-sm font-semibold text-white mb-2">
            Project Description
            <span className="ml-2 text-text-muted font-normal">({plainDescription.length}/10000)</span>
          </label>
          <div className="mb-2 flex items-center gap-2">
            <button type="button" onClick={() => applyFormat("bold")} className="px-2 py-1 text-xs rounded-md border border-slate-700 text-text-secondary hover:text-white hover:border-accent-green/40">Bold</button>
            <button type="button" onClick={() => applyFormat("italic")} className="px-2 py-1 text-xs rounded-md border border-slate-700 text-text-secondary hover:text-white hover:border-accent-green/40">Italic</button>
            <button type="button" onClick={() => applyFormat("insertUnorderedList")} className="px-2 py-1 text-xs rounded-md border border-slate-700 text-text-secondary hover:text-white hover:border-accent-green/40">Bullet List</button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label="Project description"
            aria-multiline="true"
            onInput={(e) => set("description", e.currentTarget.innerHTML)}
            data-placeholder="Describe your project in detail. What should it do? Who is it for? What problem does it solve? Include any specific features you have in mind..."
            className={inputClass("description") + " min-h-[140px] leading-relaxed"}
          />
          {errors.description && <p className="mt-2 text-xs text-red-400">{errors.description}</p>}
        </div>

        {/* Budget + Urgency row */}
        <div className="grid grid-cols-2 gap-4 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Budget Range</label>
            <select
              className={selectClass("budgetRange")}
              value={form.budgetRange}
              onChange={e => set("budgetRange", e.target.value)}
            >
              <option value="">Select budget</option>
              {BUDGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors.budgetRange && <p className="mt-2 text-xs text-red-400">{errors.budgetRange}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Timeline Urgency</label>
            <select
              className={selectClass("urgency")}
              value={form.urgency}
              onChange={e => set("urgency", e.target.value)}
            >
              <option value="">Select timeline</option>
              {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors.urgency && <p className="mt-2 text-xs text-red-400">{errors.urgency}</p>}
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-4 animate-fadeInUp" style={{ animationDelay: "0.15s" }}>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Your Name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              className={inputClass("contactName")}
              value={form.contactName}
              onChange={e => set("contactName", e.target.value)}
            />
            {errors.contactName && <p className="mt-2 text-xs text-red-400">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Email Address</label>
            <input
              type="email"
              placeholder="jane@company.com"
              className={inputClass("contactEmail")}
              value={form.contactEmail}
              onChange={e => set("contactEmail", e.target.value)}
            />
            {errors.contactEmail && <p className="mt-2 text-xs text-red-400">{errors.contactEmail}</p>}
          </div>
        </div>
      </div>

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-fadeInUp">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8 animate-fadeInUp"
        style={{ animationDelay: "0.2s" }}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing your brief...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Submit Brief
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
