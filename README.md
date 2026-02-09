# Applyr – AI-Powered Job Application Automation Tool

**Applyr** is an AI-powered job application automation platform designed to help early-career job seekers save time, reduce repetitive work, and manage applications efficiently. The tool primarily operates as a **Chrome extension** and integrates with a web portal for onboarding and resume upload.

---

## 🚀 Product Overview

* **Target Users:** Early-career job seekers

* **Problem:** Job applications are repetitive, fragmented, and time-consuming. Users must re-enter the same information across multiple platforms and manually track applications.

* **Impact:** Inefficiency, wasted time, and poor application tracking.

* **Vision:** Automate and streamline the end-to-end job application process, starting with autofill and AI-assisted descriptive answers.

* **V1 Goal:** Reduce the time spent per job application while maintaining accuracy and user control.

* **Success Criteria:** Users rely on Applyr to manage and submit mass job applications effectively.

---

## 🧩 Core Features (MVP)

### 1. Autofill & Form Handling

* Autofill standard input fields (text, dropdowns, radio buttons)
* Support for all text-based descriptive questions
* Unfilled or low-confidence fields remain blank for manual review

### 2. AI-Assisted Descriptive Answers

* AI generates answers to text-based questions using user resume data
* Direct editing and review of AI-generated answers
* Ensures user retains control before submission

### 3. Application Tracking

* Automatic saving of applied job details, including:

  * Company name
  * Role
  * Job description
  * Applied date
  * Status
  * AI-generated answers

### 4. Data Security & Storage

* Cloud-based storage of user resumes and application data
* Data is used only for inference
* GDPR-compliant handling of sensitive information

---

## ⚙️ Technical Details

* **Platform:** Chrome extension + Web onboarding portal
* **Supported File Types:** PDF, DOCX resumes
* **AI Model:** LLM for text-based question generation
* **Response Time:** 2–5 seconds per field
* **Non-Supported Features:** Assessments, additional file uploads, interview prep, resume tailoring, reminders, calendar integration

---

## 🛠 Architecture & Design Considerations

* **Form Variability:** Handles multiple HTML form structures; AI falls back gracefully if fields cannot be parsed
* **LLM Dependency:** AI accuracy balanced with speed; fallback ensures no automatic wrong entries
* **Cloud Infrastructure:** Stores resumes and application data securely
* **Chrome Extension:** Seamless integration into the user’s job application workflow

---

## ⚠️ Risks & Constraints

* **API Limitations:** Risk of LLM API key exhaustion
* **Human Review Dependency:** Over-reliance may reduce automation efficiency
* **Assumptions:** Users trust sharing resume data; users can install and use Chrome extensions
* **Legal:** Compliance with platform Terms of Service required

---

## 📈 Metrics & Analytics

* **Primary Metrics:**

  * Time saved per application
  * Number of applications completed per user
* **Secondary Metrics:**

  * AI answer acceptance rate
* **Validation:** Active users and jobs applied per user
* **Feedback:** In-app surveys for usability and feature improvement

---

## 👣 User Journey

1. Sign up on the web portal
2. Upload resume in PDF/DOCX format
3. Install the Chrome extension
4. Apply to jobs with:

   * Auto-filled forms
   * AI-generated answers to descriptive questions
   * Automatic saving of application details
5. Review AI suggestions and submit applications

---

## 📝 User Stories

* Upload resume once to avoid repetitive data entry
* Auto-fill job application forms for faster submissions
* AI-generated answers for descriptive questions
* Review and edit AI answers before submission
* Automatic tracking of all applied jobs
* Leave low-confidence AI fields blank for manual input
* Secure storage of resume and personal data
* Seamless Chrome extension integration

---

## 🌍 Launch & Rollout

* **Initial Launch:** Friends and internal users
* **Platform:** Chrome extension (V1)
* **Geography:** India
* **Future Roadmap:**

  * Enhanced autofill support
  * Improved AI answer accuracy
  * Advanced application management

---

