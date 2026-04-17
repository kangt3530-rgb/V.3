# **Product Requirement Document (PRD): OER Certification Hub**

**Version:** 3.0

**Status:** Planning / For Review

**Target Release:** April MVP (Functional Launch)

## **1\. General Description**

### **1.1 Revision History**

| Date | Version | Description |
| :---- | :---- | :---- |
| 2026-02-10 | v1.0 | Initial PRD for April Functional MVP |
| 2026.2.16 | v2.0 | Updated based on customer meeting feedback: Adjusted terminology, added web support, clarified storage policies and copyright logic |
| 2026.3.29 | v3.0 | Simplifies previous iterations by focusing exclusively on the essential functional core required for the upcoming launchRedesign the Integrated Reviewer Console (Block B), which now emphasizes a vertical split-pane interaction model and a mandatory evidence-driven rating system to ensure high-fidelity, professional qualitative feedback. |
| 2026-03-31 | v3.1 | Layout Architecture Update: Transitioned Block B from a vertical split-pane to a horizontal (side-by-side) split-pane model to optimize long-form OER reading and side-by-side evaluation. |
| 2026-04-02 | v3.2 | User Flow Updated for Block A and Block B |

### 

### **1.2 Executive Summary**

The OER Certification Hub is a platform built to change the Peer Review process for Open Educational Resources (OER). It moves the process from a slow, email-based model to an automated "Certification Hub." The platform focuses on building trust through standard rubrics and removing administrative delays using Digital Stamps.

### **1.3 Product Vision**

To be the main authority for OER quality, where resources are verified through transparent, expert-led, and efficient workflows.

### **1.4 Target Users**

* Sarah (Author/Professor): Seeks official recognition and clear feedback for her instructional materials.  
  * Self-Reviewer Mode: Sarah may use the platform to perform an initial self-assessment against the rubrics to improve her work prior to formal peer review.  
* Mark (Coordinator/Lead): Manages the review pipeline and matches experts to submissions.  
* James (Reviewer/Expert): Performs professional evaluations. This role includes:  
  * Cross-institution Peer Faculty: Subject matter experts from other academic institutions providing rigorous academic oversight.  
  * External Stakeholders: (e.g., Employers or Industry Leads) who review OER to ensure alignment with workforce needs and industry standards.  
* Educators (Adopters): Looking for verified, high-quality OER for classroom use via validation landing pages.

Note on Role Fluidity: The system supports multi-role users. A single individual may be an Author for their own resources while simultaneously serving as a Reviewer for other projects in their area of expertise.

### **1.5 Glossary**

* OER: Open Educational Resources.  
* Revision Card: A task created when a resource needs improvement on a specific review point. Each card must contain specific, actionable instructions for the author.  
* Digital Stamp: A digital badge that proves a resource passed peer review.  
* Rubric: A set of 6 standard criteria used to grade OER quality.  
* Feedback License: Reviewer feedback is licensed under CC BY-ND (Attribution-NoDerivs). This ensures the feedback can be shared but remains unalterable by the author or third parties.

## **2\. Problem Space & Need Statements**

### **2.1 Problem Statement**

The current OER review process is manual and slow. Leads spend too much time forwarding emails and files. Authors get feedback in different formats that are hard to follow. There is no easy way for others to verify if an OER is high quality, which stops people from using them.

### **2.2 Need Statements**

* Sarah (Author) needs clear and structured feedback to ensure her OER meets standards for classroom use. Success is measured by finishing the full review cycle in 14 days.  
* Mark (Coordinator) needs automated task assignment to stop doing manual admin work and focus on advocacy. Success is measured by spending less than 5 minutes of admin time per project.  
* James (Reviewer) needs a side-by-side workspace to provide feedback without switching browser tabs. Success is measured by a "Reviewer Ease-of-Use" score over 85%.

### **2.3  Design Goals & Constraints**

