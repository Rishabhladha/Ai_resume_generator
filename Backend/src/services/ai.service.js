const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
const MODEL = "gemini-2.5-flash"

// ─── Shared helper ────────────────────────────────────────────────────────────
async function jsonGenerate(schema, prompt) {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(schema),
        }
    })
    return JSON.parse(response.text)
}

// ─── 1. Resume ATS Audit ──────────────────────────────────────────────────────
const resumeAuditSchema = z.object({
    atsScore: z.number().min(0).max(100).describe("Overall ATS compatibility score 0-100"),
    keywordMatches: z.array(z.string()).describe("Keywords from JD that appear in resume"),
    missingKeywords: z.array(z.string()).describe("Critical keywords from JD missing from resume"),
    sectionScores: z.object({
        summary: z.number().min(0).max(100),
        experience: z.number().min(0).max(100),
        skills: z.number().min(0).max(100),
        education: z.number().min(0).max(100),
        formatting: z.number().min(0).max(100)
    }).describe("Section-wise ATS score"),
    improvements: z.array(z.string()).describe("Specific, actionable improvements to boost ATS score"),
    strengths: z.array(z.string()).describe("What the resume already does well")
})

async function generateResumeAudit({ resume, jobDescription }) {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyst. Analyze this resume against the job description.

Resume:
${resume}

Job Description:
${jobDescription}

Provide a detailed ATS audit. Be specific and actionable. The ATS score should reflect how likely a real ATS would parse and rank this resume for this role.`
    return jsonGenerate(resumeAuditSchema, prompt)
}

// ─── 2. Interview Prep (Technical Only, NO behavioral questions) ───────────────
const interviewPrepSchema = z.object({
    matchScore: z.number().min(0).max(100).describe("How well the candidate matches this role 0-100"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("A real technical interview question for this role"),
        intention: z.string().describe("What the interviewer is testing with this question"),
        answer: z.string().describe("Detailed guidance on how to answer: approach, key points, what to demonstrate"),
        difficulty: z.enum(["easy", "medium", "hard"])
    })).min(8).max(12).describe("Technical interview questions tailored to this specific job and candidate profile"),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
        learningResource: z.string().describe("Specific resource: book title, YouTube channel, official doc URL, or course name")
    })).describe("Skills the candidate lacks for this role, with resources to fill each gap"),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()).describe("Concrete, specific tasks for this day")
    })).describe("Day-by-day preparation plan leading up to interview"),
    companyInsights: z.object({
        culture: z.string().describe("Company culture and values based on JD clues"),
        techStack: z.array(z.string()).describe("Technologies mentioned or implied in JD"),
        interviewStyle: z.string().describe("Likely interview format and style for this company/role"),
        recentNews: z.string().describe("What to research about this company before the interview"),
        whatTheyValue: z.array(z.string()).describe("Core values and traits this company/role prioritizes")
    })
})

async function generateInterviewPrep({ resume, jobDescription, company }) {
    const prompt = `You are a senior technical interviewer and career coach. Generate a comprehensive interview preparation report.

Candidate Resume:
${resume}

Company: ${company || "Unknown"}
Job Description:
${jobDescription}

Generate technical interview questions specific to this role and company. DO NOT generate behavioral questions. Focus on:
- Technical depth matching the JD requirements
- Company-specific context
- Realistic difficulty distribution
- Actionable preparation with specific resources`
    return jsonGenerate(interviewPrepSchema, prompt)
}

// ─── 3. Cover Letter ──────────────────────────────────────────────────────────
const coverLetterSchema = z.object({
    coverLetter: z.string().describe("A professional 3-paragraph cover letter, personalized to the company and role. Written in first person, confident but not arrogant. Should NOT sound AI-generated. Opening: hook + why this company. Middle: 2-3 specific achievements mapped to JD requirements. Closing: call to action. Max 350 words.")
})

async function generateCoverLetter({ resume, jobDescription, company, role }) {
    const prompt = `Write a cover letter for this job application.

Candidate Resume:
${resume}

Company: ${company}
Role: ${role}
Job Description:
${jobDescription}

Requirements:
- 3 paragraphs, max 350 words
- Opening: compelling hook + specific reason for wanting THIS company
- Middle: map 2-3 specific candidate achievements to JD requirements with real numbers/impact
- Closing: confident call-to-action
- Sound human and authentic, NOT like an AI wrote it
- Do NOT use clichés like "I am writing to express my interest"`
    return jsonGenerate(coverLetterSchema, prompt)
}

// ─── 4. Networking Messages ───────────────────────────────────────────────────
const networkingSchema = z.object({
    linkedinDm: z.string().describe("A short LinkedIn DM to a recruiter or hiring manager. Max 250 characters. Personalized, not spammy. Mentions the role and one specific thing about the company."),
    coldEmail: z.string().describe("Cold email body to a hiring manager. 150-200 words. Specific, value-focused, professional."),
    coldEmailSubject: z.string().describe("Subject line for the cold email. Specific and intriguing, max 60 chars."),
    followUp: z.string().describe("Follow-up message to send 1 week after applying. Professional, brief, adds new value.")
})

async function generateNetworkingMessages({ resume, jobDescription, company, role }) {
    const prompt = `Generate networking messages for a job application.

Candidate Resume:
${resume}

Target Company: ${company}
Target Role: ${role}
Job Description:
${jobDescription}

Generate personalized networking messages. They should feel genuine, not templated. Each should reference something specific about the role or company.`
    return jsonGenerate(networkingSchema, prompt)
}

// ─── 5. Salary Insights ───────────────────────────────────────────────────────
const salarySchema = z.object({
    minSalary: z.number().describe("Lower bound of salary range for this role/location in the local currency"),
    midSalary: z.number().describe("Market median salary for this role/location"),
    maxSalary: z.number().describe("Upper bound / top earners for this role/location"),
    currency: z.string().describe("Currency code e.g. USD, INR, GBP"),
    seniorityLevel: z.string().describe("Assessed seniority level: Junior / Mid-Level / Senior / Staff / Principal"),
    marketPosition: z.enum(["below", "at", "above"]).describe("How the typical offer compares to market"),
    notes: z.string().describe("Context: factors that affect salary for this role like location, company size, equity, etc.")
})

async function generateSalaryInsights({ resume, jobDescription, company, role }) {
    const prompt = `You are a compensation expert. Based on the job description and candidate profile, estimate realistic salary ranges.

Candidate Resume:
${resume}

Company: ${company}
Role: ${role}
Job Description:
${jobDescription}

Provide salary estimates based on the role, required experience level, likely location (infer from JD if possible), and industry. Be specific with numbers.`
    return jsonGenerate(salarySchema, prompt)
}

// ─── 6. LinkedIn Tips ────────────────────────────────────────────────────────
const linkedinSchema = z.object({
    headline: z.string().describe("Optimized LinkedIn headline (max 220 chars) using keywords from their field"),
    about: z.string().describe("LinkedIn About section (max 300 words). First-person, storytelling, SEO-optimized with keywords. Ends with a call to action."),
    skillsToAdd: z.array(z.string()).min(5).max(10).describe("Top LinkedIn skills to add based on their profile and target role")
})

async function generateLinkedinTips({ resume, jobDescription, role }) {
    const prompt = `Optimize this candidate's LinkedIn profile for their target role.

Resume:
${resume}

Target Role: ${role}
Job Description context:
${jobDescription}

Generate a LinkedIn headline, About section, and recommended skills. Optimize for LinkedIn search and recruiter discovery.`
    return jsonGenerate(linkedinSchema, prompt)
}

// ─── 7. Negotiation Coach ─────────────────────────────────────────────────────
const negotiationSchema = z.object({
    counterOffer: z.number().describe("Recommended counter-offer amount based on market data"),
    script: z.string().describe("Word-for-word phone/video call negotiation script. Confident, professional, specific."),
    keyPoints: z.array(z.string()).describe("Key talking points and leverage points to use in negotiation"),
    redFlags: z.array(z.string()).describe("Potential red flags in a typical offer for this role to watch out for")
})

async function generateNegotiationCoach({ resume, role, company, salaryOffered, marketMin, marketMid, marketMax }) {
    const prompt = `You are an expert salary negotiation coach.

Candidate Role: ${role}
Company: ${company}
Offer Received: ${salaryOffered}
Market Range: ${marketMin} - ${marketMid} - ${marketMax}

Candidate Resume:
${resume}

Generate a negotiation strategy. The script should be specific with exact words to say on the phone. Be assertive but professional.`
    return jsonGenerate(negotiationSchema, prompt)
}

// ─── 8. Extract Profile from Resume ──────────────────────────────────────────
const profileExtractSchema = z.object({
    skills: z.array(z.string()).describe("All technical and soft skills found in the resume"),
    yearsOfExperience: z.number().describe("Total years of professional experience"),
    targetRoles: z.array(z.string()).describe("2-3 most suitable role titles for this candidate"),
    currentLocation: z.string().describe("Current location if mentioned, else 'Unknown'")
})

async function extractProfileFromResume({ resumeText }) {
    const prompt = `Extract structured profile information from this resume.

Resume:
${resumeText}`
    return jsonGenerate(profileExtractSchema, prompt)
}

// ─── 9. Grade Mock Interview Answer ──────────────────────────────────────────
const mockInterviewGradeSchema = z.object({
    score: z.number().min(0).max(10).describe("Score out of 10 for this answer"),
    feedback: z.string().describe("Detailed, constructive feedback on the answer quality"),
    whatWasGood: z.array(z.string()).describe("What the candidate did well"),
    improvements: z.array(z.string()).describe("Specific improvements to make this answer stronger"),
    modelAnswer: z.string().describe("A strong version of this answer for reference")
})

async function gradeMockInterviewAnswer({ question, userAnswer, jobDescription, difficulty }) {
    const prompt = `You are an experienced technical interviewer. Grade this interview answer.

Job Context:
${jobDescription}

Question (${difficulty} difficulty): ${question}

Candidate's Answer:
${userAnswer}

Provide honest, constructive feedback. Be specific about what they got right and wrong.`
    return jsonGenerate(mockInterviewGradeSchema, prompt)
}

// ─── 10. ATS-Optimized Resume PDF ────────────────────────────────────────────
const resumeDataSchema = z.object({
    fullName: z.string().describe("Candidate's full name"),
    phone: z.string().describe("Phone number"),
    email: z.string().describe("Email address"),
    linkedin: z.string().describe("LinkedIn profile URL"),
    github: z.string().describe("GitHub profile URL or other portfolio URL"),
    location: z.string().describe("City, State"),
    summary: z.string().describe("A professional summary of exactly 3 sentences max tailored to the target role"),
    skills: z.object({
        languages: z.array(z.string()).describe("Programming languages"),
        frameworks: z.array(z.string()).describe("Frameworks and libraries"),
        databases: z.array(z.string()).describe("Databases"),
        tools: z.array(z.string()).describe("Tools and platforms"),
        concepts: z.array(z.string()).describe("Core concepts")
    }),
    projects: z.array(z.object({
        title: z.string().describe("Project title"),
        subtitle: z.string().describe("One line scale/impact description"),
        techStack: z.array(z.string()).describe("Technologies used in the project"),
        bullets: z.array(z.string()).describe("Action verb + component + measurable result bullet points. Max 3 bullets.")
    })).describe("List of professional/personal projects or work experiences"),
    education: z.array(z.object({
        degree: z.string().describe("Degree name"),
        institution: z.string().describe("Institution name"),
        year: z.string().describe("Graduation/Expected year"),
        coursework: z.array(z.string()).describe("Relevant coursework list")
    })),
    certifications: z.array(z.object({
        name: z.string().describe("Certification name"),
        issuer: z.string().describe("Issuer"),
        date: z.string().describe("Date")
    }))
})

function formatResumeText(data) {
    let text = "";
    
    // Header
    if (data.fullName) {
        text += `${data.fullName.toUpperCase()}\n`;
    }
    
    const contactInfo = [
        data.phone,
        data.email,
        data.linkedin,
        data.github,
        data.location
    ].filter(Boolean).join(" | ");
    
    if (contactInfo) {
        text += `${contactInfo}\n`;
    }
    text += `\n`;
    
    // Summary
    text += `SUMMARY\n`;
    if (data.summary) {
        text += `${data.summary.trim()}\n`;
    }
    text += `\n`;
    
    // Technical Skills
    text += `TECHNICAL SKILLS\n`;
    if (data.skills) {
        const s = data.skills;
        if (s.languages && s.languages.length > 0) {
            text += `Languages: ${s.languages.join(", ")}\n`;
        }
        if (s.frameworks && s.frameworks.length > 0) {
            text += `Frameworks and Libraries: ${s.frameworks.join(", ")}\n`;
        }
        if (s.databases && s.databases.length > 0) {
            text += `Databases: ${s.databases.join(", ")}\n`;
        }
        if (s.tools && s.tools.length > 0) {
            text += `Tools and Platforms: ${s.tools.join(", ")}\n`;
        }
        if (s.concepts && s.concepts.length > 0) {
            text += `Core Concepts: ${s.concepts.join(", ")}\n`;
        }
    }
    text += `\n`;
    
    // Projects
    text += `PROJECTS\n`;
    if (data.projects && data.projects.length > 0) {
        data.projects.forEach(proj => {
            text += `${proj.title} — ${proj.subtitle}\n`;
            if (proj.techStack && proj.techStack.length > 0) {
                text += `Tech: ${proj.techStack.join(", ")}\n`;
            }
            if (proj.bullets && proj.bullets.length > 0) {
                proj.bullets.forEach(bp => {
                    let cleanBp = bp.trim();
                    if (!cleanBp.startsWith("-")) {
                        cleanBp = `- ${cleanBp}`;
                    }
                    text += `${cleanBp}\n`;
                });
            }
            text += `\n`;
        });
    }
    
    // Education
    text += `EDUCATION\n`;
    if (data.education && data.education.length > 0) {
        data.education.forEach(edu => {
            text += `${edu.degree} | ${edu.institution} | ${edu.year}\n`;
            if (edu.coursework && edu.coursework.length > 0) {
                text += `Relevant Coursework: ${edu.coursework.join(", ")}\n`;
            }
            text += `\n`;
        });
    }
    
    // Certifications
    if (data.certifications && data.certifications.length > 0) {
        text += `CERTIFICATIONS\n`;
        data.certifications.forEach(cert => {
            text += `- ${cert.name} — ${cert.issuer} (${cert.date})\n`;
        });
    }
    
    return text.trim();
}

function renderResumeHtml(data) {
    const { fullName, phone, email, linkedin, github, location, summary, skills, projects, education, certifications } = data;
    
    const contacts = [];
    if (phone) contacts.push(phone);
    if (email) contacts.push(`<a href="mailto:${email}">${email}</a>`);
    if (linkedin) {
        const displayLinkedin = linkedin.replace(/^https?:\/\/(www\.)?/, '');
        contacts.push(`<a href="${linkedin}" target="_blank">${displayLinkedin}</a>`);
    }
    if (github) {
        const displayGithub = github.replace(/^https?:\/\/(www\.)?/, '');
        contacts.push(`<a href="${github}" target="_blank">${displayGithub}</a>`);
    }
    if (location) contacts.push(location);
    
    const contactsHtml = contacts.join(' &bull; ');
    
    let skillsHtml = '';
    if (skills) {
        const s = skills;
        if (s.languages?.length) {
            skillsHtml += `<div class="skill-row"><strong>Languages:</strong> ${s.languages.join(', ')}</div>`;
        }
        if (s.frameworks?.length) {
            skillsHtml += `<div class="skill-row"><strong>Frameworks & Libraries:</strong> ${s.frameworks.join(', ')}</div>`;
        }
        if (s.databases?.length) {
            skillsHtml += `<div class="skill-row"><strong>Databases:</strong> ${s.databases.join(', ')}</div>`;
        }
        if (s.tools?.length) {
            skillsHtml += `<div class="skill-row"><strong>Tools & Platforms:</strong> ${s.tools.join(', ')}</div>`;
        }
        if (s.concepts?.length) {
            skillsHtml += `<div class="skill-row"><strong>Core Concepts:</strong> ${s.concepts.join(', ')}</div>`;
        }
    }
    
    let projectsHtml = '';
    if (projects?.length) {
        projects.forEach(proj => {
            const techLine = proj.techStack?.length ? `<div class="project-tech">Tech: ${proj.techStack.join(', ')}</div>` : '';
            const bulletList = proj.bullets?.length ? 
                `<ul>${proj.bullets.map(bp => `<li>${bp.replace(/^-\s*/, '')}</li>`).join('')}</ul>` : '';
            
            projectsHtml += `
            <div class="project-item">
                <div class="project-header">
                    <span class="project-name">${proj.title}</span>
                    <span class="project-desc">${proj.subtitle}</span>
                </div>
                ${techLine}
                ${bulletList}
            </div>`;
        });
    }
    
    let educationHtml = '';
    if (education?.length) {
        education.forEach(edu => {
            const courseworkLine = edu.coursework?.length ? `<div class="edu-coursework"><strong>Relevant Coursework:</strong> ${edu.coursework.join(', ')}</div>` : '';
            educationHtml += `
            <div class="edu-item">
                <div class="edu-header">
                    <span class="edu-degree">${edu.degree}</span>
                    <span class="edu-uni">${edu.institution}</span>
                    <span class="edu-year">${edu.year}</span>
                </div>
                ${courseworkLine}
            </div>`;
        });
    }
    
    let certificationsHtml = '';
    if (certifications?.length) {
        certificationsHtml = `
        <ul class="cert-list">
            ${certifications.map(cert => `<li><strong>${cert.name}</strong> &mdash; ${cert.issuer} (${cert.date})</li>`).join('')}
        </ul>`;
    }
    
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Resume - ${fullName}</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  .resume-body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #333333;
    padding: 15mm;
    background: #ffffff;
    box-sizing: border-box;
  }
  .resume-body a {
    color: #333333;
    text-decoration: none;
    border-bottom: 1px solid #cccccc;
  }
  .resume-body .header {
    text-align: center;
    margin-bottom: 15px;
  }
  .resume-body .name {
    font-size: 20pt;
    font-weight: bold;
    letter-spacing: 0.5px;
    margin: 0 0 5px 0;
    color: #111111;
  }
  .resume-body .contacts {
    font-size: 8.5pt;
    color: #666666;
  }
  .resume-body .contacts a {
    color: #555555;
  }
  
  .resume-body .section-title {
    font-size: 10.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #222222;
    border-bottom: 1.5px solid #111111;
    padding-bottom: 3px;
    margin-top: 15px;
    margin-bottom: 8px;
  }
  
  .resume-body .summary {
    font-size: 9.5pt;
    text-align: justify;
    margin-bottom: 10px;
  }
  
  .resume-body .skill-row {
    font-size: 9.5pt;
    margin-bottom: 4px;
  }
  
  .resume-body .project-item, .resume-body .edu-item {
    margin-bottom: 10px;
  }
  .resume-body .project-header, .resume-body .edu-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 9.5pt;
  }
  .resume-body .project-name, .resume-body .edu-degree {
    font-weight: bold;
    color: #111111;
  }
  .resume-body .project-desc, .resume-body .edu-uni {
    color: #555555;
    font-style: italic;
    flex-grow: 1;
    margin-left: 10px;
  }
  .resume-body .edu-year {
    font-weight: bold;
    color: #222222;
  }
  .resume-body .project-tech {
    font-size: 8.5pt;
    color: #666666;
    margin-top: 2px;
    font-family: Consolas, Monaco, monospace;
  }
  
  .resume-body ul {
    margin: 4px 0 0 0;
    padding-left: 18px;
  }
  .resume-body li {
    font-size: 9pt;
    margin-bottom: 3px;
    color: #333333;
  }
  .resume-body .edu-coursework {
    font-size: 8.5pt;
    color: #555555;
    margin-top: 2px;
  }
  .resume-body .cert-list {
    list-style-type: square;
  }
</style>
</head>
<body>
  <div class="resume-body">
    <div class="header">
      <h1 class="name">${fullName}</h1>
      <div class="contacts">${contactsHtml}</div>
    </div>
    
    <div class="section-title">Summary</div>
    <div class="summary">${summary}</div>
    
    <div class="section-title">Technical Skills</div>
    <div class="skills-section">
      ${skillsHtml}
    </div>
    
    <div class="section-title">Projects & Experience</div>
    <div class="projects-section">
      ${projectsHtml}
    </div>
    
    <div class="section-title">Education</div>
    <div class="education-section">
      ${educationHtml}
    </div>
    
    ${certificationsHtml ? `
    <div class="section-title">Certifications</div>
    <div class="certifications-section">
      ${certificationsHtml}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

async function generateAtsResumePdf({ resume, jobDescription, company, role }) {
    const prompt = `You are an ATS resume optimization engine. Extract the candidate's CV into a strict JSON object.

Your job is NOT to reformat — it is to OPTIMIZE the content for ATS scoring while staying 100% truthful to the original CV.

OPTIMIZATION RULES (apply during extraction):

1. SUMMARY
   - Must start with exact job title from the target role (e.g., "Software Engineer")
   - Must include: experience level, 2 specific technical skills, 1 quantified achievement
   - Max 3 sentences, no fluff words

2. SKILLS — add these keywords IF they are genuinely supported by the projects:
   - If they used Socket.io for real-time → add "Real-Time Systems"
   - If they used REST/Express → add "REST APIs"
   - If they built multi-role auth → add "Authentication and Authorization"
   - If they used Git/GitHub → add "Version Control (Git)"
   - Only add what is truthfully evidenced in the CV

3. PROJECTS
   - projectTitle: just the name, no description sentence
   - projectSubtitle: one line, include scale/impact (e.g., "Real-time ride platform serving 500+ users")
   - Each bullet: MUST follow "Action Verb + Component + Measurable Result" format
   - If a bullet has no number, add scope: "across 2 roles", "for 500+ users", "reducing X"
   - Never repeat an action verb across bullets in the same project
   - Max 3 bullets per project

4. EDUCATION
   - Include GPA only if provided
   - Coursework must include: relevant CS fundamentals (OS, Networks, DBMS, DSA)

5. CERTIFICATIONS
   - Keep issuer and date

TARGET ROLE: ${role || "Software Engineer"} at ${company || "Target Company"}

Return ONLY valid JSON matching this exact schema.

ORIGINAL CV:
---
${resume}
---

Return ONLY the JSON object. No explanation. No markdown. No backticks.`

    const result = await jsonGenerate(resumeDataSchema, prompt)
    const plainText = formatResumeText(result)
    const html = renderResumeHtml(result)

    // Generate PDF via Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
    })
    await browser.close()

    return { pdfBuffer, html, plainText }
}

