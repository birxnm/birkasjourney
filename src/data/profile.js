/*
 * profile.js — Everything the page says, in one place.
 *
 * Components only lay this out. To add a project, a role, or an award, add an
 * entry here; no markup changes needed. Text is taken from the CV — keep the
 * two in sync rather than inventing numbers here.
 */

export const person = {
  name: "Birkhanym Kazhymukhamet",
  short: "Birka",
  role: "Software engineer & AI builder",
  location: "Astana, Kazakhstan",
  year: "2026",
  tagline:
    "I build AI products for Kazakhstan — from RAG pipelines and Kazakh-speaking avatars to full-stack platforms — and take them from a hackathon idea to a global stage.",
  email: "k.birkhanym@gmail.com",
  phone: "+7 700 141 0206",
  /* Files in public/, prefixed with the build base so a subfolder deploy works.
     Swap photoHero for a transparent PNG to get the cut-out look. */
  photoHero: `${import.meta.env.BASE_URL}photo-hero.jpg`,
  photoSmall: `${import.meta.env.BASE_URL}photo-small.jpg`,
  /* Shown in the contact block, in this order. */
  contacts: [
    { label: "+7 700 141 0206", href: "tel:+77001410206" },
    { label: "k.birkhanym@gmail.com", href: "mailto:k.birkhanym@gmail.com" },
    { label: "linkedin / Birkhanym Kazhymukhamet", href: "https://www.linkedin.com/in/birkhanym-kazhymukhamet-668261337/" },
    { label: "@birxnm", href: "https://www.instagram.com/birxnm/" },
    { label: "@1xnym_", href: "https://www.instagram.com/1xnym_/" },
    { label: "github / birxnm", href: "https://github.com/birxnm" },
  ],
  github: "https://github.com/birxnm",
};

/* The four headline numbers under the hero. */
export const stats = [
  { value: "1 / 6,000", label: "Top student, Astana IT University 2026" },
  { value: "Top 4", label: "Enactus World Cup — first KZ team in 30 years" },
  { value: "2 / 1,800", label: "Meta Llama Accelerator teams" },
  { value: "12 h → 10 s", label: "Clinical decision time with CortexAI" },
];

export const about = [
  "I'm a Software Engineering student at Astana IT University with a minor in Finance (GPA 3.67/4.00, Dean's List) and a resident of Tomorrow School's AI Developer & Engineering program at Astana Hub.",
  "Most of my work sits where AI meets a real problem: medicine, culture, tourism, and the Kazakh language, which still has too few AI tools. I like owning the whole path — model, backend, interface, and the pitch.",
];

export const projects = [
  {
    name: "CortexAI",
    period: "2024 — now",
    role: "CPO & AI Engineer",
    color: "pink",
    summary:
      "An ML platform that predicts kidney transplant rejection from genetic profiling and clinical biomarkers. RAG pipelines cut clinical decision time from 12 hours to 10 seconds.",
    highlights: ["Top 4, Enactus World Cup 2025", "NVIDIA Inception — Top 3 of 80", "GSEA World Finalist", "Featured by Digital Kazakhstan"],
    stack: ["Python", "ML", "RAG", "LLMs"],
  },
  {
    name: "Back2Roots",
    period: "2025",
    role: "Founder & Full-Stack Developer",
    color: "paper",
    summary:
      "An AI tourism platform with a digital avatar city guide built on Llama and KazLLM, using a RAG architecture with real-time speech in and out.",
    highlights: ["2nd of 1,800 teams, Meta Llama Accelerator", "500,000 KZT prize"],
    stack: ["Llama", "KazLLM", "RAG", "STT / TTS"],
  },
  {
    name: "QazaqArt.kz",
    period: "2025 — now",
    role: "CTO & IT Lead",
    color: "ink",
    href: "https://qazaqart.kz",
    summary:
      "A creative ecosystem that helps Kazakh artists build sustainable businesses. I lead the platform, including creator portfolios and the artwork gallery.",
    highlights: ["300+ active users in one month", "Partners: British Council, UN SDG Creative Festival", "Top 10, IT Queen KZ"],
    stack: ["Django", "Vue.js", "PostgreSQL"],
  },
  {
    name: "Kazakh holographic AI avatar",
    period: "2024 — 2025",
    role: "Research Assistant, IEEE Student Branch",
    color: "pink",
    summary:
      "A Kazakh-speaking holographic avatar for VR education. I built MetaHuman characters with Audio2Face animation in Unreal Engine and wired in Kazakh STT/TTS and a document Q&A module.",
    highlights: ["Only first-year student on the team", "IEEE paper in progress"],
    stack: ["Unreal Engine", "MetaHuman", "Audio2Face", "RAG"],
  },
  {
    name: "Birka's Journey",
    period: "2026",
    role: "Solo project",
    color: "paper",
    href: "https://github.com/birxnm/birkasjourney/tree/archive/birkas-journey",
    summary:
      "A habit tracker with two front ends over one backend: a Telegram bot for logging on the move and a React dashboard with charts, reminders, and light/dark themes.",
    highlights: ["University final project", "Six related SQL tables, per-user isolation"],
    stack: ["FastAPI", "aiogram", "SQLite", "React"],
  },
];