| Goal | Design Task | Constraints | Priority |
| :---- | :---- | :---- | :---- |
| **Horizontal Split Layout** | Layout	Construct a split-pane interface with "Content Display (Left)" and "Review Console (Right)." | Must support manual resizing of regions and the ability to minimize the Review Console to maximize reading space. | P0 |
| **Evidence-Based Rating** | Establish direct mapping between OER annotations and rubric criteria. | Rating actions are only permitted when associated annotation evidence exists for a criterion. | P0 |
| **Quality Control** | Implement mandatory onboarding and full-rubric review requirements. | Reviewers must acknowledge preamble materials; submissions are blocked until all criteria are addressed. | P1 |
| **On-Demand AI Assistant** | Provide a collapsible, full-height AI sidebar on the right. | Hidden by default; activated by user trigger. AI must have permissions to read current OER content and review data. | P1 |

## 

## 

## 

## **3\. Functional Requirements**

### **Block A: Submission & Dashboard (Core Entry System)**

**1\. Executive Summary**

Block A is the starting point of the OER Certification Hub. It provides an organized system for users to manage their work and track progress. The primary goal is to create a professional and simple entry system for all stakeholders. This block replaces manual processes with automated tools to ensure efficiency from the beginning of the certification path.

**2\. Detailed User Flows**

The Author Journey (Sarah)

Step 1: Accessing the Main Dashboard The author logs into the platform and arrives at the main dashboard. This page shows a list of all current and past submissions. Every project has a status label like Submitted or Under Review so the author can monitor their progress at any time.

Step 2: Starting a Submission The author clicks the button to start a new resource submission. The system opens a form where the author enters the basic details of the project including the title and a description.

Step 3: Providing the Resource The author gives the system access to the educational material. They can enter a web link for online resources or upload a PDF file from their computer. The system connects this material to the new submission.

Step 4: Defining Scope and Legal Details The author selects which quality standards to use by picking specific rubrics. They can choose up to six areas such as Accessibility or Copyright. The author also selects a Creative Commons license and lists any third party content used in the work.

Step 5: Performing a Private Self-Review The author has the option to use the self-review mode before they submit the project. This allows them to check their own work against the rubrics in a private area. Other users cannot see this activity.

Step 6: Finalizing the Process The author reviews all information and clicks the submit button. The system changes the project status to Submitted and makes the resource available for reviewers to claim.

The Reviewer Journey (James)

Step 1: Accessing the Task Center The reviewer logs in and visits the Task Center. This dashboard is divided into available assignments and active reviews that are already in progress.

Step 2: Finding and Claiming a Task The reviewer looks at the Task Pool to find a project that fits their expertise. They can see which rubrics the author selected. When the reviewer claims a task, the system assigns it to them and the project moves to their active list.

Step 3: Tracking Completion The reviewer sees a progress indicator for each active task. This shows how many criteria they have already finished within the selected rubrics. They can click on a task to open the evaluation console.

The Coordinator Journey (Mark)

Step 1: Monitoring the Pipeline The coordinator uses the Command Center to see all active projects in the system. They can filter the list to find resources that need attention or have specific status updates.

