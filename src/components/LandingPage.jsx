import { useRef } from "react";
import {
  Upload, FileText, Edit3, Scissors, Merge, RotateCw,
  Lock, Unlock, Image, Minimize2, Shield, Zap, CheckCircle2,
  ArrowRight, FileDown, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Edit3,
    title: "Edit PDF",
    description: "Add text, images, or freehand drawings directly onto any page.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Scissors,
    title: "Split PDF",
    description: "Break a large PDF into separate files with precision.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: Merge,
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one seamless document.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: RotateCw,
    title: "Rotate Pages",
    description: "Fix orientation — rotate individual pages or the whole file.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Minimize2,
    title: "Compress PDF",
    description: "Reduce file size without sacrificing readability.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Image,
    title: "Convert to Image",
    description: "Export PDF pages as high-quality JPEG images.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Lock,
    title: "Lock PDF",
    description: "Password-protect your document before sharing.",
    color: "text-slate-500",
    bg: "bg-slate-50",
  },
  {
    icon: Unlock,
    title: "Unlock PDF",
    description: "Remove password protection from a PDF you own.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: FileText,
    title: "Rename PDF",
    description: "Give your file a clean, descriptive name on download.",
    color: "text-teal-500",
    bg: "bg-teal-50",
  },
];

const privacyPoints = [
  "All processing happens in your browser",
  "No files ever leave your device",
  "No account required",
  "No tracking, no analytics",
];

const steps = [
  { icon: Upload, label: "Upload your PDF" },
  { icon: Edit3, label: "Choose a tool & edit" },
  { icon: FileDown, label: "Download the result" },
];

export function LandingPage({ onGetStarted }) {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onGetStarted(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      onGetStarted(file);
    }
  };

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl translate-x-1/2 -translate-y-1/2" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 gap-1.5 px-3 py-1" variant="default">
            <Shield className="h-3 w-3 text-emerald-500" />
            100% Private — Works Entirely in Your Browser
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            Edit PDFs{" "}
            <span className="text-primary">safely</span>
            {" "}and{" "}
            <span className="relative">
              instantly
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5C47 1.5 153 1.5 199 5.5" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
            A powerful, private PDF editor that runs entirely in your browser.
            No uploads, no accounts, no data leaves your device — ever.
          </p>

          {/* Upload Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mx-auto max-w-xl"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-4",
                "rounded-2xl border-2 border-dashed border-border hover:border-primary/60",
                "bg-card hover:bg-primary/5 transition-all duration-300 cursor-pointer",
                "p-10 shadow-sm hover:shadow-md"
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Drop your PDF here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or <span className="text-primary font-medium">click to browse</span> your files
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">PDF files only · No size limit</p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              onClick={() => onGetStarted()}
              variant="outline"
              className="w-full mt-4 gap-2"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/30 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-4 hidden sm:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Everything you need for PDFs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Nine powerful tools, all running locally in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                onClick={() => onGetStarted()}
              >
                <CardContent className="p-6 flex items-start gap-4">
                  <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", feature.bg)}>
                    <feature.icon className={cn("h-5 w-5", feature.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-20 bg-muted/30 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 mx-auto mb-6">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Your privacy, by design
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Most online PDF tools upload your files to remote servers.
              myPDF is different — everything happens locally in your browser.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {privacyPoints.map((point) => (
                <div key={point} className="flex items-center gap-3 bg-background rounded-xl border border-border px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Ready to edit your PDF?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Free forever. No sign-up. Your files never leave your browser.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} size="lg" className="gap-2 shadow-md hover:shadow-lg">
            <Zap className="h-4 w-4" />
            Get started — it's free
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </section>
    </main>
  );
}
