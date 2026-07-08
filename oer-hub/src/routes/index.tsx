import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

// Block C
import FeedbackReport                from "../features/block-c/FeedbackReport";
import FinalSubmission               from "../features/block-c/FinalSubmission";
import { OerRubricList }             from "../features/block-c/OerRubricList";
import { RubricReviewEntry }         from "../features/block-c/RubricReviewEntry";
import { ValidationLandingPage }     from "../features/block-c/ValidationLandingPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/reports/oer-001" replace />} />

        {/* Block C: Per-rubric feedback reports */}
        <Route
          path="/reports/:oerId"
          element={<AppShell><OerRubricList /></AppShell>}
        />
        <Route
          path="/reports/:oerId/:rubricId"
          element={<AppShell><RubricReviewEntry /></AppShell>}
        />
        <Route
          path="/reports/:oerId/:rubricId/read"
          element={<AppShell fullScreen><FeedbackReport /></AppShell>}
        />
        <Route
          path="/reports/:oerId/:rubricId/submit"
          element={<AppShell><FinalSubmission /></AppShell>}
        />

        {/* Public validation landing (no main app chrome) */}
        <Route path="/verify/:stampId" element={<ValidationLandingPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/reports/oer-001" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