Step 2: Managing Assignments and Feedback The coordinator can manually assign a reviewer to a project if it remains unclaimed. They also visit the Mediation Queue to check completed reviews. The coordinator ensures the feedback is professional and helpful before they send it to the author.

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| **A.1** | As an author, I want a centralized dashboard to track the certification status of all my submissions. | **Author Dashboard (Primary View):** A data-driven list view of all submitted OERs. Must display real-time status badges: Submitted, Under Review, In Revision, and Certified. Includes a "Submit New Resource" CTA. | P0 | Planned |
| **A.2** | As an author, I want to submit OER via URL or PDF so I can review resources from different platforms. | **Multi-Format Resource Linkage:** Integrated submission form supporting both external Web URLs (e.g., Pressbooks, OpenStax) and direct PDF file uploads. | P0 | In Progress |
| **A.3** | As an author, I want to define the certification scope by selecting specific rubrics. | **Manual Rubric Selector:** A multi-select UI allowing authors to choose between 1 to 6 standard rubrics (e.g., Accessibility, UDL, Copyright) per submission. | P0 | In Progress |
| **A.4** | As an author, I want to declare my CC license to ensure OER compliance. | **Mandatory CC License Selector:** A required dropdown menu for selecting standard Creative Commons licenses (CC BY, CC BY-SA, etc.) during submission. | P0 | Planned |
| **A.5** | As an author, I want to list third-party content so the copyright reviewer has full context. | **Third-Party Content Disclosure Form:** A structured input field/form for authors to list external assets, their sources, and permission status to support the Copyright Rubric. | P1 | Planned |
| **A.6** | As a reviewer, I want a task pool to claim and manage my reviews independently. | **Reviewer Task Center:** A dedicated dashboard for experts. Features: (1) "Task Pool" to claim available OERs based on tags; (2) "My Active Reviews" with completion % indicators. | P0 | Planned |
| **A.7** | As a coordinator, I want to manage the pipeline and mediate feedback professionally. | **Coordinator Command Center:** A global pipeline view for Admins to monitor all active reviews, manually assign experts, and manage the "Feedback Mediation Queue." | P1 | Planned |
| **A.8** | As an author, I want to perform a private self-review before official submission to ensure I meet standards. | **Private Self-Assessment Mode:** A sandbox version of the Reviewer Console that allows authors to run a private rubric check without triggering the formal review workflow. | P1 | Planned |
| **A.9** | As a user, I want the system to handle status updates automatically to reduce manual administrative overhead. | **Automated Workflow Engine:** Backend logic that transitions resources between states (e.g., transitions to Under Review once a reviewer claims a task) based on user actions. | P0 | Planned |

### **Block B: Integrated Reviewer Console (The Expert Workspace)**

**Executive Summary**  
Block B is the functional core of the OER Certification Hub. It provides a specialized, side-by-side environment where subject matter experts (Reviewers) evaluate OER content against one of six standardized professional rubrics. The primary design goal is "Evidence-Driven Evaluation," ensuring that every qualitative rating is anchored to specific contextual annotations within the resource.

**Detailed User Flow (The Expert Journey)**

Step 1: Session Initiation & Dynamic Loading

* Action: James (Reviewer) selects an active task from his Dashboard.  
* System Logic:  
  * The system identifies the assigned Rubric Type (e.g., Accessibility or Copyright).  
  * The console initializes the Split-Pane Layout. Optional Split-Screen Toggle: To accommodate laptop users with limited screen space and prevent excessive scrolling, the split-screen view is an optional feature. James can toggle between the split-pane and a single-pane/tabbed view to ensure all buttons and content remain visible.  
  * Left Pane: Loads the OER content using the appropriate renderer (Web Proxy for URLs or PDF.js for files).  
  * Right Pane: Injects the specific Rubric Template. Default Expanded State: Upon initial load, all criteria accordions within the Rubric Template are fully expanded by default. This ensures James can immediately read and comprehend the detailed standards across all criteria before beginning his contextual annotation.  
  * Preamble Prompt: Before displaying the criteria list, the system provides access to the Rubric Introduction/Preamble (including Operational Definition, Framing Language, and Intended Use). James has the option to review this foundational context or skip directly to evaluation if he is already familiar with the rubric.

Step 2: Contextual Annotation (Evidence Gathering)

* Action: James reads the OER on the left. He finds a section that violates or exemplifies a standard.  
* System Logic:  
  * James highlights a text string or selects an element (image/video).  
  * Frictionless Placeholder Annotation: James has the option to simply highlight the text as a visual bookmark or placeholder without immediately writing a comment. The system allows saving "Uncommented Highlights" to reduce friction during the initial reading phase.  
  * A Contextual Menu (Annotation Engine) appears near the selection.  
  * James selects the Target Criterion from a dropdown to "tag" this feedback, and categorizes it as either a strength (Positive) or an issue (Negative).  
  * James enters an actionable comment and saves (or leaves it as a placeholder to revisit later).  
  * Data Mapping: The annotation is saved with a criterion\_id and specific anchor coordinates to prevent "drift."

Step 3: Criterion-Level Evaluation & Progress Saving

