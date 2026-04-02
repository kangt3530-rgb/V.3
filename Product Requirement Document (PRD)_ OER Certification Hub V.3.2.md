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

1\. Executive Summary  
Block B is the functional core of the OER Certification Hub. It provides a specialized, side-by-side environment where subject matter experts (Reviewers) evaluate OER content against one of six standardized professional rubrics. The primary design goal is "Evidence-Driven Evaluation," ensuring that every qualitative rating is anchored to specific contextual annotations within the resource.

**2\. Detailed User Flow (The Expert Journey)**  
Step 1: Session Initiation & Dynamic Loading

* Action: James (Reviewer) selects an active task from his Dashboard.  
* System Logic:  
  * The system identifies the assigned Rubric Type (e.g., *Accessibility* or *Copyright*).  
  * The console initializes the Split-Pane Layout.  
  * Left Pane: Loads the OER content using the appropriate renderer (Web Proxy for URLs or PDF.js for files).  
  * Right Pane: Injects the specific Rubric Template.  
  * Preamble Prompt: Before displaying the criteria list, the system provides access to the Rubric Introduction/Preamble (including Operational Definition, Framing Language, and Intended Use). James has the option to review this foundational context or skip directly to evaluation if he is already familiar with the rubric.

Step 2: Contextual Annotation (Evidence Gathering)

* Action: James reads the OER on the left. He finds a section that violates or exemplifies a standard.  
* System Logic:  
  * James highlights a text string or selects an element (image/video).  
  * A Contextual Menu (Annotation Engine) appears near the selection.  
  * James selects the Target Criterion from a dropdown to "tag" this feedback.  
  * James enters an actionable comment and saves.  
  * Data Mapping: The annotation is saved with a criterion\_id and specific anchor coordinates to prevent "drift."

Step 3: Criterion-Level Evaluation & Progress Saving

* Action: James clicks an accordion item in the Rubric Panel on the right to evaluate a specific Criterion.  
* System Logic:  
  * Auto-Layout Adjustment: Upon interacting with the Rubric Panel/Console on the right, the system automatically adjusts the split-pane to a 5:5 ratio. This maximizes space for qualitative feedback and review entry, as the relative need for wide-screen OER viewing decreases during the synthesis/rating phase.  
  * Evidence Bank Review: The Evidence Bank for that Criterion expands, displaying all linked annotations from Step 2\. These serve as contextual reminders to help James recall specific issues or exemplary practices found during his reading.  
  * James clicks a snippet in the Evidence Bank; the Left Pane auto-scrolls and highlights the original location to refresh his memory of the context.  
  * Rating & Synthesis: Based on the gathered evidence, James selects a rating via the Single-Point Rubric UI (`Exceeds`, `Exemplifies Standard`, or `Needs Improvement`) and writes a new, synthesized qualitative comment that summarizes the findings for this criterion.  
  * Draft Saving: The system triggers an Auto-Save whenever a rating is selected or an annotation is added. James can also manually click "Save Draft" to secure his current session state (including split-pane proportions and scroll positions).  
  * Conditional Enforcement: If `Needs Improvement` or `Exceeds` is chosen, the system mandates a qualitative justification and verifies the presence of supporting evidence in the bank.

Step 4: Validation & Final Submission

* Action: James completes all criteria and clicks "Finalize Review."  
* System Logic:  
  * Completeness Check: Verifies that 100% of the criteria in the Rubric have received a rating.  
  * Evidence Check: The system blocks submission if "Needs Improvement" ratings lack supporting annotation evidence in the Evidence Bank.  
  * State Transition: Upon confirmation, the task moves to the Coordinator's queue for professional mediation.

