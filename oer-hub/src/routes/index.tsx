import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { AuthorDashboard }          from "../features/block-a/AuthorDashboard";
import { SubmissionForm }           from "../features/block-a/SubmissionForm";
import { ReviewerTaskCenter }        from "../features/block-a/ReviewerTaskCenter";
import { CoordinatorCommandCenter }  from "../features/block-a/CoordinatorCommandCenter";
import { ReviewerConsole }           from "../features/block-b/ReviewerConsole";
import { FeedbackReport }            from "../features/block-c/FeedbackReport";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/author" replace />} />

        {/* Block A: Dashboards */}
        <Route
          path="/author"
          element={<AppShell><AuthorDashboard /></AppShell>}
        />
        <Route
          path="/submit"
          element={<AppShell><SubmissionForm /></AppShell>}
        />
        <Route
          path="/reviewer"
          element={<AppShell><ReviewerTaskCenter /></AppShell>}
        />
        <Route
          path="/reviewer/archive"
          element={<AppShell><div className="pt-16 p-8 text-on-surface-variant">Archive — coming soon</div></AppShell>}
        />
        <Route
          path="/coordinator"
          element={<AppShell><CoordinatorCommandCenter /></AppShell>}
        />
        <Route
          path="/coordinator/mediation"
          element={<AppShell><div className="pt-16 p-8 text-on-surface-variant">Mediation Queue — coming soon</div></AppShell>}
        />

        {/* Block B: Reviewer Console (full-screen) */}
        <Route
          path="/review/:taskId"
          element={<AppShell fullScreen><ReviewerConsole /></AppShell>}
        />

        {/* Block C: Feedback report (stub) */}
        <Route
          path="/reports/:taskId"
          element={<AppShell><FeedbackReport /></AppShell>}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/author" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
