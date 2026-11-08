import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  const outputPath = path.resolve(__dirname, "../ULAB_SETU_FEATURES_GUIDE.pdf");

  const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>ULAB Setu — Platform Features & Section Architecture Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 20mm 16mm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Plus Jakarta Sans', 'Hind Siliguri', sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Plus Jakarta Sans', 'Hind Siliguri', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    font-size: 9.5pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cover-banner {
    background: linear-gradient(135deg, #071e3d 0%, #1a365d 60%, #0c4a6e 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 22px;
    box-shadow: 0 4px 12px rgba(7, 30, 61, 0.15);
  }

  .brand-pill {
    display: inline-block;
    background: rgba(212, 175, 55, 0.2);
    border: 1px solid #d4af37;
    color: #fde047;
    font-size: 8pt;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .cover-title {
    font-size: 22pt;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .cover-subtitle {
    font-size: 10.5pt;
    font-weight: 500;
    color: #cbd5e1;
    margin-bottom: 14px;
    line-height: 1.4;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 12px;
    font-size: 8pt;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .meta-value {
    color: #ffffff;
    font-weight: 600;
    margin-top: 2px;
  }

  .meta-value a {
    color: #7dd3fc;
    text-decoration: none;
  }

  h2 {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    margin-top: 20px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h2 .badge {
    background: #0f172a;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 12px;
    margin-bottom: 4px;
  }

  p {
    margin-bottom: 8px;
    color: #334155;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  .feature-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0284c7;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }

  .feature-card.alumni {
    border-left-color: #d97706;
  }

  .feature-card.teacher {
    border-left-color: #8b5cf6;
  }

  .feature-card.admin {
    border-left-color: #059669;
  }

  .feature-card.security {
    border-left-color: #dc2626;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .card-title {
    font-weight: 700;
    font-size: 10pt;
    color: #0f172a;
  }

  .card-route {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    background: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    color: #334155;
    font-weight: 600;
  }

  .card-desc {
    font-size: 8.5pt;
    color: #475569;
    margin-bottom: 6px;
    line-height: 1.45;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .tag {
    font-size: 7pt;
    font-weight: 600;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #1e293b;
    padding: 2px 7px;
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8pt;
    page-break-inside: avoid;
  }

  th, td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 8pt;
  }

  tr:nth-child(even) td {
    background: #fafafa;
  }

  .code-pill {
    font-family: 'JetBrains Mono', monospace;
    font-size: 7.5pt;
    background: #f1f5f9;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
    color: #0f172a;
  }

  .alert-box {
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 8.5pt;
    color: #166534;
    margin: 12px 0;
    page-break-inside: avoid;
  }

  .alert-box.info {
    background: #f0f9ff;
    border-color: #7dd3fc;
    color: #0369a1;
  }
</style>
</head>
<body>

  <!-- COVER BANNER -->
  <div class="cover-banner">
    <div class="brand-pill">ULAB Setu Architecture & Feature Handbook</div>
    <div class="cover-title">ULAB Setu (ইউল্যাব সেতু)</div>
    <div class="cover-subtitle">
      Comprehensive Feature Catalog, Portal Architecture & Functional Directory for Students, Alumni, Faculty, and Administrators.
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">Live Platform</span>
        <span class="meta-value"><a href="https://ulab-setu.vercel.app/">ulab-setu.vercel.app</a></span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Repository</span>
        <span class="meta-value">github.com/pavel-hasan-joy/ulab-setu</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Framework & Stack</span>
        <span class="meta-value">Next.js 16 • React 19 • Prisma • TS</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date & Revision</span>
        <span class="meta-value">November 2026 • Verified Production</span>
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY -->
  <div class="avoid-break">
    <h2><span class="badge">01</span> Executive Overview (প্ল্যাটফর্ম পরিচিতি)</h2>
    <p>
      <strong>ULAB Setu (ইউল্যাব সেতু)</strong> হলো ইউনিভার্সিটি অব লিবারেল আর্টস বাংলাদেশ (ULAB)-এর শিক্ষার্থী, প্রাক্তন শিক্ষার্থী (Alumni), শিক্ষক (Faculty) এবং প্রশাসনিক টিমের (Administration) মধ্যকার একটি সমন্বিত একাডেমিক ও পেশাগত নেটওয়ার্কিং প্ল্যাটফর্ম।
    </p>
    <p>
      প্ল্যাটফর্মটি ফ্রিল্যান্স জবের ভিড়ে হারিয়ে না গিয়ে সম্পূর্ণ প্রাতিষ্ঠানিক পরিচয়-ভেরিফাইড (ULAB Institutional Domain @ulab.edu.bd ও ওটিপি ভেরিফিকেশন) একটি বিশ্বস্ত ইকোসিস্টেম গড়ে তোলে, যেখানে শিক্ষার্থীরা সরাসরি সিনিয়র অ্যালামনাইদের মেন্টর হিসেবে পেতে পারে, এক্সক্লুসিভ চাকরির সুযোগে আবেদন করতে পারে, এবং ফ্যাকাল্টি মেম্বাররা একাডেমিক অ্যাডভাইজিং প্রদান করতে পারেন।
    </p>
  </div>

  <!-- ROLE MATRIX -->
  <div class="avoid-break">
    <h2><span class="badge">02</span> User Roles & Permission Matrix (ভূমিকা ও পারমিশন ম্যাট্রিক্স)</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">User Role (রোল)</th>
          <th style="width: 20%;">Core Purpose (মূল উদ্দেশ্য)</th>
          <th style="width: 32%;">Primary Accessible Portals</th>
          <th style="width: 30%;">Key Capabilities</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>STUDENT (শিক্ষার্থী)</strong></td>
          <td>ক্যারিয়ার প্রস্তুতি, চাকরি সন্ধান ও মেন্টরশিপ গ্রহণ।</td>
          <td><span class="code-pill">/student/*</span>, <span class="code-pill">/student/mentors</span>, <span class="code-pill">/student/jobs</span>, <span class="code-pill">/student/tuitions</span></td>
          <td>অ্যালামনাই সার্চ, ওয়ান-ক্লিক জব অ্যাপ্লিকেশন, মেন্টরশিপ রিকোয়েস্ট, সরাসরি মেসেজিং ও টিউশন খুঁজে নেওয়া।</td>
        </tr>
        <tr>
          <td><strong>ALUMNI (প্রাক্তন শিক্ষার্থী)</strong></td>
          <td>জুনিয়রদের দিকনির্দেশনা, সার্কুলার পোস্টিং ও হায়ার করা।</td>
          <td><span class="code-pill">/alumni/*</span>, <span class="code-pill">/alumni/jobs</span>, <span class="code-pill">/alumni/mentorship</span>, <span class="code-pill">/alumni/board</span></td>
          <td>চাকরি ও ইন্টার্নশিপ সার্কুলার তৈরি, মেন্টি আবেদন রিভিউ ও শিডিউল, প্রাতিষ্ঠানিক টিউশন পোস্ট ও নেটওয়ার্কিং।</td>
        </tr>
        <tr>
          <td><strong>TEACHER / FACULTY (শিক্ষক)</strong></td>
          <td>একাডেমিক সুপারভিশন, গবেষণা নির্দেশনা ও সুযোগ শেয়ার।</td>
          <td><span class="code-pill">/teacher/*</span>, <span class="code-pill">/teacher/mentorship</span>, <span class="code-pill">/teacher/jobs</span></td>
          <td>থিসিস ও রিসার্চ মেন্টরশিপ, রিসার্চ অ্যাসিস্ট্যান্ট নিয়োগ, উচ্চশিক্ষা পরামর্শ প্রদান ও প্রাতিষ্ঠানিক নোটিস ভিউ।</td>
        </tr>
        <tr>
          <td><strong>ADMIN (প্রশাসক)</strong></td>
          <td>প্ল্যাটফর্ম গভর্নেন্স, নিরাপত্তা, ইউজার রিভিউ ও সিস্টেম কনফিগ।</td>
          <td><span class="code-pill">/admin/*</span>, <span class="code-pill">/admin/users</span>, <span class="code-pill">/admin/jobs</span>, <span class="code-pill">/admin/settings</span></td>
          <td>অ্যালামনাই ভেরিফিকেশন, জব মডারেশন, সিস্টেম সেটিংস কনফিগারেশন, অডিট লগ ও এনালাইটিক্স এক্সপোর্ট।</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- PORTAL 1: AUTH & ONBOARDING -->
  <h2><span class="badge">03</span> Authentication, Security & Public Gateway</h2>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">1. Interactive Landing Experience & Showcase</span>
      <span class="card-route">GET /</span>
    </div>
    <div class="card-desc">
      হোমপেজে আধুনিক থ্রি-জেএস অ্যানিমেশন এবং রেস্পন্সিভ লেআউটের সমন্বয়ে পুরো প্ল্যাটফর্মের কার্যকারিতা তুলে ধরা হয়েছে। শিক্ষার্থীরা এখান থেকেই সরাসরি "Find your mentor" বাটনের মাধ্যমে মেন্টর ডিরেক্টরিতে প্রবেশ করতে পারে, টপ স্টোরিজ এবং প্ল্যাটফর্মের সার্বিক নেটওয়ার্ক পরিসংখ্যান দেখতে পারে।
    </div>
    <div class="tag-list">
      <span class="tag">Three.js Sky FX</span>
      <span class="tag">Find Mentor Quick Link</span>
      <span class="tag">Featured Mentors</span>
      <span class="tag">Success Stories</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">2. Domain-Enforced Signup & OTP Verification</span>
      <span class="card-route">GET /signup • POST Server Action</span>
    </div>
    <div class="card-desc">
      নিরাপত্তা নিশ্চিত করতে প্রতিটি রেজিস্ট্রেশনের সময় শুধুমাত্র অফিসিয়াল <span class="code-pill">@ulab.edu.bd</span> প্রাতিষ্ঠানিক ইমেইল গ্রহণ করা হয়। স্বয়ংক্রিয় ওটিপি (One-Time Password) জেনারেট হয়ে মেইলে পৌঁছায় এবং ওটিপি যাচাইকরণের মাধ্যমে ভুয়া একাউন্ট তৈরি বন্ধ থাকে।
    </div>
    <div class="tag-list">
      <span class="tag">@ulab.edu.bd Domain Guard</span>
      <span class="tag">6-Digit Cryptographic OTP</span>
      <span class="tag">Nodemailer Transactional Gateway</span>
      <span class="tag">Role-Based Form</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">3. Stateless Session Guard & Role Routing</span>
      <span class="card-route">GET /login • Middleware Guard</span>
    </div>
    <div class="card-desc">
      Jose ক্রিপ্টোগ্রাফি দিয়ে তৈরি স্টেটলেস HS256 JWT কুকি (<span class="code-pill">ulab_session</span>)-এর মাধ্যমে সুরক্ষিত সেশন পরিচালিত হয়। কোনো ইউজার লগইন করার সাথে সাথে তার রোল অনুযায়ী যথাক্রমে <span class="code-pill">/student</span>, <span class="code-pill">/alumni</span>, <span class="code-pill">/teacher</span> বা <span class="code-pill">/admin</span> পোর্টালে স্বয়ংক্রিয়ভাবে রিডাইরেক্ট করা হয়।
    </div>
    <div class="tag-list">
      <span class="tag">HttpOnly Safe Cookies</span>
      <span class="tag">10-Round Bcrypt Hashing</span>
      <span class="tag">Brute-Force Lockout Defense</span>
      <span class="tag">Auto Role Dispatch</span>
    </div>
  </div>

  <!-- PORTAL 2: STUDENT PORTAL -->
  <h2><span class="badge">04</span> Student Portal Features (শিক্ষার্থী পোর্টাল)</h2>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">1. Student Central Dashboard</span>
      <span class="card-route">GET /student</span>
    </div>
    <div class="card-desc">
      শিক্ষার্থীদের পার্সোনালাইজড ড্যাশবোর্ড; এখানে সক্রিয় মেন্টরশিপের আপডেট, নতুন প্রকাশিত জব অ্যালার্ট, প্রস্তাবিত টিউশন এবং ক্যাম্পাসের সাম্প্রতিক নোটিস এক নজরে প্রদর্শিত হয়।
    </div>
    <div class="tag-list">
      <span class="tag">Application Tracker Widget</span>
      <span class="tag">Active Mentorship Status</span>
      <span class="tag">Top Recommended Jobs</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">2. Alumni & Mentor Discovery Directory</span>
      <span class="card-route">GET /student/mentors • GET /student/alumni</span>
    </div>
    <div class="card-desc">
      শিক্ষার্থীরা ডিপার্টমেন্ট (যেমন: CSE, BBA, MSJ, English), কর্মরত কোম্পানি (যেমন: Google, bKash, Brain Station 23), ব্যাচ নম্বর এবং দক্ষতার ভিত্তিতে ভেরিফাইড অ্যালামনাই মেন্টরদের খুঁজে বের করতে পারে।
    </div>
    <div class="tag-list">
      <span class="tag">Multi-Filter Search</span>
      <span class="tag">Batch Footer Display</span>
      <span class="tag">Expertise Badges</span>
      <span class="tag">1-Click Profile View</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">3. Mentorship Application & 1-on-1 Communication</span>
      <span class="card-route">GET /student/mentorship • /student/mentorship-messages</span>
    </div>
    <div class="card-desc">
      শিক্ষার্থী তার ক্যারিয়ার লক্ষ্য ও নির্দিষ্ট প্রশ্ন উল্লেখ করে পছন্দের মেন্টরকে রিকোয়েস্ট পাঠাতে পারে। মেন্টর রিকোয়েস্ট গ্রহণ করলে উভয়ের মধ্যে রিয়েল-টাইম চ্যাট ও বার্তা আদান-প্রদান উন্মুক্ত হয়।
    </div>
    <div class="tag-list">
      <span class="tag">Mentorship Goal Pitch</span>
      <span class="tag">Status Timeline (Pending/Accepted)</span>
      <span class="tag">Direct Messaging Client</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">4. Job Search & Application Tracking CRM</span>
      <span class="card-route">GET /student/jobs • GET /student/applications</span>
    </div>
    <div class="card-desc">
      অ্যালামনাই ও শিক্ষকদের পোস্ট করা পূর্ণকালীন চাকরি, পার্ট-টাইম সুযোগ ও ইন্টার্নশিপে শিক্ষার্থীরা সিভি আপলোড বা কভার লেটার সহ আবেদন করতে পারে। আবেদনের স্ট্যাটাস (Reviewing, Shortlisted, Selected) রিয়েল-টাইমে ট্র্যাক করা যায়।
    </div>
    <div class="tag-list">
      <span class="tag">Salary Transparency Badge</span>
      <span class="tag">Resume Upload</span>
      <span class="tag">Live Status Stepper</span>
      <span class="tag">External Job Portal Links</span>
    </div>
  </div>

  <div class="feature-card">
    <div class="card-header">
      <span class="card-title">5. Tuition & Teaching Assistance Hub</span>
      <span class="card-route">GET /student/tuitions</span>
    </div>
    <div class="card-desc">
      বিশ্ববিদ্যালয়ে পড়াকালীন অর্থনৈতিক স্বাবলম্বিতা অর্জনের জন্য অ্যালামনাই ও টিচারদের পরিবারের জন্য পোস্ট করা হোম টিউশন বা টিচিং অ্যাসিস্ট্যান্টশিপের তালিকা এবং আবেদনের সুযোগ।
    </div>
    <div class="tag-list">
      <span class="tag">Class/Subject Filter</span>
      <span class="tag">Remuneration Details</span>
      <span class="tag">Location/Campus Proximity</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PORTAL 3: ALUMNI PORTAL -->
  <h2><span class="badge">05</span> Alumni Portal Features (প্রাক্তন শিক্ষার্থী পোর্টাল)</h2>

  <div class="feature-card alumni">
    <div class="card-header">
      <span class="card-title">1. Alumni Command Dashboard</span>
      <span class="card-route">GET /alumni</span>
    </div>
    <div class="card-desc">
      অ্যালামনাইদের ড্যাশবোর্ডে তাদের মেন্টরিং প্রভাব, মেন্টিদের তালিকা, পোস্ট করা চাকরির পারফরম্যান্স এবং ক্যাম্পাস নোটিস বোর্ড প্রদর্শিত হয়।
    </div>
    <div class="tag-list">
      <span class="tag">Mentorship Overview</span>
      <span class="tag">Job Views & Applicants Count</span>
      <span class="tag">Verified Official Alumni Badge</span>
    </div>
  </div>

  <div class="feature-card alumni">
    <div class="card-header">
      <span class="card-title">2. Job Recruitment & Applicant Screening CRM</span>
      <span class="card-route">GET /alumni/jobs • /alumni/jobs/new • /alumni/jobs/[id]</span>
    </div>
    <div class="card-desc">
      অ্যালামনাইরা তাদের কোম্পানিতে শূন্যপদের জন্য সার্কুলার তৈরি ও এডিট করতে পারেন। আবেদনকারী শিক্ষার্থীদের সিভি দেখা, স্ট্যাটাস পরিবর্তন করা (Shortlisted / Rejected / Hired) এবং সরাসরি যোগাযোগ করা যায়।
    </div>
    <div class="tag-list">
      <span class="tag">Job Posting Creator</span>
      <span class="tag">Applicant Review Table</span>
      <span class="tag">CV/Resume Viewer</span>
      <span class="tag">Status Update Actions</span>
    </div>
  </div>

  <div class="feature-card alumni">
    <div class="card-header">
      <span class="card-title">3. Mentorship Management & Mentee Guidance</span>
      <span class="card-route">GET /alumni/mentorship • /alumni/mentorship-messages</span>
    </div>
    <div class="card-desc">
      অ্যালামনাইরা তাদের মেন্টরশিপ প্রাপ্যতা (সপ্তাহে কয়টি সেশন, কোন বিষয়ে পরামর্শ) কনফিগার করতে পারেন এবং শিক্ষার্থীদের আবেদনপত্র গ্রহণ বা প্রত্যাখ্যান করতে পারেন।
    </div>
    <div class="tag-list">
      <span class="tag">Accept/Decline Controls</span>
      <span class="tag">Mentee Goal Review</span>
      <span class="tag">Chat Thread with Students</span>
    </div>
  </div>

  <div class="feature-card alumni">
    <div class="card-header">
      <span class="card-title">4. Alumni Networking & Tuition Postings</span>
      <span class="card-route">GET /alumni/board • GET /alumni/tuitions</span>
    </div>
    <div class="card-desc">
      সহপাঠী বা অন্যান্য ব্যাচের অ্যালামনাইদের সাথে কানেক্ট হওয়া এবং পরিবারের সদস্যদের জন্য দক্ষ ইউল্যাব ছাত্র-ছাত্রীদের গৃহশিক্ষক হিসেবে নেওয়ার বিজ্ঞাপন দেওয়ার সুবিধা।
    </div>
    <div class="tag-list">
      <span class="tag">Post Tuition Ad</span>
      <span class="tag">Alumni Network Feed</span>
      <span class="tag">Direct Communication</span>
    </div>
  </div>

  <!-- PORTAL 4: TEACHER / FACULTY PORTAL -->
  <h2><span class="badge">06</span> Faculty / Teacher Portal Features (শিক্ষক পোর্টাল)</h2>

  <div class="feature-card teacher">
    <div class="card-header">
      <span class="card-title">1. Faculty Advisory & Research Hub</span>
      <span class="card-route">GET /teacher • GET /teacher/mentorship</span>
    </div>
    <div class="card-desc">
      শিক্ষকরা তাদের রিসার্চ ফিল্ড, পাবলিকেশন ও থিসিস সুপারভিশন সংক্রান্ত তথ্য শেয়ার করতে পারেন। শিক্ষার্থীরা তাদের সাথে থিসিস প্রজেক্ট বা উচ্চশিক্ষার গাইডেন্স নেওয়ার জন্য মেন্টরশিপ রিকোয়েস্ট পাঠাতে পারে।
    </div>
    <div class="tag-list">
      <span class="tag">Academic Mentorship</span>
      <span class="tag">Research Guidance</span>
      <span class="tag">Advising Chat</span>
    </div>
  </div>

  <div class="feature-card teacher">
    <div class="card-header">
      <span class="card-title">2. Research Assistant & Teaching Opportunities</span>
      <span class="card-route">GET /teacher/jobs • GET /teacher/jobs/new</span>
    </div>
    <div class="card-desc">
      বিশ্ববিদ্যালয়ের ডিপার্টমেন্টাল রিসার্চ অ্যাসিস্ট্যান্ট (RA), টিচিং অ্যাসিস্ট্যান্ট (TA) বা ল্যাব প্রজেক্টের জন্য উপযুক্ত মেধাবী শিক্ষার্থীদের সরাসরি নিয়োগ বিজ্ঞপ্তি প্রকাশ ও অ্যাপ্লিকেশন রিভিউ করার সুবিধা।
    </div>
    <div class="tag-list">
      <span class="tag">RA/TA Recruitment</span>
      <span class="tag">Student Merit Screening</span>
      <span class="tag">Campus Project Grants</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- PORTAL 5: ADMINISTRATOR CONSOLE -->
  <h2><span class="badge">07</span> Administrator Console & Governance Features (প্রশাসক কনসোল)</h2>

  <div class="feature-card admin">
    <div class="card-header">
      <span class="card-title">1. Executive Overview & 100% Balanced Network Analytics</span>
      <span class="card-route">GET /admin</span>
    </div>
    <div class="card-desc">
      প্ল্যাটফর্মের সার্বিক ইউজার অনুপাত (Students, Alumni, Faculty, Staff) সুষম ১০০% গাণিতিক হারে প্রদর্শিত হয়। এছাড়া ভেরিফাইড অ্যালামনাই কাভারেজ, সাম্প্রতিক রেজিস্ট্রেশন এবং চাকরির সার্কুলারের লাইভ মেট্রিক্স দৃশ্যমান।
    </div>
    <div class="tag-list">
      <span class="tag">100% Exact Role Distribution</span>
      <span class="tag">Verified Alumni Metric</span>
      <span class="tag">Live Activity Feed</span>
    </div>
  </div>

  <div class="feature-card admin">
    <div class="card-header">
      <span class="card-title">2. User Directory, Verification & Pre-Approval CRM</span>
      <span class="card-route">GET /admin/users • GET /admin/alumni • GET /admin/admins</span>
    </div>
    <div class="card-desc">
      প্রতিটি ইউজারের প্রোফাইল পর্যবেক্ষণ, অ্যালামনাইদের সার্টিফিকেট বা রোল ভেরিফিকেশন, এবং রেজিস্ট্রারের সমাবর্তন তালিকা (CSV) আপলোড করে শিক্ষার্থীদের ওয়ান-ক্লিক প্রি-ভেরিফাই করার স্বয়ংক্রিয় টুল।
    </div>
    <div class="tag-list">
      <span class="tag">1-Click Verify Alumni</span>
      <span class="tag">Role Modification</span>
      <span class="tag">CSV Convocation Roster Ingestion</span>
      <span class="tag">Account Suspension</span>
    </div>
  </div>

  <div class="feature-card admin">
    <div class="card-header">
      <span class="card-title">3. Job & Opportunity Moderation Engine</span>
      <span class="card-route">GET /admin/jobs • GET /admin/applications</span>
    </div>
    <div class="card-desc">
      প্ল্যাটফর্মে পোস্ট করা সব চাকরির সার্কুলার পর্যবেক্ষণ, অনুমোদন (Approve), প্রয়োজনবোধে রিজেক্ট বা ড্রাফট করার পূর্ণ ক্ষমতা। ক্যাম্পাসের শিক্ষার্থীদের নিরাপত্তা রক্ষায় কোনো ভুয়া বা অননুমোদিত অফার প্রতিহত করা।
    </div>
    <div class="tag-list">
      <span class="tag">Job Approval Queue</span>
      <span class="tag">Employer Verification</span>
      <span class="tag">Application Oversight</span>
    </div>
  </div>

  <div class="feature-card admin">
    <div class="card-header">
      <span class="card-title">4. System Settings & Governance Policy Console</span>
      <span class="card-route">GET /admin/settings • POST Server Action</span>
    </div>
    <div class="card-desc">
      কোনো কোড পরিবর্তন ছাড়াই রিয়েল-টাইমে ডাটাবেজ ব্যাকড গ্লোবাল সেটিংস পরিবর্তনের শক্তিশালী কনসোল। এতে ৫টি সুসংগঠিত ক্যাটাগরিতে মোট ১৮টি গুরুত্বপূর্ণ সেটিংস রয়েছে:
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 28%;">Settings Category</th>
          <th style="width: 32%;">Key Configuration Parameters</th>
          <th style="width: 40%;">Operational Impact (বাস্তব প্রভাব)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Platform Information</strong></td>
          <td><span class="code-pill">platform_name</span>, <span class="code-pill">platform_tagline</span>, <span class="code-pill">support_email</span>, <span class="code-pill">contact_phone</span>, <span class="code-pill">maintenance_mode</span>, <span class="code-pill">announcement_banner</span>, <span class="code-pill">enforce_ulab_domain</span></td>
          <td>ব্র্যান্ডের নাম, জরুরি ঘোষণা ব্যানার, মেইনটেন্যান্স মোড এবং @ulab.edu.bd প্রাতিষ্ঠানিক ইমেইল বাধ্যতামূলক করার নীতি।</td>
        </tr>
        <tr>
          <td><strong>2. User Privacy Settings</strong></td>
          <td><span class="code-pill">allow_alumni_directory_indexing</span>, <span class="code-pill">mask_phone_numbers_by_default</span>, <span class="code-pill">direct_messaging_policy</span></td>
          <td>অ্যালামনাই সার্চ সুবিধা চালু/বন্ধ রাখা, ফোন নম্বর গোপন রাখা এবং পারস্পরিক মেসেজিং এক্সেস নিয়ন্ত্রণ।</td>
        </tr>
        <tr>
          <td><strong>3. Roles & Permissions</strong></td>
          <td><span class="code-pill">alumni_auto_approval</span>, <span class="code-pill">student_monthly_application_limit</span>, <span class="code-pill">faculty_mentor_eligibility</span>, <span class="code-pill">preapproved_alumni_import_enabled</span></td>
          <td>অফিসিয়াল ওটিপি মিললে সরাসরি অ্যাপ্রুভাল, মাসিক আবেদনের সর্বোচ্চ সীমা (স্প্যাম প্রতিরোধ) এবং শিক্ষক মেন্টরশিপ অনুমোদন।</td>
        </tr>
        <tr>
          <td><strong>4. Job Configuration</strong></td>
          <td><span class="code-pill">require_salary_range</span></td>
          <td>সার্কুলারগুলোতে বেতনের পরিমাণ বা নেগোশিয়েবল ট্যাগ প্রদান বাধ্যতামূলক করা।</td>
        </tr>
        <tr>
          <td><strong>5. Security & Cryptography</strong></td>
          <td><span class="code-pill">max_login_attempts</span>, <span class="code-pill">lockout_duration_minutes</span>, <span class="code-pill">enforce_password_complexity</span></td>
          <td>ভুল পাসওয়ার্ড দিলে ৫ বারের পর ১৫ মিনিটের জন্য একাউন্ট সাময়িক লক করা ও শক্তিশালী পাসওয়ার্ড সুরক্ষা।</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="feature-card admin">
    <div class="card-header">
      <span class="card-title">5. Audit Logs, Reports & Campus Broadcasts</span>
      <span class="card-route">GET /admin/audit-logs • /admin/reports • /admin/notices</span>
    </div>
    <div class="card-desc">
      প্ল্যাটফর্মের প্রতিটি গুরুত্বপূর্ণ কাজের (অ্যাডমিন সেটিংস পরিবর্তন, রোল আপডেট, জব অনুমোদন) ডিজিটাল অডিট ট্রেইল তৈরি এবং সিএসভি বা এক্সেল ফরম্যাটে রিপোর্ট এক্সপোর্ট করার স্বয়ংক্রিয় টুল।
    </div>
    <div class="tag-list">
      <span class="tag">Immutable Audit Trails</span>
      <span class="tag">CSV/PDF Report Export</span>
      <span class="tag">Campuswide Notice Dispatch</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TECHNICAL SUMMARY & ARCHITECTURE -->
  <h2><span class="badge">08</span> Technology Stack & Architecture Reference</h2>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Architecture Tier</th>
        <th style="width: 35%;">Engine / Framework</th>
        <th style="width: 40%;">Production Specification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Framework</strong></td>
        <td>Next.js 16.3.6 (App Router) + React 19</td>
        <td>React Server Components (RSC), Turbopack, Zero Client Waterfall, Streaming Suspense.</td>
      </tr>
      <tr>
        <td><strong>Design & Styling</strong></td>
        <td>Tailwind CSS v4 + Motion v13</td>
        <td>Custom CSS design tokens, institutional ULAB Navy & Gold palette, dark/light theme persistence.</td>
      </tr>
      <tr>
        <td><strong>Database & Data Layer</strong></td>
        <td>PostgreSQL + Prisma ORM 6.19.3</td>
        <td>16 Relational Models, strict foreign keys, multi-column indexes, transactional operations.</td>
      </tr>
      <tr>
        <td><strong>Security & Sessions</strong></td>
        <td>Jose (JWT HS256) + Bcryptjs</td>
        <td>HttpOnly SameSite cookies, CSRF defenses, brute force lockout, salt-10 password hashing.</td>
      </tr>
      <tr>
        <td><strong>Transactional Mailer</strong></td>
        <td>Nodemailer Gateway</td>
        <td>Institutional email templates for 6-digit OTP delivery, notifications & status updates.</td>
      </tr>
      <tr>
        <td><strong>CI/CD & Live Hosting</strong></td>
        <td>GitHub Actions + Vercel Edge</td>
        <td>Automated linting, Prisma client generation, database migration testing, Playwright E2E test suite.</td>
      </tr>
    </tbody>
  </table>

  <div class="alert-box">
    <strong>দালিলিক নিশ্চয়তা (Quality Assurance):</strong><br>
    এই ফিচার গাইডলাইনটি প্ল্যাটফর্মের সক্রিয় কোডবেস এবং লাইভ প্রোডাকশন ডিপ্লয়মেন্ট (<a href="https://ulab-setu.vercel.app/" style="color: #166534; font-weight: bold;">ulab-setu.vercel.app</a>)-এর সর্বশেষ সংস্করণ অনুসারে সংকলিত ও ভেরিফাই করা হয়েছে।
  </div>

  <div style="text-align: center; margin-top: 24px; font-size: 8pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    <strong>ULAB Setu</strong> — University of Liberal Arts Bangladesh • Internal Technical & Product Documentation
  </div>

</body>
</html>`;

  console.log("Launching headless browser via Playwright (channel: chrome)...");
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle" });

  console.log("Generating high-definition vector PDF...");
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      bottom: "16mm",
      left: "14mm",
      right: "14mm",
    },
  });

  await browser.close();
  console.log(`PDF successfully generated at: ${outputPath}`);
}

generatePDF().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