**3\. Functional Requirements Table**

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| **B.1** | As a reviewer, I want the system to load the specific rubric assigned to the task. | **Dynamic Rubric Loader:** Support storage and loading of the 6 JSON-based professional templates (Accessibility, Copy Editing, etc.). | P0 | **Planned** |
| **B.2** | As a reviewer, I want OER content on the left and rubrics on the right for side-by-side viewing. | **Horizontal Resizable Console:** Split-pane interface with OER rendering on the left and rubric interface on the right. Must support manual resizing and **7:3 / 5:5 layout presets**. | P0 | **Completed** |
| **B.3** | As a reviewer, I want to read the rubric's framing language before evaluating. | **Preamble & Intro Display:** Optional view for "Operational Definitions" and "Framing Language" before accessing the evaluation criteria, with a skip option for returning users. | P0 | Planned |
| **B.4** | As a reviewer, I want to annotate directly on the OER content layer. | **Direct Content Annotation:** Support for detailed feedback anchored to specific text/objects directly on the resource layer (PDF/Web). | P0 | **In Progress** |
| **B.5** | As a reviewer, I want to convert OER annotations directly into rating evidence. | **Annotation-to-Evidence Mapping:** When annotating content, users map comments to specific criteria; annotations are automatically aggregated into the corresponding **Evidence Bank** on the right. | P0 | **In Progress** |
| **B.6** | As a reviewer, I want to quickly view supporting content during rating. | **Bi-directional Navigation:** Clicking an evidence entry in the rubric tray automatically scrolls and highlights the original annotation in the OER view (and vice-versa). | P0 | **In Progress** |
| **B.7** | As a reviewer, I want to summon an AI assistant only when needed. | **Full-Height AI Sidebar:** Collapsible right-hand panel providing real-time accessibility audits, tone adjustments, and criteria interpretation (P1). | P1 | **Revised** |
| **B.8** | As a reviewer, I want the workspace to automatically provide more space when I focus on the rubric so I can write comments comfortably. | **Adaptive Layout Trigger:** Automatic adjustment of the split-pane to a 5:5 ratio when the user clicks or focuses on the Rubric Console to facilitate synthesis and qualitative data entry. | P1 | **Planned** |
| **B.9** | As a reviewer, I want to use the standard Single-Point Rubric format. | **Single-Point Rubric Interface:** Horizontal three-column layout. The center column defines the "Proficient Standard"; the sides record "Needs Improvement" or "Exceeds." | P0 | **Revised** |
| **B.10** | As a reviewer, I want to access the full, detailed scholarly description of each criterion so that I can fully understand the standards before rating. | Expandable Criteria Details: Rubric criteria cards support a click-to-expand or modal interaction. Upon activation, the system reveals the comprehensive criteria descriptions (from original source documents), including detailed performance indicators for Exceeds/Standard/Needs Improvement levels. | P0 | **Planned** |
| **B.11** | As a reviewer, I want to save my progress as a draft so that I can pause a long review and resume it later without losing data. | **Draft Save & Persistence:** Implementation of an auto-save mechanism and a manual "Save Draft" button to ensure session data (annotations, ratings, split positions) is preserved across sessions. | P0 | **Planned** |
| **B.12** | As a reviewer, I want the system to remind me of my earlier findings so I can justify my final ratings with evidence.  | **Evidence-Driven Validation**: If "Needs Improvement" or "Exceeds" is selected, the system enforces a qualitative comment. The Evidence Bank displays prior annotations for that criterion to support the reviewer's decision and ensure ratings are fact-based. | P0 | **Revised** |
| **B.13** | As a reviewer, I must complete all criteria within a rubric module before submitting. | **Full-Rubric Completion Lock:** Final submission is disabled until every criterion within the selected rubric (e.g., Accessibility) is evaluated. | P0 | **Revised** |

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

1\. Executive Summary  
Block C focuses on the synthesis and delivery of expert feedback to the Author. It transforms raw evaluation data into an "Aggregated Report" and "Actionable Revision Cards." The goal is to provide a clear, evidence-based roadmap for the author to improve the OER until it meets the required certification standards.

**2\. Detailed User Flow (The Author & Coordinator Journey)**  
Step 1: Lead Mediation (The Gatekeeper)

* Action: Mark (Coordinator) receives a notification that a review is completed.  
* System Logic:  
  * The report enters the Mediation Queue.  
  * Mark reviews the expert's comments for professional tone and clarity.  
  * Mark clicks "Release to Author." The Resource status transitions from Under Review to In Revision or Feedback Released.

Step 2: Entering the Aggregated Report Mode

