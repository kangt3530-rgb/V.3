import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import type { CCLicense, RubricTemplateId } from "../../api/types";

const RUBRIC_OPTIONS: { id: RubricTemplateId; label: string; description: string }[] = [
  { id: "accessibility",  label: "Accessibility",                  description: "Screen readers, alt text, color contrast, multimedia" },
  { id: "copy-editing",   label: "Copy Editing",                   description: "Grammar, style, clarity, citations, inclusive language" },
  { id: "copyright",      label: "Copyright",                      description: "Licensing, attribution, third-party content, fair use" },
  { id: "disciplinary",   label: "Disciplinary Appropriateness",   description: "Academic rigor, currency, college-level cognitive demand" },
  { id: "elearning",      label: "eLearning Review",               description: "Usability, LMS integration, mobile, data privacy" },
  { id: "udl",            label: "UDL",                            description: "Multiple means of representation, expression, engagement" },
];

const CC_LICENSES: CCLicense[] = [
  "CC BY", "CC BY-SA", "CC BY-ND", "CC BY-NC", "CC BY-NC-SA", "CC BY-NC-ND",
];

type Step = 1 | 2 | 3 | 4;

export function SubmissionForm() {
  const navigate  = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [title, setTitle]                = useState("");
  const [subject, setSubject]            = useState("");
  const [oerType, setOerType]            = useState<"url" | "pdf">("url");
  const [url, setUrl]                    = useState("");
  const [fileName, setFileName]          = useState("");
  const [rubrics, setRubrics]            = useState<RubricTemplateId[]>([]);
  const [license, setLicense]            = useState<CCLicense | "">("");
  const [thirdParty, setThirdParty]      = useState("");
  const [errors, setErrors]              = useState<Record<string, string>>({});

  function toggleRubric(id: RubricTemplateId) {
    setRubrics((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  function validateStep(s: Step): boolean {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!title.trim()) e.title = "Resource title is required.";
      if (!subject.trim()) e.subject = "Subject area is required.";
      if (oerType === "url" && !url.trim()) e.url = "Please enter a valid URL.";
      if (oerType === "pdf" && !fileName) e.file = "Please upload a PDF file.";
    }
    if (s === 2 && rubrics.length === 0) e.rubrics = "Select at least one rubric.";
    if (s === 3 && !license) e.license = "A Creative Commons license is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => (s + 1) as Step);
  }

  function handleSubmit() {
    if (!validateStep(4)) return;
    // In real app: call API. For now, navigate back to dashboard.
    navigate("/author");
  }

  const STEPS = ["Resource", "Rubrics", "License", "Review"];

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
            Submit for Certification
          </p>
          <h1 className="font-headline text-headline-md text-primary leading-tight">
            New Resource Submission
          </h1>
        </header>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => {
            const num = (i + 1) as Step;
            const done = step > num;
            const active = step === num;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-label font-bold transition-colors",
                      done   ? "bg-secondary text-on-secondary" :
                      active ? "bg-primary text-on-primary" :
                               "bg-surface-container-high text-on-surface-variant",
                    ].join(" ")}
                  >
                    {done ? <span className="material-symbols-outlined text-[14px]">check</span> : num}
                  </div>
                  <span className={`text-label-sm font-label uppercase tracking-widest ${active ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-outline-variant/30 mx-3" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card surface="lowest" className="p-8 space-y-6">
          {step === 1 && (
            <>
              <Input
                label="Resource Title"
                placeholder="e.g. Quantum Mechanics: An Open Resource"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
              <Input
                label="Subject Area"
                placeholder="e.g. Physical Sciences"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                error={errors.subject}
              />

              {/* OER Type toggle */}
              <div>
                <p className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                  Resource Type
                </p>
                <div className="flex gap-3">
                  {(["url", "pdf"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOerType(t)}
                      className={[
                        "flex-1 flex items-center gap-3 p-4 rounded-md border-2 transition-all text-left",
                        oerType === t
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/30 hover:border-outline-variant",
                      ].join(" ")}
                    >
                      <span className="material-symbols-outlined text-primary">
                        {t === "url" ? "link" : "picture_as_pdf"}
                      </span>
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">
                          {t === "url" ? "Web URL" : "PDF Upload"}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          {t === "url" ? "Pressbooks, OpenStax, etc." : "Upload a PDF file"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {oerType === "url" ? (
                <Input
                  label="Resource URL"
                  type="url"
                  placeholder="https://pressbooks.pub/your-resource"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  error={errors.url}
                />
              ) : (
                <div>
                  <p className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                    PDF File
                  </p>
                  <label className="flex items-center gap-4 p-5 border-2 border-dashed border-outline-variant/50 rounded-md cursor-pointer hover:border-secondary transition-colors">
                    <span className="material-symbols-outlined text-on-surface-variant">upload_file</span>
                    <span className="text-body-md text-on-surface-variant">
                      {fileName || "Click to upload or drag & drop"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                  {errors.file && <p className="mt-1.5 text-body-sm text-error">{errors.file}</p>}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div>
              <p className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
                Select Rubrics (1–6)
              </p>
              {errors.rubrics && (
                <p className="mb-3 text-body-sm text-error">{errors.rubrics}</p>
              )}
              <div className="space-y-3">
                {RUBRIC_OPTIONS.map(({ id, label, description }) => {
                  const checked = rubrics.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleRubric(id)}
                      className={[
                        "w-full flex items-start gap-4 p-4 rounded-md border-2 text-left transition-all",
                        checked
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/30 hover:border-outline-variant",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          checked ? "bg-primary border-primary" : "border-outline-variant",
                        ].join(" ")}
                      >
                        {checked && (
                          <span className="material-symbols-outlined text-on-primary text-[14px]">check</span>
                        )}
                      </div>
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">{label}</p>
                        <p className="text-body-sm text-on-surface-variant mt-0.5">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <p className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                  Creative Commons License <span className="text-error">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CC_LICENSES.map((l) => (
                    <button
                      key={l}
                      onClick={() => setLicense(l)}
                      className={[
                        "p-3 rounded-md border-2 text-left transition-all",
                        license === l
                          ? "border-secondary bg-secondary-container/30 text-secondary font-semibold"
                          : "border-outline-variant/30 hover:border-outline-variant text-on-surface",
                      ].join(" ")}
                    >
                      <span className="text-body-md">{l}</span>
                    </button>
                  ))}
                </div>
                {errors.license && <p className="mt-2 text-body-sm text-error">{errors.license}</p>}
              </div>

              {rubrics.includes("copyright") && (
                <Textarea
                  label="Third-Party Content Disclosure"
                  placeholder="List any external assets, their sources, and permission status. e.g. 'Figure 3: Bohr model, Wikipedia CC BY-SA 4.0'"
                  value={thirdParty}
                  onChange={(e) => setThirdParty(e.target.value)}
                  rows={5}
                  hint="Required for the Copyright rubric review."
                />
              )}
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-headline text-title-lg text-primary">Review & Submit</h2>
              <ReviewRow label="Title"    value={title} />
              <ReviewRow label="Subject"  value={subject} />
              <ReviewRow label="Type"     value={oerType === "url" ? `Web URL: ${url}` : `PDF: ${fileName}`} />
              <ReviewRow label="Rubrics"  value={rubrics.join(", ")} />
              <ReviewRow label="License"  value={license || "—"} />
              {thirdParty && <ReviewRow label="Third-Party" value={thirdParty} />}

              <div className="pt-2 p-4 bg-surface-container-low rounded-md">
                <p className="text-body-sm text-on-surface-variant">
                  By submitting, you confirm this resource is licensed under the selected CC license,
                  and reviewer feedback will be licensed under{" "}
                  <span className="font-semibold text-on-surface">CC BY-ND</span>.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => step === 1 ? navigate("/author") : setStep((s) => (s - 1) as Step)}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 4 ? (
            <Button onClick={next} icon="arrow_forward" iconPosition="right">Continue</Button>
          ) : (
            <Button onClick={handleSubmit} icon="send" iconPosition="right">Submit for Review</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-28 flex-shrink-0 text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-body-md text-on-surface">{value}</span>
    </div>
  );
}