* Action: James clicks an accordion item in the Rubric Panel on the right to evaluate a specific Criterion.  
* System Logic:  
  * Auto-Layout Adjustment: Upon interacting with the Rubric Panel/Console on the right, the system automatically adjusts the split-pane to a 5:5 ratio. This maximizes space for qualitative feedback and review entry, as the relative need for wide-screen OER viewing decreases during the synthesis/rating phase.  
  * Evidence Bank Review: The Evidence Bank for that Criterion expands, displaying all linked annotations from Step 2\. These serve as contextual reminders to help James recall specific issues or exemplary practices found during his reading.  
  * James clicks a snippet in the Evidence Bank; the Left Pane auto-scrolls and highlights the original location to refresh his memory of the context.  
  * Rating & Synthesis: Based on the gathered evidence, James selects a rating via the Single-Point Rubric UI (Exceeds, Exemplifies Standard, or Needs Improvement) and writes a new, synthesized qualitative comment that summarizes the findings for this criterion. The text input boxes for the "Needs Improvement" and "Exceeds" qualitative comments must support scrollbars and a pop-up enlarged editing mode for comfortable long-form writing.  
  * Auto-Categorized Evidence Bank: The system automatically sorts the annotations within the Evidence Bank into "Strengths" (good) and "Issues" (bad) based on the tags applied in Step 2, visually aligning them with the respective "Exceeds" and "Needs Improvement" input columns.  
  * Glossary Tooltips: Technical terms within the rubric (e.g., "heading hierarchy") feature clickable links that provide instant vocabulary definitions to ensure accurate and consistent evaluation.  
  * Draft Saving: The system triggers an Auto-Save whenever a rating is selected or an annotation is added. James can also manually click "Save Draft" to secure his current session state (including split-pane proportions and scroll positions).  
  * Conditional Enforcement: If Needs Improvement or Exceeds is chosen, the system mandates a qualitative justification and verifies the presence of supporting evidence in the bank.

Step 4: Validation & Final Submission

* Action: James completes all criteria and clicks "Finalize Review."  
* System Logic:  
  * Completeness Check: Verifies that 100% of the criteria in the Rubric have received a rating.  
  * Evidence Check: The system blocks submission if "Needs Improvement" ratings lack supporting annotation evidence in the Evidence Bank.  
  * State Transition: Upon confirmation, the task moves to the Coordinator's queue for professional mediation.  