// ─── 11. Scrape Job Description from URL ──────────────────────────────────────
async function scrapeJobDescription(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    try {
        const page = await browser.newPage()
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        
        const pageText = await page.evaluate(() => {
            const elementsToRemove = document.querySelectorAll('script, style, noscript, iframe, nav, footer, header, .footer, .header, .nav')
            elementsToRemove.forEach(el => el.remove())
            return document.body.innerText
        })
        
        await browser.close()

        if (!pageText || pageText.trim().length === 0) {
            throw new Error("No readable text content found on the page.")
        }

        const scrapeJobSchema = z.object({
            company: z.string().describe("Name of the company hiring. If not found, use empty string"),
            role: z.string().describe("Title/Role name of the job. If not found, use empty string"),
            jobDescription: z.string().describe("Cleaned, readable job description, including responsibilities, requirements, and tech stack. Exclude headers, footers, sidebar contents, and unrelated text.")
        })

        const prompt = `You are a professional recruiting assistant. Extract the hiring company, role title, and cleaned job description from this scraped text.
        
Scraped Page Text:
${pageText.substring(0, 10000)}

Extract the information accurately.`

        return await jsonGenerate(scrapeJobSchema, prompt)
    } catch (error) {
        if (browser) await browser.close()
        throw error
    }
}

module.exports = {
    generateResumeAudit,
    generateInterviewPrep,
    generateCoverLetter,
    generateNetworkingMessages,
    generateSalaryInsights,
    generateLinkedinTips,
    generateNegotiationCoach,
    extractProfileFromResume,
    gradeMockInterviewAnswer,
    generateAtsResumePdf,
    scrapeJobDescription
}