* Action: Sarah (Author) logs in and opens the "Feedback Report" from her dashboard.  
* System Logic:  
  * The system generates a Synthesized View of the review.  
  * Feedback is grouped by Rubric Area \> Criterion.  
  * For each Criterion, Sarah sees: (1) The Final Rating; (2) The Reviewer's Synthesized Comment; (3) The Evidence Bank (linked annotations).

Step 3: Navigating Evidence & Context

* Action: Sarah clicks on an annotation snippet in the report's Evidence Bank.  
* System Logic:  
  * The UI opens the Bi-directional Viewer. The left side scrolls to the exact location in the OER where the reviewer left the mark, providing immediate context for the requested change.

Step 4: Executing Revisions (Revision Cards)

* Action: Sarah focuses on items marked as Needs Improvement.  
* System Logic:  
  * Each Needs Improvement item is automatically presented as a Revision Card.  
  * Sarah can: (1) Mark the card as "Fixed" after updating her OER; (2) Add a "Response Comment" to explain her changes or seek clarification.

Step 5: Final Reflection & Certification

* Action: Once all major issues are addressed, Sarah submits her "Author Reflection" (a short summary of improvements).  
* System Logic:  
  * The Coordinator verifies the revisions.  
  * Upon approval, the system generates the Digital Stamp and a Public Validation Landing Page.

**3\. Functional Requirements Table**

| ID | User Story | Feature / Specification | Priority | Status |
| :---- | :---- | :---- | :---- | :---- |
| **C.1** | As a coordinator, I want to review feedback before the author sees it to ensure professional standards. | **Mediated Feedback Release:** A "Mediation Queue" for Leads to approve, edit, or flag reviewer comments before they are visible to authors. | P0 | Planned |
| **C.2** | As an author, I want to see all feedback in one structured place rather than hunting through notes. | **Aggregated Report View:** A hierarchical UI that organizes feedback by Rubric \-\> Criterion \-\> Rating \-\> Synthesized Comment. | P0 | Planned |
| **C.3** | As an author, I want to see the specific context of a reviewer's concern to understand how to fix it. | **Evidence-to-Content Linking:** Clicking a report evidence snippet triggers the OER viewer to scroll to the linked annotation anchor. | P0 | Planned |
| **C.4** | As an author, I want a clear To-Do list of required fixes to track my revision progress. | **Actionable Revision Cards:** Automated task cards generated from Needs Improvement ratings. Supports "Fixed/Resolved" status toggles. | P0 | Planned |
| **C.5** | As an author, I want to filter feedback to focus on specific issues (e.g., only Accessibility). | **Report Filtering & Sorting:** Ability to filter the report by rating level (e.g., "Show only Needs Improvement") or specific Rubric areas. | P1 | Planned |
| **C.6** | As an author, I want to explain how I addressed the feedback to the coordinator. | **Revision Response Logic:** A text field on each Revision Card for the author to document their changes or provide a rebuttal. | P1 | Planned |
| **C.7** | As an author, I want a summary of my learning to conclude the review process. | **Author Reflection Module:** A mandatory short-form text input at the end of the revision cycle for the author to summarize their experience. | P2 | Planned |
| **C.8** | As a coordinator, I want to issue a public-facing proof of quality once the review is successful. | **Digital Stamp Generation:** System creates a unique, verifiable badge/stamp linked to a public landing page displaying the review summary. | P1 | Planned |
| **C.9** | As an adopter (Educator), I want to verify if an OER is truly certified. | **Validation Landing Page:** A public-facing URL that showcases the OER metadata, the rubrics applied, and the final "Proficient" status. | P1 | Planned |

4\. Technical Architecture Principles

1. **Read-Only Evidence**: In Report Mode, the original reviewer annotations are immutable (CC BY-ND logic). The author can only add "Response" layers.  
2. **Version Awareness**: If a Revision Card is marked "Fixed," the system should ideally timestamp the state of the OER at that moment to prevent "verification drift."  
3. **Public/Private Separation**: The landing page (C.9) only shows the *Summary* of the review (Criteria passed), while specific critical annotations remain private between Author and Reviewers.

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