3. Functional Requirements Table

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| B.1 | As a reviewer, I want the system to load the specific rubric assigned to the task. | Dynamic Rubric Loader: Support storage and loading of the 6 JSON-based professional templates (Accessibility, Copy Editing, etc.). | P0 | Planned |
| B.2 | As a reviewer, I want OER content on the left and rubrics on the right for side-by-side viewing. | Horizontal Resizable Console: Split-pane interface with OER rendering on the left and rubric interface on the right. Must support manual resizing and 7:3 / 5:5 layout presets. | P0 | Completed |
| B.3 | As a reviewer using a laptop, I want the split screen to be an optional feature so that I can view the interface comfortably without excessive scrolling. | Optional Split-Screen Toggle: A UI control to switch between the default split-pane view and a single-pane or tabbed view, ensuring all action buttons remain visible and reducing the need for manual tab switching on smaller screens. | P1 | Planned |
| B.4 | As a reviewer, I want to read the rubric's framing language before evaluating. | Preamble & Intro Display: Optional view for "Operational Definitions" and "Framing Language" before accessing the evaluation criteria, with a skip option for returning users. | P0 | Planned |
| B.5 | As a reviewer, I want all rubric criteria to be expanded by default when I open the console so that I can understand all the standard details before annotating. | Default Expanded Criteria: All criteria accordions/panels in the Rubric Console must be in an expanded/open state upon initial session load. | P1 | Planned |
| B.6 | As a reviewer, I want to annotate directly on the OER content layer. | Direct Content Annotation: Support for detailed feedback anchored to specific text/objects directly on the resource layer (PDF/Web). | P0 | In Progress |
| B.7 | As a reviewer, I want to highlight content without immediately writing a comment so that I can use it as a placeholder to return to later. | Frictionless Placeholder Annotation: Support for highlighting or tagging OER content without mandating immediate text input for the comment field, reducing cognitive friction during the initial reading phase. | P1 | Planned |
| B.8 | As a reviewer, I want to convert OER annotations directly into rating evidence. | Annotation-to-Evidence Mapping: When annotating content, users map comments to specific criteria; annotations are automatically aggregated into the corresponding Evidence Bank on the right. | P0 | In Progress |
| B.9 | As a reviewer, I want to quickly view supporting content during rating. | Bi-directional Navigation: Clicking an evidence entry in the rubric tray automatically scrolls and highlights the original annotation in the OER view (and vice-versa). | P0 | In Progress |
| B.10 | As a reviewer, I want my annotations to be automatically categorized as positive or negative so that they naturally align with the Needs Improvement and Exceeds feedback areas. | Auto-Categorization of Evidence: The system automatically sorts and visually separates annotations within the Evidence Bank based on the sentiment/type (positive vs. negative) designated by the reviewer during the annotation phase. | P1 | Planned |
| B.11 | As a reviewer, I want to summon an AI assistant only when needed. | Full-Height AI Sidebar: Collapsible right-hand panel providing real-time accessibility audits, tone adjustments, and criteria interpretation (P1). | P1 | Revised |
| B.12 | As a reviewer, I want the workspace to automatically provide more space when I focus on the rubric so I can write comments comfortably. | Adaptive Layout Trigger: Automatic adjustment of the split-pane to a 5:5 ratio when the user clicks or focuses on the Rubric Console to facilitate synthesis and qualitative data entry. | P1 | Planned |
| B.13 | As a reviewer, I want to use the standard Single-Point Rubric format and I want to provide independent feedback for both deficiencies and excellence. | Non-Exclusive Single-Point Interface: 3-column layout where "Needs Improvement" and "Exceeds" act as independent toggles, allowing for concurrent feedback. | P0 | Revised |
| B.14 | As a reviewer, I want the feedback text boxes to be easily expandable so I can write and review long qualitative comments comfortably. | Feedback Textbox Expansion: Text input areas for "Needs Improvement" and "Exceeds" must support scrollbars and a pop-up modal for enlarged editing. | P1 | Planned |
| B.15 | As a reviewer, I want to access the full, detailed scholarly description of each criterion so that I can fully understand the standards before rating. | Expandable Criteria Details: Rubric criteria cards support a click-to-expand or modal interaction. Upon activation, the system reveals the comprehensive criteria descriptions (from original source documents), including detailed performance indicators for Exceeds/Standard/Needs Improvement levels. | P0 | Planned |
| B.16 | As a reviewer, I want to quickly view definitions of technical terms within the rubric so that my evaluation is accurate and consistent. | Glossary Tooltips: Technical terms (e.g., "heading hierarchy") within the rubric include clickable definition links. | P1 | Planned |
| B.17 | As a reviewer, I want to save my progress as a draft so that I can pause a long review and resume it later without losing data. | Draft Save & Persistence: Implementation of an auto-save mechanism and a manual "Save Draft" button to ensure session data (annotations, ratings, split positions) is preserved across sessions. | P0 | Planned |
| B.18 | As a reviewer, I want the system to remind me of my earlier findings so I can justify my final ratings with evidence. | Evidence-Driven Validation: If "Needs Improvement" or "Exceeds" is selected, the system enforces a qualitative comment. The Evidence Bank displays prior annotations for that criterion to support the reviewer's decision and ensure ratings are fact-based. | P0 | Revised |
| B.19 | As a reviewer, I must complete all criteria within a rubric module before submitting. | Full-Rubric Completion Lock: Final submission is disabled until every criterion within the selected rubric (e.g., Accessibility) is evaluated. | P0 | Revised |

4\. Rubric Criteria Catalog (Data Schema)  
The system will load the following specific criteria based on the assigned task:

Template 1: Accessibility

* C1: Text Structure & Screen Reader Navigation  
* C2: Visual Design & Color Contrast  
* C3: Alternative Text & Image Accessibility  
* C4: Multimedia (Video/Audio) Accessibility  
* C5: Interactive Elements & Forms  
* C6: Table Structure & Data Presentation  
* C7: Link Quality & Context  
* C8: Technical Format & Compatibility

