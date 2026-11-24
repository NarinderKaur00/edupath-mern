// Specialization knowledge base — ported from the Flask advisor.py.
// One entry per Elective-Focus track: what it is, careers, and helpful subjects.
export const SPEC_KB = {
  "High Performance Computing": {
    what: "Building systems that run huge computations fast — cloud, GPUs and parallel/distributed computing.",
    careers: ["Cloud Engineer", "HPC / Systems Engineer", "Backend Engineer", "Infrastructure Engineer"],
    strengths: ["Operating Systems", "Computer Architecture", "Programming", "Maths"],
  },
  "Computer Animation & Gaming": {
    what: "Graphics, game development, 3D/animation and AR/VR, plus computer vision.",
    careers: ["Game Developer", "Graphics Engineer", "AR/VR Developer", "Technical Artist"],
    strengths: ["Programming", "Linear Algebra / geometry", "Creativity", "Maths"],
  },
  "Information & Cyber Security": {
    what: "Protecting systems, networks and data — cryptography, secure coding and blockchain.",
    careers: ["Security Analyst", "Security Engineer", "Penetration Tester", "Blockchain Developer"],
    strengths: ["Computer Networks", "Operating Systems", "Maths", "Programming"],
  },
  "Data Science": {
    what: "Turning data into insight and building machine-learning / deep-learning models.",
    careers: ["Data Scientist", "Machine Learning Engineer", "Data Analyst", "AI Engineer"],
    strengths: ["Probability & Statistics", "Machine Learning", "Programming", "Maths"],
  },
  "DevOps & Continuous Delivery": {
    what: "Automating how software is built, tested and shipped — CI/CD and infrastructure.",
    careers: ["DevOps Engineer", "Site Reliability Engineer (SRE)", "Platform Engineer", "Cloud Engineer"],
    strengths: ["Operating Systems", "Computer Networks", "Programming / scripting", "Software Engineering"],
  },
  "Full Stack": {
    what: "Building complete web applications — front-end, back-end, data and cloud.",
    careers: ["Full-Stack Developer", "Front-end / Back-end Engineer", "UI/UX Engineer", "Software Engineer"],
    strengths: ["Programming", "Database Management Systems", "Software Engineering", "Design sense"],
  },
  "Conversational AI": {
    what: "Language and speech AI — chatbots, natural-language processing and generative AI.",
    careers: ["NLP Engineer", "Machine Learning Engineer", "Generative-AI Engineer", "AI Researcher"],
    strengths: ["Machine Learning", "Probability & Statistics", "Programming", "Maths"],
  },
  "Cyber Forensics & Ethical Hacking": {
    what: "Offensive security — ethical hacking, penetration testing, forensics and network defence.",
    careers: ["Ethical Hacker", "Penetration Tester", "Forensics Analyst", "SOC Analyst"],
    strengths: ["Computer Networks", "Operating Systems", "Programming", "Problem solving"],
  },
};

// keyword -> canonical field, for matching free text.
export const ALIASES = {
  "data science": "Data Science", "data scientist": "Data Science", ml: "Data Science",
  "machine learning": "Data Science", ai: "Data Science",
  security: "Information & Cyber Security", cyber: "Information & Cyber Security",
  blockchain: "Information & Cyber Security",
  hacking: "Cyber Forensics & Ethical Hacking", ethical: "Cyber Forensics & Ethical Hacking",
  forensic: "Cyber Forensics & Ethical Hacking", pentest: "Cyber Forensics & Ethical Hacking",
  nlp: "Conversational AI", chatbot: "Conversational AI", language: "Conversational AI",
  generative: "Conversational AI", speech: "Conversational AI",
  game: "Computer Animation & Gaming", gaming: "Computer Animation & Gaming",
  graphics: "Computer Animation & Gaming", animation: "Computer Animation & Gaming",
  vr: "Computer Animation & Gaming", ar: "Computer Animation & Gaming",
  cloud: "High Performance Computing", gpu: "High Performance Computing",
  parallel: "High Performance Computing", hpc: "High Performance Computing",
  devops: "DevOps & Continuous Delivery", "ci/cd": "DevOps & Continuous Delivery",
  deployment: "DevOps & Continuous Delivery",
  "full stack": "Full Stack", web: "Full Stack", frontend: "Full Stack",
  backend: "Full Stack", ui: "Full Stack", ux: "Full Stack",
};
