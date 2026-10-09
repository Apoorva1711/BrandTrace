# BRANDTRACE Hackathon Demonstration Script (3 Minutes)

**Demonstration Goal:** Present a concise, realistic demonstration of BRANDTRACE to hackathon judges, highlighting the core problem of brand impersonation and demonstrating how explainable deterministic risk scoring, official asset exclusion, and auditable analyst workflows operate.

---

### Segment 1: Introduction & Authentication (0:00 - 0:30)

1. **Opening Statement:**  
   *"Hello everyone. Brand impersonation on social media and app stores causes millions of dollars in phishing and consumer fraud every year. Today, we present **BRANDTRACE: Follow the Identity. Find the Risk.**"*
2. **Login to Enterprise Console:**  
   - Navigate to `http://localhost:5173/login`.
   - Use the pre-seeded analyst credentials:  
     **Email:** `analyst@brandtrace.local`  
     **Password:** `Analyst@1234`
   - Click **Enter Security Console**.
3. **Highlight:** Notice that we are logged into the isolated tenant environment for **Global Risk Corp**. Multi-tenant boundaries guarantee that organization telemetry is strictly segregated.

---

### Segment 2: Brand Configuration & Official Asset Exclusion (0:30 - 1:10)

1. **Navigate to Brand Profiles (`/brands`):**  
   - Open **ApexPay Technologies Inc.**
   - Show how the brand profile registers legal names, trademark aliases (`Apex Pay`, `ApexWallet`), verified domains (`apexpay.example.com`), and perceptual logo hashes.
2. **Navigate to Official Asset Registry (`/assets`):**  
   - Explain the core technical innovation: *Why doesn't BRANDTRACE flag the company's own official Twitter handle or Android app?*
   - Show registered assets:
     - `@ApexPayOfficial` on Twitter/X.
     - `com.apexpay.mobile` on Google Play.
     - `apexpay.example.com` primary website domain.
   - Point out that BRANDTRACE performs **Exact Match Exclusion** before calculating threat scores, completely eliminating false alarms on legitimate brand channels.

---

### Segment 3: Scan Execution & Explainable Threat Scoring (1:10 - 2:00)

1. **Trigger Real Scan (`Scan Center` or Top Navbar `Scan Now`):**  
   - Click **Scan Now** in the header.
   - Select **ApexPay** and choose **Full Scan (Social + Apps)**.
   - Click **Execute Real Scan**.
   - Watch the pipeline execute in real time: gathering candidate records from active adapters, evaluating strings with RapidFuzz and ImageHash, applying exclusion gates, and saving records to MongoDB.
2. **Show Scan Output:**  
   - Point out the metrics: Candidates Evaluated, Official Assets Excluded, and Active Threats Flagged.

---

### Segment 4: Threat Deep Dive & Mandatory Justification (2:00 - 2:40)

1. **Open Threat Detections Queue (`/detections`):**  
   - Show the live findings filtered by severity.
   - Click **Investigate** on finding **ApexPay Helpdesk / @ApexPay_Helpdesk24** (Critical Risk: 80+).
2. **Examine Explainable Telemetry:**  
   - Point to the point-by-point score breakdown:
     - **Name Similarity:** +27.0 pts (Brand name combined with support/helpdesk extension).
     - **Logo Similarity:** +25.0 pts (dHash perceptual similarity).
     - **Publisher Mismatch:** +8.0 pts (Low follower account claiming enterprise identity).
     - **Context Indicators:** +15.0 pts (Suspicious phrases: *reset password*, *unlock account*).
     - **External Redirection:** +10.0 pts (Bit.ly shortener pointing to credential harvester).
   - Explain: *"Notice that this is not an opaque AI black box. Every point is explainable and deterministic."*
3. **Analyst Workflow & False Positive Rule:**  
   - Click **Declare False Positive**.
   - Show that the system strictly **refuses** to dismiss a finding without a documented justification note.
   - Type: *"Verified legitimate third-party contractor operating under licensed service agreement."*
   - Submit the note and demonstrate the permanent audit history update.

---

### Segment 5: Reports Export & Wrap-up (2:40 - 3:00)

1. **Navigate to Reports & Exports (`/reports`):**  
   - Show the formatted executive briefing table.
   - Click **Export Detections CSV** and highlight the anti-formula-injection sanitization (`CWE-1236`).
   - Click **Print Report View** to demonstrate the clean print CSS layout.
2. **Concluding Statement:**  
   *"BRANDTRACE delivers practical, explainable, and accountable Digital Risk Protection. Thank you!"*