export const experience = [
  {
    org: "QazaqArt.kz",
    role: "CTO & IT Lead",
    period: "Oct 2025 — now",
    points: [
      "Lead the full-stack platform on Django and Vue.js.",
      "Closed distribution deals with 4+ art residencies and media partners: +600 followers and 300+ active users in a month.",
      "Co-lead partnerships with the British Council and the UN that brought 3 Kazakh artists to global festivals.",
    ],
  },
  {
    org: "Oki App",
    role: "Product & Marketing Associate",
    period: "Feb — May 2026",
    points: [
      "Ran a UGC strategy across 10,000+ creators: 5M+ views and 4,500+ sign-ups.",
      "A 4-day influencer campaign tripled the customer base and brought 1,000,000 KZT in revenue.",
    ],
  },
  {
    org: "TUMO Center",
    role: "Learning Coach & IT Mentor",
    period: "Jan — Apr 2026",
    points: [
      "Mentored 100+ teenagers in JavaScript, web development, and GenAI.",
      "Guided 65 students to their first web project; 90% finished the capstone.",
    ],
  },
  {
    org: "Meta Llama Accelerator",
    role: "Founder & Full-Stack Developer",
    period: "Jun — Oct 2025",
    points: ["Built Back2Roots and placed 2nd of 1,800 teams."],
  },
  {
    org: "Enactus AITU",
    role: "Vice Captain & AI Lead",
    period: "Sep 2024 — now",
    points: [
      "Twice national champions and Top 4 at the Enactus World Cup in Bangkok.",
      "Took 3+ social ventures from idea to competition-ready product.",
    ],
  },
  {
    org: "Tomorrow School, Astana Hub",
    role: "AI Developer & Engineering resident",
    period: "Sep 2025 — now",
    points: [
      "Finished the Golang track with 6 peer-validated projects.",
      "Now in the AI Piscine: machine learning and applied LLM development.",
    ],
  },
];

export const awards = [
  { title: "1st Place, Global Student Entrepreneur Awards", detail: "Kazakhstan National Final and European Regional Final, Dublin", year: "2026" },
  { title: "Twice National Champion, Enactus Kazakhstan", detail: "1st of all university teams nationwide", year: "2025 & 2026" },
  { title: "Global Top 4, Enactus World Cup", detail: "4th of 35 national champions, Bangkok", year: "2025" },
  { title: "1st of 6,000 students", detail: "Astana IT University cohort ranking", year: "2026" },
  { title: "Top 2 Finalist, EmpowerMe Hackathon", detail: "International Grand Final, Turkey", year: "2026" },
  { title: "Top 3 of 80, NVIDIA Inception round", detail: "with CortexAI", year: "2025" },
  { title: "Finalist", detail: "Meta Llama, Decentrathon, Higgsfield.ai, Mastercard & inDrive hackathons", year: "2025 — 2026" },
];

/* Names that match a key in logos.js get their brand mark. */
export const skills = [
  { group: "Languages", items: ["Python", "Go", "JavaScript", "Swift", "Dart"] },
  { group: "Web & mobile", items: ["React", "Vite", "Next.js", "Vue.js", "Django", "FastAPI", "Flutter"] },
  { group: "AI tools", items: ["Claude", "Llama", "Hugging Face", "NVIDIA", "Cursor", "Unreal Engine"] },
  { group: "AI / ML", items: ["RAG", "LLM fine-tuning", "STT / TTS", "Transformers"] },
  { group: "Data & tools", items: ["PostgreSQL", "MongoDB", "SQLite", "Docker", "Git", "Figma"] },
  { group: "Product", items: ["Agile / Scrum", "Roadmapping", "Pitching", "UGC growth"] },
  { group: "Speaks", items: ["Kazakh", "Russian", "English — IELTS 7.0"] },
];
