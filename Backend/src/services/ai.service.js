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
async function generateAtsResumePdf({ resume, jobDescription, company, role }) {
    const prompt = `You are an expert ATS (Applicant Tracking System) resume writer. Your job is to convert the uploaded CV into a single-page, ATS-optimized resume tailored to the target role that scores 90+ on ATS checkers.

STRICT RULES — follow every one without exception:

1. OUTPUT FORMAT & LENGTH CONSTRAINT
   - Return a JSON with "html" field containing the complete HTML document.
   - The document MUST fit on exactly ONE single page (A4 format). Keep it compact and dense.
   - Word count must be strictly between 450 and 600 words. Max ~40 lines of content total.
   - Use standard section headers (ATS systems scan for exact keywords): SUMMARY, SKILLS, EXPERIENCE, EDUCATION, CERTIFICATIONS (if any). Do not change these titles.
   - Single column layout ONLY — no tables, no columns, no text boxes, no graphics, no icons, no color except black or dark gray text on a white background.

2. CSS & LAYOUT RULES (for the HTML)
   - Font: Arial or Calibri (sans-serif) at 10pt or 10.5pt. Line-height: 1.3.
   - Margins: Tight margins. Set container padding to 0 and page margins to ~15mm.
   - Spacing: Keep spacing between sections tight (e.g., margin-bottom: 8px).
   - Use clean, standard HTML5 elements with inline styles only. Do not use CSS classes or external stylesheets.

3. CONTACT HEADER
   - Name centered at the top in large, bold font (e.g. 18pt to 20pt).
   - Below the name, list Phone | Email | LinkedIn | GitHub | City, State on a single line, pipe-separated and centered. No full street address.

4. PROFESSIONAL SUMMARY (Max 3-4 lines)
   - Start with job title + years of experience.
   - Include 2-3 hard skills or tools matching the job description.
   - Mention one key measurable achievement.
   - No generic soft-skill fluff (e.g., do not use "passionate", "hardworking", "detail-oriented").

5. SKILLS SECTION
   - List as comma-separated keywords on one line per category.
   - Example: Languages: Python, Java | Frameworks: React, Node.js | Tools: Git, Docker.
   - Include only real technical or functional skills from the original CV — do NOT invent skills.

6. WORK EXPERIENCE SECTION
   - Format: Job Title | Company Name | Month Year – Month Year (aligned nicely).
   - Max 3-4 bullet points per role. Limit to the 3 most relevant jobs.
   - Each bullet point MUST follow this format: Action Verb + Task + Measurable Result (with percentages, dollar values, or counts).
   - Example: "Reduced API response time by 40% by implementing Redis caching across 3 microservices"
   - If no metric exists in the original CV, use scope: "for a team of 8", "across 4 departments".
   - Bullets only. No paragraphs. Use standard bullet character: •

7. EDUCATION & CERTIFICATIONS
   - Format: Degree | Institution | Graduation Year.
   - GPA only if 3.5+ or 8.0+.
   - Relevant coursework: one line, comma-separated (optional).

8. WHAT TO CUT RUTHLESSLY
   - Objectives/career goals section.
   - References or "References available on request".
   - Hobbies/interests (unless directly relevant to the role).
   - Soft skills listed as a separate section (weave them into experience bullets instead).
   - Experiences older than 10 years (unless highly relevant).

9. KEYWORD OPTIMIZATION
   - Mirror exact technical keywords from the job description and original CV naturally.
   - Use full forms first, followed by abbreviation in brackets: e.g., "Applicant Tracking System (ATS)".

Original Resume:
${resume}

Target Company: ${company}
Target Role: ${role}
Job Description:
${jobDescription}

Return the HTML code wrapped inside the "html" key of the JSON object. Do not include any explanations, preamble, or markdown code block wrapper inside the JSON string.`

    const schema = z.object({
        html: z.string().describe("Complete HTML of the ATS-optimized resume")
    })

    const result = await jsonGenerate(schema, prompt)

    // Generate PDF via Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(result.html, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
    })
    await browser.close()

    return { pdfBuffer, html: result.html }
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