Template 2: Copy Editing

* C1: Grammar & Syntax  
* C2: Spelling & Typographical Accuracy  
* C3: Punctuation & Mechanics  
* C4: Style Guide Consistency  
* C5: Internal Consistency & Usage  
* C6: Clarity & Readability  
* C7: Formatting & Visual Consistency  
* C8: Citations, References, & Attributions  
* C9: Cross-References & Navigational Elements  
* C10: Inclusive & Accessible Language

Template 3: Copyright

* C1: Original Content Licensing  
* C2: Third Party Content Documentation  
* C3: Attribution Practices  
* C4: Fair Use Application & Documentation  
* C5: License Compatibility & Documentation  
* C6: Public Domain Materials  
* C7: Copyright Status Communication  
* C8: Permissions & Documentation Trail

Template 4: Disciplinary Appropriateness

* C1: Content Accuracy & Validity  
* C2: Currency & Contemporaneity  
* C3: Disciplinary Completeness & Coverage  
* C4: Scholarly Rigor & Theoretical Framework  
* C5: College-Level Appropriateness & Cognitive Demand  
* C6: Source Quality & Documentation  
* C7: Assessment & Practice Quality

Template 5: eLearning Review

* C1: Usability and Technical Functionality  
* C2: Technical Support and Documentation  
* C3: Mobile Accessibility and Cross-Platform Documentation  
* C4: LMS Integration and Interoperability  
* C5: Data Privacy, Security, and Ownership  
* C6: Cost, Sustainability, and Resource Requirements  
* C8: Accessibility Integration  
* C9: Pedagogical Effectiveness and Learning Enhancement  
* C10: Learning Analytics and Customization

Template 6: Universal Design for Learning (UDL)

* C1: Multiple Options for Representation & Perception  
* C2: Learner Choice in Expression & Demonstration  
* C3: Engagement, Relevance, & Cultural Responsiveness  
* C4: Transparent Expectations & Actionable Feedback  
* C5: Collaboration, Communication, & Community  
* C6: Metacognition, Self-Regulation, & Strategic Learning  
* C7: Equity, Bias Awareness, & Inclusive Environments  
* C8: OER-Specific UDL Considerations

5\. Technical Architecture Principles

1. Stateless Frontend: The Reviewer Console acts as a generic shell. It fetches the OER URL and the JSON Rubric Definition via the API based on the task\_id.  
2. Atomic Annotations: Annotations are stored with unique anchors and metadata, enabling them to be rendered independently of the rubric but linked via criterion\_id.  
3. Draft Persistence: Every rating selection and annotation must be auto-saved to prevent data loss.

### **Block C: Feedback, Reports & Revision (The Author's Path to Certification)**

1. Executive Summary  
2. Block C focuses on the synthesis and delivery of expert feedback to the Author. It transforms raw evaluation data into an "Aggregated Report" and "Actionable Revision Cards." The goal is to provide a clear, evidence-based, and friction-free roadmap for the author to improve the OER until it meets the required certification standards.  
3. Detailed User Flow (The Author & Coordinator Journey)

**Step 1: AI-Assisted Lead Mediation (The Gatekeeper)**

* **Action:** Mark (Coordinator) receives a notification that a review is completed.  
* **System Logic:**  
  * The report enters the Mediation Queue.  
  * **AI Conflict Resolution Engine:** Before human review, the system utilizes an AI agent to automatically cross-reference feedback from multiple reviewers. If conflicting annotations or ratings exist (e.g., Reviewer A suggests deletion, Reviewer B praises the section), the AI synthesizes these into a single, balanced "Consensus Card" (Single Source of Truth) and highlights the synthesis for the Coordinator.  
  * Mark reviews the AI-synthesized expert comments for professional tone, clarity, and accuracy of the conflict resolution.  
  * Mark clicks "Release to Author." The Resource status transitions from Under Review to In Revision or Feedback Released.

**Step 2: Entering the Aggregated Report Mode**

* **Action:** Sarah (Author) logs in and opens the "Feedback Report" from her dashboard.  
* **System Logic:**  
  * The system generates an AI-Synthesized View of the review, ensuring all feedback presented is a unified, non-contradictory single source of truth.  
  * Feedback is logically grouped by Rubric Area \> Criterion.  
  * For each Criterion, Sarah sees: (1) The Final Rating; (2) The Synthesized Consensus Comment; (3) The Evidence Bank (linked annotations).  
  * **Downloadable Export:** Sarah has the option to download the complete aggregated report or her specific revision cards as a PDF file for offline reference and record-keeping.

**Step 3: Navigating Evidence & Context (Version-Aware)**

* **Action:** Sarah clicks on an annotation snippet in the report's Evidence Bank to see what needs fixing.  
* **System Logic:**  
  * **Bi-directional Viewer:** The UI opens the split viewer. The left side automatically scrolls to the exact location in the OER where the reviewer left the mark, providing immediate context.  
  * **Verification Drift Prevention (Version-Awareness):** If Sarah has already uploaded a newer version of her OER during the revision process, the system displays a persistent UI banner warning: *"Note: These highlight anchors are based on Version 1.0. Locations may have shifted in your current version."* This prevents confusion from misaligned text anchors.

**Step 4: Executing Revisions (Categorized Revision Cards)**

* **Action:** Sarah focuses on items marked as Needs Improvement to begin her work.  
* **System Logic:**  
  * Each "Needs Improvement" item is automatically converted into an Actionable Revision Card.  
  * **Granular vs. Holistic Sorting:** The system categorizes cards into:  
    * **Local Fixes:** Tied to specific text/image anchors (e.g., "Fix heading on page 3"). Clicking these triggers the Bi-directional Viewer.  
    * **Global Revisions:** Unanchored, holistic feedback (e.g., "The overall tone needs to be more inclusive"). These cards stand alone without forcing a jump to a specific page.  
  * **Response & Clarification Routing:** On each card, Sarah has distinct actions:  
    * **Mark as Fixed & Document:** Toggle the status to "Resolved" and leave a log note (e.g., "Updated the chart contrast on page 5").  
    * **Seek Clarification:** A dedicated "Ask Coordinator" button if the feedback is unclear. This routes a message directly to Mark (Coordinator) with an SLA, preventing the author from being blocked by an asynchronous/anonymous Reviewer.

**Step 5: Final Submission & Summary**

* **Action:** Once all Revision Cards are marked as resolved, Sarah submits the revised OER for final approval.  
* **System Logic:**  
  * **Summary of Revisions (Rebuttal):** Before final submission, Sarah is prompted to provide a brief "Summary of Revisions" (similar to an academic Rebuttal Letter). This outlines her major changes and addresses any feedback she strategically chose not to implement.  
  * The Coordinator receives the package and verifies the revisions against the original cards.  
  * Upon approval, the system generates the Digital Stamp and publishes the Validation Landing Page.  
3. Functional Requirements Table

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| C.1 | As a coordinator, I want to review feedback before the author sees it to ensure professional standards. | **Mediated Feedback Release:** A "Mediation Queue" for Leads to approve, edit, or flag reviewer comments before they are visible to authors. | P0 | Planned |
| C.2 | As a coordinator, I want the system to automatically merge and resolve conflicting feedback from multiple reviewers so that the author receives a single, clear consensus. | **AI Conflict Resolution Engine:** An AI agent that analyzes multiple reviewer submissions, identifies contradictions, and synthesizes a single unified feedback card (Single Source of Truth) prior to final release. | P1 | Planned |
| C.3 | As an author, I want to see all feedback in one structured place rather than hunting through notes. | **Aggregated Report View:** A hierarchical UI that organizes feedback by Rubric \-\> Criterion \-\> Rating \-\> Synthesized Comment. | P0 | Planned |
| C.4 | As an author, I want to see the specific context of a reviewer's concern without being confused by shifted content in my new draft. | **Version-Aware Evidence Linking:** Clicking a report snippet scrolls to the original annotation anchor. Must include a UI warning banner if the user is viewing anchors overlaid on a newly uploaded version (Verification Drift prevention). | P0 | Planned |
| C.5 | As an author, I want a clear To-Do list that separates specific typo fixes from broad structural issues. | **Categorized Revision Cards:** Automated task cards generated from Needs Improvement ratings, visually distinguished between "Local Fixes" (anchored) and "Global Revisions" (unanchored). Supports "Fixed/Resolved" status toggles. | P0 | Planned |
| C.6 | As an author, I want to download my feedback and revision cards as a PDF so that I can review them offline or keep a local record. | **Downloadable Reports & Cards:** Support for exporting the aggregated review report and actionable revision cards into a downloadable PDF format. | P1 | Planned |
| C.7 | As an author, I want to filter feedback to focus on specific issues (e.g., only Accessibility). | **Report Filtering & Sorting:** Ability to filter the report by rating level (e.g., "Show only Needs Improvement") or specific Rubric areas. | P1 | Planned |
| C.8 | As an author, I want to explain my changes or ask for help if I don't understand a piece of feedback. | **Revision Response & Clarification Logic:** Distinct UI actions on cards to (1) "Log Fix" (document changes) or (2) "Ask Coordinator" (route questions to the Lead to avoid asynchronous reviewer bottlenecks). | P1 | Planned |
| C.9 | As an author, I want to summarize my updates in a professional manner before final submission. | **Summary of Revisions Module:** A mandatory text input at the end of the revision cycle for the author to summarize major changes or provide a rebuttal to unimplemented feedback. | P2 | Planned |
| C.10 | As a coordinator, I want to issue a public-facing proof of quality once the review is successful. | **Digital Stamp Generation:** System creates a unique, verifiable badge/stamp linked to a public landing page displaying the review summary. | P1 | Planned |
| C.11 | As an adopter (Educator), I want to verify if an OER is truly certified. | **Validation Landing Page:** A public-facing URL that showcases the OER metadata, the rubrics applied, and the final "Proficient" status. | P1 | Planned |

4. Technical Architecture Principles  
* **Read-Only Evidence:** In Report Mode, the original reviewer annotations are immutable (CC BY-ND logic). The author can only add "Response" layers.  
* **Version Awareness & Snapshots:** If a Revision Card is marked "Fixed," the system should ideally timestamp and snapshot the state of the OER at that moment. The UI must cleanly decouple V1 annotations from V2 documents.  
* **Public/Private Separation:** The landing page (C.11) only shows the Summary of the review (Criteria passed), while specific critical annotations and author rebuttals remain strictly private between Author and Coordinator.

### **3.4 Block D: Progress Management & Persistence**

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| **D.1** | As a reviewer, I want to save my progress to resume later. | **State Persistence:** Automatic saving of all inputs, split-pane proportions, scroll positions, and completion status. | P0 | Revised |
| **D.3** | As a reviewer, I want to see a clear progress indicator. | **Progress Tracking:** A visual "X/N Completed" indicator visible in the navigation or sidebar. | P1 | In Progress |

## **4\. Technical Path Description**

### **4.1 Proxy Architecture**

The system utilizes a proxy layer to inject a transparent annotation overlay on OER content. This enables multi-reviewer layering without modifying the original source files.

### **4.2 Layout Engine**

A responsive vertical splitting mechanism is implemented. As users adjust the分栏 (split) proportions, the system recalculates annotation coordinates to ensure precision relative to the OER content.

### **4.3 Data Integrity**

The "Evidence Bank" in the Reviewer Console is mapped in real-time to the OER annotation database. If an annotation is deleted, the system verifies and prompts if the associated rubric rating still has sufficient evidence.

## **5\. Storage & Data Persistence**

* **Permanent Retention:** Rubric evaluation results and final synthesized reports.  
* **Temporary Retention:** Raw OER files (retention period of approximately 6 months).  
* **Multimedia Support:** Video resources cannot be converted to PDF; the system stores timestamp metadata associated with feedback separately.

## **6\. Release Plan (Prototype Focus)**

* **Current Phase:** Delivery of a high-fidelity prototype featuring vertical split-pane navigation, single-point rubric interaction, and annotation-to-evidence mapping.  
* **Next Phase:** Integration of context-aware AI sidebars and the multi-reviewer synthesized report view.