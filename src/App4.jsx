import { useState, useEffect, useRef } from "react";

const MODEL = "claude-sonnet-4-20250514";
const C = {
  navy:"#0D1B2A",navyL:"#162338",navyM:"#1E2E42",
  gold:"#E8A838",goldL:"#F5C860",
  green:"#2D6A4F",greenL:"#40916C",greenP:"#52B788",
  cream:"#F5F0E8",white:"#FFFFFF",
  gray:"#8B9BB4",
  verified:"#00C896",
  pending:"#F5A623",
};
const FREE_DOMAINS=["gmail","yahoo","hotmail","outlook","icloud","aol","proton","mail","ymail","live","msn"];
function isOfficial(email){
  if(!email||!email.includes("@"))return false;
  const domain=email.split("@")[1]?.split(".")[0]?.toLowerCase();
  return !FREE_DOMAINS.includes(domain);
}
async function callClaude(messages,system,maxTokens=1000){
  const r=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages})
  });
  const d=await r.json();
  return d.content?.map(b=>b.text||"").join("")||"Error getting response.";
}

// ───────────────────────────────────────────────────────────────────────────
// COUNTRY CONFIGURATION — every market-specific string lives here
// ───────────────────────────────────────────────────────────────────────────
const COUNTRIES = {
  US: {
    code:"US", flag:"🇺🇸", name:"United States", docName:"Resume",
    currency:"$", currencyName:"USD",
    morphPairs:[["Assistant Manager","Vice President, Operations"],["Deputy Director","Senior Director, Strategy"],["Principal Officer","Chief Operating Officer"],["Head of Department","Director of Finance"],["Senior Executive","VP, Business Development"]],
    titleGapExample:"A Principal Manager at a Nigerian bank — managing 40+ staff, full P&L responsibility — is a Director or VP in the US.",
    formatNotes:"US resumes (1 page preferred, 2 max for senior roles) skip photos, age, marital status, and nationality. ATS-friendly formatting with strong action verbs is essential.",
    visaTerms:["OPT","H-1B","Green Card","TN Visa (for some nationalities)","O-1"],
    visaQuestion:"Are you authorized to work in the United States?",
    associations:["NAPSA (Nigerian American Professionals)","ASAP (African Students Association)","AAFB"],
    salaryNote:"Research bands on Glassdoor, LinkedIn Salary, and Levels.fyi before negotiating.",
    selfPromoLevel:"high",
    cultureNotes:{
      selfPromo:["Saying 'I achieved X' is expected — not arrogance","Quantify everything: 'managed team' → 'led 12-person team, grew revenue 34%'","Never deflect credit in interviews — own your wins fully","Networking is transactional AND relational — both are acceptable"],
      workplace:["First names standard — even with senior executives","Challenging your manager respectfully shows engagement","Emails: concise and direct — no lengthy preamble","Work-life boundaries respected — don't overwork unless required"],
      salary:["Always negotiate — employers build in room expecting it","Never give your number first — ask about the full package","Research Glassdoor, LinkedIn Salary, Levels.fyi first","Ask about equity, bonus, PTO, 401(k) match — total comp, not just base"],
      networking:["LinkedIn: connect with 10+ people/week in your field","Informational interviews: ask for 20 min — most say yes","Follow up within 24 hrs — professional, not pushy","African associations (NAPSA, ASAP) are powerful entry points"],
      visa:["Know your status in one sentence — practice saying it","Some roles explicitly sponsor visas — filter for them on LinkedIn","Never misrepresent authorization status — termination risk","An immigration lawyer should review all employment contracts"],
    },
  },
  UK: {
    code:"UK", flag:"🇬🇧", name:"United Kingdom", docName:"CV",
    currency:"£", currencyName:"GBP",
    morphPairs:[["Assistant Manager","Operations Director"],["Deputy Director","Senior Director"],["Principal Officer","Chief Operating Officer"],["Head of Department","Head of Finance"],["Senior Executive","Director, Business Development"]],
    titleGapExample:"A Principal Manager at a Kenyan bank — managing 40+ staff, full budget ownership — is a Director or Head of Department in the UK.",
    formatNotes:"UK CVs can run 2 pages, often open with a short personal statement, list education with classification (e.g. 2:1), and never include a photo, age, or marital status. Spelling should be UK English (organisation, not organization).",
    visaTerms:["Skilled Worker visa","Health and Care Worker visa","Global Talent visa","ILR (Indefinite Leave to Remain)","Graduate visa"],
    visaQuestion:"Do you have the right to work in the UK, or will you require sponsorship?",
    associations:["African Foundation for Development (AFFORD UK)","Black British Business Awards network","Nigerians in Diaspora (NIDO UK)"],
    salaryNote:"Check Glassdoor UK and Reed salary checker; UK roles often quote salary bands openly in the job ad itself.",
    selfPromoLevel:"medium",
    cultureNotes:{
      selfPromo:["Self-promotion is more understated than in the US — let achievements speak with concrete numbers rather than superlatives","Still quantify: 'managed team' → 'led a 12-person team, delivered 34% revenue growth'","Politeness and modesty are valued, but don't undersell — be factual and confident","Networking tends to be more relationship-first than transactional"],
      workplace:["First names are standard, though some traditional firms (law, finance) keep more formality with senior staff","Directness is valued but softened — 'I wonder if we might consider...' lands better than blunt pushback","Email tone is slightly more formal than the US — a polite opener is expected","Punctuality and process matter — meetings start on time"],
      salary:["Negotiation is more muted than the US but still expected, especially for senior roles","Many UK job ads list a salary range upfront — use it as your anchor","Ask about pension contributions, private healthcare, and holiday allowance (often 25+ days)","Avoid being seen as overly aggressive on first negotiation — a respectful counter is fine"],
      networking:["LinkedIn UK culture is slightly less aggressive about cold outreach than the US","Industry meetups and professional body events (e.g. CIPD, ICAEW) are strong entry points","African diaspora professional networks (AFFORD, NIDO UK) are valuable","Follow-ups within 2-3 days are fine — less urgency expected than the US"],
      visa:["Know whether you need Skilled Worker sponsorship and say so clearly and early","Check the employer is a licensed UK sponsor before applying if you need a visa","Salary thresholds for sponsorship change — verify current minimums","A UK immigration adviser (OISC-registered) should review contracts tied to visa status"],
    },
  },
  CA: {
    code:"CA", flag:"🇨🇦", name:"Canada", docName:"Resume",
    currency:"$", currencyName:"CAD",
    morphPairs:[["Assistant Manager","Director of Operations"],["Deputy Director","Senior Director, Strategy"],["Principal Officer","Chief Operating Officer"],["Head of Department","Director, Finance"],["Senior Executive","VP, Business Development"]],
    titleGapExample:"A Principal Manager at a Ghanaian bank — managing 40+ staff, full P&L responsibility — is a Director or VP in Canada.",
    formatNotes:"Canadian resumes are close to US ATS style (1-2 pages, no photo, no age/marital status), but cover letters are expected more consistently, and bilingual (English/French) skills should be highlighted if applicable, especially for federal or Quebec roles.",
    visaTerms:["Express Entry / PR","LMIA-backed work permit","Post-Graduation Work Permit (PGWP)","Provincial Nominee Program (PNP)","Working Holiday visa"],
    visaQuestion:"Are you a Canadian citizen, permanent resident, or do you require work authorization?",
    associations:["Canadian Association of Black Lawyers / similar professional bodies","African Canadian professional networks (ACCA, AfriCanada)","TRIEC Mentoring Partnership (Toronto)"],
    salaryNote:"Check Glassdoor Canada, Job Bank wage reports, and Talent.com for current salary bands.",
    selfPromoLevel:"medium-high",
    cultureNotes:{
      selfPromo:["Closer to US directness than UK reserve, but slightly more understated","Quantify achievements clearly: numbers matter in Canadian interviews too","Politeness is valued — confident but not boastful framing works best","Credit-sharing with teams is appreciated, but still own your individual contribution"],
      workplace:["First names are standard across almost all workplaces","Consensus-building is valued — bring data and a collaborative tone to disagreements","Bilingualism (English/French) is a real asset, especially federally or in Quebec","Work-life balance is culturally protected — respect boundaries around overtime"],
      salary:["Negotiation is expected but typically more measured in tone than the US","Job Bank and Glassdoor Canada are reliable for current salary bands","Ask about RRSP matching, extended health benefits, and vacation allowance","Provincial differences exist — Ontario and BC salaries often run higher than Atlantic provinces"],
      networking:["LinkedIn is widely used; informational interviews are well-received","Mentorship programs like TRIEC (Toronto) specifically help internationally trained professionals","African-Canadian professional associations are strong entry points","Local Chambers of Commerce often run newcomer/immigrant programming"],
      visa:["Know your immigration stream (Express Entry, PNP, LMIA-backed permit) and explain it briefly if asked","Canadian employers are generally familiar with supporting PR applications","Credential recognition matters — mention if your degree/certification has been assessed (e.g. WES)","An immigration consultant (RCIC) should review any employer-sponsored visa paperwork"],
    },
  },
};
const COUNTRY_LIST = Object.values(COUNTRIES);

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',sans-serif;background:${C.navy};color:${C.cream};}
.app{display:flex;min-height:100vh;}
.sidebar{width:240px;min-height:100vh;background:${C.navyL};border-right:1px solid rgba(232,168,56,0.12);display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:100;}
.logo{padding:26px 22px 20px;border-bottom:1px solid rgba(255,255,255,0.06);}
.logo-mark{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:${C.gold};}
.logo-sub{font-size:10px;color:${C.gray};margin-top:3px;letter-spacing:1.5px;text-transform:uppercase;}
.nav{padding:16px 10px;flex:1;}
.nav-sec{font-size:9px;color:${C.gray};letter-spacing:2px;text-transform:uppercase;padding:0 12px;margin:14px 0 6px;}
.nav-item{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:9px;cursor:pointer;margin-bottom:2px;transition:all .16s;font-size:13px;font-weight:500;color:${C.gray};}
.nav-item:hover{background:rgba(255,255,255,0.05);color:${C.cream};}
.nav-item.active{background:rgba(232,168,56,0.12);color:${C.gold};}
.nav-icon{font-size:16px;width:20px;text-align:center;}
.nav-badge{margin-left:auto;background:${C.gold};color:${C.navy};font-size:9px;font-weight:700;border-radius:10px;padding:2px 6px;}
.nav-badge.new{background:${C.verified};}
.sidebar-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,0.06);}
.sidebar-footer p{font-size:11px;color:${C.gray};line-height:1.6;}
.sidebar-footer span{color:${C.gold};}
.country-switcher{padding:0 12px 14px;}
.country-label{font-size:9px;color:${C.gray};letter-spacing:2px;text-transform:uppercase;padding:0 0 6px;}
.country-pills{display:flex;gap:6px;}
.country-pill{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:9px;cursor:pointer;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);transition:all .15s;}
.country-pill:hover{border-color:rgba(232,168,56,0.3);}
.country-pill.active{background:rgba(232,168,56,0.12);border-color:${C.gold};}
.country-pill-flag{font-size:18px;}
.country-pill-code{font-size:9px;font-weight:700;color:${C.gray};letter-spacing:0.5px;}
.country-pill.active .country-pill-code{color:${C.gold};}
.country-banner{display:inline-flex;align-items:center;gap:8px;background:rgba(232,168,56,0.08);border:1px solid rgba(232,168,56,0.2);border-radius:20px;padding:6px 14px;margin-bottom:14px;font-size:12px;color:${C.gold};font-weight:600;}
.main{margin-left:240px;flex:1;min-height:100vh;}
.hero{background:linear-gradient(135deg,${C.navyL} 0%,${C.navy} 100%);padding:50px 56px 44px;border-bottom:1px solid rgba(232,168,56,0.1);position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;top:-60px;right:-60px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(232,168,56,0.07) 0%,transparent 70%);pointer-events:none;}
.hero-eyebrow{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.gold};margin-bottom:14px;font-weight:600;}
.hero-title{font-family:'Syne',sans-serif;font-size:34px;font-weight:800;line-height:1.15;color:${C.white};max-width:580px;}
.hero-title span{color:${C.gold};}
.hero-sub{margin-top:12px;font-size:14px;color:${C.gray};max-width:500px;line-height:1.75;}
.title-morph{display:inline-flex;align-items:center;gap:12px;margin-top:24px;background:rgba(232,168,56,0.08);border:1px solid rgba(232,168,56,0.2);border-radius:12px;padding:11px 18px;}
.morph-before{font-size:12px;color:${C.gray};text-decoration:line-through;}
.morph-arrow{color:${C.gold};font-size:16px;}
.morph-after{font-size:13px;color:${C.gold};font-weight:700;}
.morph-cursor{display:inline-block;width:2px;height:14px;background:${C.gold};margin-left:2px;animation:blink 1s infinite;vertical-align:middle;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.content{padding:36px 56px 56px;}
.panel{background:${C.navyL};border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden;margin-bottom:20px;}
.panel-header{padding:22px 30px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:13px;}
.panel-icon{font-size:22px;}
.panel-title{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;color:${C.white};}
.panel-subtitle{font-size:12px;color:${C.gray};margin-top:2px;}
.panel-body{padding:28px 30px;}
.btn{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .17s;font-family:'Inter',sans-serif;}
.btn-gold{background:${C.gold};color:${C.navy};}
.btn-gold:hover{background:${C.goldL};transform:translateY(-1px);}
.btn-green{background:${C.verified};color:${C.navy};}
.btn-green:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-outline{background:transparent;color:${C.gold};border:1.5px solid rgba(232,168,56,0.35);}
.btn-outline:hover{border-color:${C.gold};background:rgba(232,168,56,0.05);}
.btn-ghost{background:rgba(255,255,255,0.06);color:${C.cream};}
.btn-ghost:hover{background:rgba(255,255,255,0.1);}
.btn-red{background:rgba(231,76,60,0.12);color:#E74C3C;border:1px solid rgba(231,76,60,0.2);}
.btn-red:hover{background:rgba(231,76,60,0.2);}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important;}
.btn-sm{padding:7px 14px;font-size:12px;}
.input-field{width:100%;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:11px 14px;color:${C.cream};font-size:13px;font-family:'Inter',sans-serif;outline:none;transition:border-color .2s;margin-bottom:10px;}
.input-field:focus{border-color:rgba(232,168,56,0.4);}
.input-field.error{border-color:rgba(231,76,60,0.5);}
.input-label{font-size:11px;font-weight:600;color:${C.gray};margin-bottom:5px;letter-spacing:.4px;display:block;text-transform:uppercase;}
.select-field{width:100%;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:11px 14px;color:${C.cream};font-size:13px;font-family:'Inter',sans-serif;outline:none;appearance:none;cursor:pointer;margin-bottom:10px;}
.select-field:focus{border-color:rgba(232,168,56,0.4);}
.textarea-field{width:100%;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:12px 14px;color:${C.cream};font-size:13px;font-family:'Inter',sans-serif;outline:none;resize:vertical;transition:border-color .2s;margin-bottom:10px;min-height:100px;}
.textarea-field:focus{border-color:rgba(232,168,56,0.4);}
.textarea-field::placeholder{color:${C.gray};}
.row{display:flex;gap:12px;align-items:flex-start;}
.flex1{flex:1;min-width:0;}
.divider{height:1px;background:rgba(255,255,255,0.06);margin:20px 0;}
.tag{display:inline-flex;align-items:center;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:600;}
.tag-gold{background:rgba(232,168,56,0.12);color:${C.gold};border:1px solid rgba(232,168,56,0.2);}
.tag-green{background:rgba(45,106,79,0.2);color:${C.greenP};border:1px solid rgba(45,106,79,0.3);}
.tag-gray{background:rgba(255,255,255,0.06);color:${C.gray};}
.ai-response{background:rgba(0,0,0,0.2);border-radius:12px;padding:24px;border-left:3px solid ${C.gold};margin-top:20px;}
.ai-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.gold};margin-bottom:12px;font-weight:700;}
.ai-content{font-size:13px;color:${C.cream};line-height:1.85;white-space:pre-wrap;}
.thinking{display:flex;align-items:center;gap:12px;padding:18px;color:${C.gray};font-size:13px;}
.dots span{display:inline-block;width:5px;height:5px;border-radius:50%;background:${C.gold};margin:0 2px;animation:bounce 1.2s infinite;}
.dots span:nth-child(2){animation-delay:.2s;}
.dots span:nth-child(3){animation-delay:.4s;}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
.steps{display:flex;gap:5px;margin-bottom:24px;}
.step{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,0.07);}
.step.done{background:${C.gold};}
.step.active{background:rgba(232,168,56,0.35);}
.success-banner{background:rgba(0,200,150,0.08);border:1px solid rgba(0,200,150,0.2);border-radius:10px;padding:12px 18px;display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.success-text{font-size:13px;color:${C.verified};}
.warn-banner{background:rgba(232,168,56,0.07);border:1px solid rgba(232,168,56,0.2);border-radius:10px;padding:14px 18px;margin-bottom:16px;font-size:13px;color:${C.cream};line-height:1.7;}
.upload-zone{border:2px dashed rgba(232,168,56,0.25);border-radius:14px;padding:44px 36px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(232,168,56,0.02);}
.upload-zone:hover{border-color:${C.gold};background:rgba(232,168,56,0.04);}
.upload-icon{font-size:40px;margin-bottom:12px;}
.upload-title{font-size:16px;font-weight:600;color:${C.white};margin-bottom:5px;}
.upload-sub{font-size:13px;color:${C.gray};}
.upload-formats{margin-top:9px;font-size:10px;color:rgba(139,155,180,0.6);letter-spacing:1px;text-transform:uppercase;}
.game-shell{border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);}
.game-topbar{background:${C.navyM};padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.07);}
.game-company{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:${C.white};}
.game-role{font-size:12px;color:${C.gray};margin-top:2px;}
.game-progress{display:flex;align-items:center;gap:10px;}
.progress-dots{display:flex;gap:5px;}
.progress-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.12);transition:background .3s;}
.progress-dot.done{background:${C.gold};}
.progress-dot.active{background:${C.gold};box-shadow:0 0 8px ${C.gold};}
.game-body{background:${C.navyL};}
.interviewer-area{padding:32px 32px 0;display:flex;gap:20px;align-items:flex-start;}
.interviewer-avatar{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,rgba(232,168,56,0.2),rgba(232,168,56,0.05));display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;border:1px solid rgba(232,168,56,0.2);}
.interviewer-info{flex:1;}
.interviewer-name{font-size:14px;font-weight:700;color:${C.white};}
.interviewer-title{font-size:12px;color:${C.gray};}
.interviewer-speaking{display:flex;align-items:center;gap:6px;margin-top:4px;}
.speaking-dot{width:6px;height:6px;border-radius:50%;background:${C.verified};animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
.question-box{margin:20px 32px;background:rgba(0,0,0,0.18);border-radius:14px;padding:22px 24px;border-left:3px solid ${C.gold};}
.question-num{font-size:10px;color:${C.gold};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;}
.question-text{font-size:15px;color:${C.white};line-height:1.75;}
.voice-area{padding:24px 32px 32px;}
.voice-status{text-align:center;padding:28px;background:rgba(0,0,0,0.15);border-radius:14px;border:1px solid rgba(255,255,255,0.06);}
.mic-btn{width:70px;height:70px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px;transition:all .2s;}
.mic-btn.idle{background:rgba(232,168,56,0.12);border:2px solid rgba(232,168,56,0.3);}
.mic-btn.idle:hover{background:rgba(232,168,56,0.2);transform:scale(1.05);}
.mic-btn.recording{background:rgba(231,76,60,0.2);border:2px solid #E74C3C;animation:micPulse 1s infinite;}
@keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(231,76,60,0.4)}50%{box-shadow:0 0 0 12px rgba(231,76,60,0)}}
.voice-hint{font-size:12px;color:${C.gray};margin-bottom:12px;}
.transcript-box{background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 16px;min-height:60px;font-size:13px;color:${C.cream};line-height:1.7;margin:14px 0;text-align:left;}
.transcript-placeholder{color:rgba(139,155,180,0.5);font-style:italic;}
.voice-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
.timer-ring{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:2px solid rgba(232,168,56,0.3);font-size:13px;font-weight:700;color:${C.gold};}
.timer-ring.urgent{border-color:#E74C3C;color:#E74C3C;}
.result-screen{padding:28px 0;text-align:center;}
.result-badge{width:110px;height:110px;border-radius:28px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:40px;}
.result-badge.hired{background:rgba(0,200,150,0.15);border:2px solid ${C.verified};}
.result-badge.tryagain{background:rgba(231,76,60,0.12);border:2px solid #E74C3C;}
.result-title{font-family:'Syne',sans-serif;font-size:30px;font-weight:800;margin-bottom:8px;}
.result-title.hired{color:${C.verified};}
.result-title.tryagain{color:#E74C3C;}
.result-sub{font-size:14px;color:${C.gray};max-width:400px;margin:0 auto 32px;line-height:1.7;}
.score-row{display:flex;gap:16px;justify-content:center;margin-bottom:32px;flex-wrap:wrap;}
.score-pill{background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;text-align:center;min-width:100px;}
.score-pill-num{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:${C.gold};}
.score-pill-label{font-size:10px;color:${C.gray};text-transform:uppercase;letter-spacing:1px;margin-top:3px;}
.feedback-section{text-align:left;background:rgba(0,0,0,0.2);border-radius:14px;padding:24px;margin-bottom:16px;}
.feedback-title{font-size:13px;font-weight:700;color:${C.white};margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.feedback-item{display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;}
.feedback-dot{width:6px;height:6px;border-radius:50%;margin-top:7px;flex-shrink:0;}
.feedback-dot.good{background:${C.verified};}
.feedback-dot.improve{background:${C.gold};}
.feedback-text{font-size:13px;color:rgba(245,240,232,0.8);line-height:1.65;}
.buzzword-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px;}
.buzzword-chip{background:rgba(232,168,56,0.1);border:1px solid rgba(232,168,56,0.2);border-radius:16px;padding:4px 12px;font-size:11px;color:${C.gold};font-weight:600;}
.module-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
.module-card{background:${C.navyL};border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:22px;cursor:pointer;transition:all .2s;}
.module-card:hover{border-color:rgba(232,168,56,0.3);transform:translateY(-2px);}
.module-emoji{font-size:26px;margin-bottom:10px;}
.module-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:${C.white};margin-bottom:4px;}
.module-desc{font-size:12px;color:${C.gray};line-height:1.6;}
.module-cta{margin-top:12px;font-size:11px;font-weight:600;color:${C.gold};}
.verify-score{display:flex;align-items:center;gap:20px;background:rgba(0,200,150,0.06);border:1px solid rgba(0,200,150,0.2);border-radius:14px;padding:20px 24px;margin-bottom:24px;}
.score-ring{width:70px;height:70px;border-radius:50%;border:3px solid ${C.verified};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;}
.score-num{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${C.verified};line-height:1;}
.score-pct{font-size:9px;color:${C.gray};letter-spacing:1px;text-transform:uppercase;}
.score-info h3{font-size:14px;font-weight:700;color:${C.white};margin-bottom:4px;}
.score-info p{font-size:12px;color:${C.gray};line-height:1.6;}
.public-link{display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.07);border-radius:9px;padding:9px 14px;margin-top:10px;}
.public-link-url{font-size:12px;color:${C.gold};font-family:monospace;flex:1;}
.copy-btn{font-size:11px;padding:4px 10px;background:rgba(232,168,56,0.12);border:1px solid rgba(232,168,56,0.2);color:${C.gold};border-radius:6px;cursor:pointer;font-weight:600;white-space:nowrap;}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:16px;font-size:11px;font-weight:700;}
.status-verified{background:rgba(0,200,150,0.1);color:${C.verified};border:1px solid rgba(0,200,150,0.2);}
.status-pending{background:rgba(245,166,35,0.1);color:${C.pending};border:1px solid rgba(245,166,35,0.2);}
.status-unverified{background:rgba(139,155,180,0.1);color:${C.gray};border:1px solid rgba(139,155,180,0.15);}
.exp-card{background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.07);border-radius:13px;margin-bottom:12px;overflow:hidden;}
.exp-card-header{padding:16px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.exp-title{font-size:14px;font-weight:700;color:${C.white};}
.exp-company{font-size:12px;color:${C.gray};margin-top:2px;}
.exp-dates{font-size:11px;color:rgba(139,155,180,0.6);margin-top:2px;}
.ref-form-inner{background:rgba(0,0,0,0.15);border-radius:10px;padding:16px;margin:0 16px 16px;}
.email-status{font-size:11px;margin-top:4px;height:15px;}
.email-ok{color:${C.verified};}
.email-bad{color:#E74C3C;}
.chat-area{max-height:380px;overflow-y:auto;padding:4px 0;display:flex;flex-direction:column;gap:12px;}
.chat-area::-webkit-scrollbar{width:3px;}
.chat-area::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
.msg-row{display:flex;gap:9px;align-items:flex-start;}
.msg-row.user{flex-direction:row-reverse;}
.msg-av{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.msg-av.ai{background:rgba(232,168,56,0.12);}
.msg-av.user{background:rgba(45,106,79,0.2);}
.msg-bub{max-width:78%;padding:11px 15px;border-radius:12px;font-size:13px;line-height:1.7;}
.msg-bub.ai{background:rgba(255,255,255,0.05);color:${C.cream};border-radius:4px 12px 12px 12px;}
.msg-bub.user{background:rgba(232,168,56,0.1);color:${C.cream};border:1px solid rgba(232,168,56,0.15);border-radius:12px 4px 12px 12px;}
.chat-input-row{display:flex;gap:9px;margin-top:14px;}
.chat-input{flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:11px 15px;color:${C.cream};font-size:13px;font-family:'Inter',sans-serif;outline:none;resize:none;transition:border-color .2s;}
.chat-input:focus{border-color:rgba(232,168,56,0.4);}
.chat-input::placeholder{color:${C.gray};}
.culture-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.culture-card{background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;cursor:pointer;transition:border-color .2s;}
.culture-card:hover{border-color:rgba(232,168,56,0.2);}
.culture-card.open{border-color:${C.gold};}
.culture-title{font-size:13px;font-weight:700;color:${C.white};margin-bottom:10px;}
.culture-item{display:flex;gap:8px;margin-bottom:8px;align-items:flex-start;}
.culture-dot{width:4px;height:4px;border-radius:50%;background:${C.gold};margin-top:8px;flex-shrink:0;}
.culture-text{font-size:12px;color:rgba(245,240,232,0.7);line-height:1.65;}
.role-card{background:rgba(0,0,0,0.18);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 20px;margin-bottom:12px;}
.role-header{display:flex;justify-content:space-between;align-items:flex-start;}
.role-title{font-size:14px;font-weight:700;color:${C.white};}
.role-company{font-size:12px;color:${C.gray};margin-top:2px;}
.role-salary{font-size:13px;font-weight:600;color:${C.gold};}
.role-why{font-size:12px;color:rgba(245,240,232,0.65);margin-top:8px;line-height:1.6;border-top:1px solid rgba(255,255,255,0.05);padding-top:8px;}
.stronger-q{font-size:12px;font-weight:700;color:${C.gold};margin-bottom:6px;}
.stronger-orig{font-size:12px;color:${C.gray};margin-bottom:4px;}
.stronger-box{background:rgba(0,200,150,0.06);border:1px solid rgba(0,200,150,0.15);border-radius:9px;padding:12px 14px;font-size:12px;color:${C.cream};line-height:1.75;}
.stronger-tag{color:${C.verified};font-weight:700;font-size:10px;display:block;margin-bottom:6px;}
@media(max-width:860px){.sidebar{width:200px;}.main{margin-left:200px;}.hero{padding:36px 28px 32px;}.content{padding:24px 28px 40px;}.module-grid,.culture-grid{grid-template-columns:1fr;}}

/* FEEDBACK WIDGET */
.feedback-fab{position:fixed;bottom:28px;right:28px;z-index:999;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.feedback-btn{width:52px;height:52px;border-radius:50%;background:${C.gold};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 20px rgba(232,168,56,0.4);transition:all .2s;}
.feedback-btn:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(232,168,56,0.5);}
.feedback-panel{background:${C.navyL};border:1px solid rgba(232,168,56,0.2);border-radius:18px;padding:24px;width:320px;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:slideUp .2s ease;}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.feedback-panel-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:${C.white};margin-bottom:4px;}
.feedback-panel-sub{font-size:12px;color:${C.gray};margin-bottom:18px;line-height:1.6;}
.star-row{display:flex;gap:6px;margin-bottom:16px;}
.star{font-size:28px;cursor:pointer;transition:transform .15s;line-height:1;}
.star:hover{transform:scale(1.2);}
.rating-label{font-size:11px;color:${C.gray};margin-top:-10px;margin-bottom:14px;height:16px;}
.feedback-textarea{width:100%;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:11px 14px;color:${C.cream};font-size:13px;font-family:'Inter',sans-serif;outline:none;resize:none;transition:border-color .2s;margin-bottom:10px;}
.feedback-textarea:focus{border-color:rgba(232,168,56,0.4);}
.feedback-textarea::placeholder{color:${C.gray};}
.feedback-submitted{text-align:center;padding:12px 0;}
.feedback-submitted-icon{font-size:40px;margin-bottom:10px;}
.feedback-submitted-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:${C.verified};margin-bottom:6px;}
.feedback-submitted-sub{font-size:12px;color:${C.gray};line-height:1.6;}
@media(max-width:600px){.feedback-fab{bottom:16px;right:16px;}.feedback-panel{width:calc(100vw - 32px);}}
`;

function TitleMorph({pairs}){
  const MORPH = pairs;
  const [idx,setIdx]=useState(0);
  const [disp,setDisp]=useState("");
  const [phase,setPhase]=useState("typing");
  useEffect(()=>{
    setIdx(0);setDisp("");setPhase("typing");
  },[pairs]);
  useEffect(()=>{
    const target=MORPH[idx % MORPH.length][1];
    let i=0;
    if(phase==="typing"){
      const t=setInterval(()=>{setDisp(target.slice(0,i+1));i++;if(i>=target.length){clearInterval(t);setTimeout(()=>setPhase("waiting"),1800);}},40);
      return()=>clearInterval(t);
    }
    if(phase==="waiting"){const t=setTimeout(()=>setPhase("erasing"),1200);return()=>clearTimeout(t);}
    if(phase==="erasing"){
      const t=setInterval(()=>{setDisp(p=>{if(p.length<=1){clearInterval(t);setPhase("next");return"";}return p.slice(0,-1);});},25);
      return()=>clearInterval(t);
    }
    if(phase==="next"){setIdx(p=>(p+1)%MORPH.length);setPhase("typing");}
  },[phase,idx,pairs]);
  return(
    <div className="title-morph">
      <span className="morph-before">{MORPH[idx % MORPH.length][0]}</span>
      <span className="morph-arrow">→</span>
      <span className="morph-after">{disp}<span className="morph-cursor"/></span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// RESUME TRANSFORMER + CONFIDENCE CHECK
// ───────────────────────────────────────────────────────────────────────────
function ResumeModule({country}){
  const [step,setStep]=useState(0);
  const [resumeText,setResumeText]=useState("");
  const [fileName,setFileName]=useState("");
  const [targetRole,setTargetRole]=useState("");
  const [industry,setIndustry]=useState("Finance");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState("");
  const [confMessages,setConfMessages]=useState([]);
  const [confInput,setConfInput]=useState("");
  const [confLoading,setConfLoading]=useState(false);
  const [approved,setApproved]=useState(false);
  const [inputMode,setInputMode]=useState("paste"); // "paste" | "upload"
  const [pasteText,setPasteText]=useState("");
  const inputRef=useRef();
  const confRef=useRef();

  const handleFile=(f)=>{
    if(!f)return;
    setFileName(f.name);
    const reader=new FileReader();
    reader.onload=(e)=>{setResumeText(e.target.result);setStep(1);};
    reader.readAsText(f);
  };

  const handlePaste=()=>{
    if(!pasteText.trim())return;
    setResumeText(pasteText);
    setFileName("Pasted CV");
    setStep(1);
  };

  const transform=async()=>{
    setLoading(true);setStep(2);
    const morphExamples=country.morphPairs.map(([a,b])=>`${a}→${b}`).join(", ");
    const sys=`You are BridgeWork AI. Transform African/international resumes/CVs to ${country.name} standard.
1. TITLE TRANSLATION: Elevate titles to ${country.name} equivalents (examples: ${morphExamples})
2. QUANTIFY: Add numbers and impact wherever reasonable
3. FORMAT: ${country.formatNotes}
4. REMOVE: Photos, nationality, age, marital status
5. TAILOR: Align language to target role if given
6. Use the term "${country.docName}" instead of generic "resume" in any section headers
Output sections in order: "TITLE TRANSLATIONS MADE", then the full transformed ${country.docName}, then "KEY UPGRADES" (top 5 changes made).`;
    const res=await callClaude([{role:"user",content:`Transform for a ${industry} professional targeting: ${targetRole||`senior ${country.name} roles`}.\n\nORIGINAL RESUME:\n${resumeText}`}],sys,1300);
    setResult(res);setLoading(false);
    setTimeout(()=>startConfidence(res),400);
  };

  const startConfidence=async(transformedResume)=>{
    setStep(3);setConfLoading(true);
    const sys=`You are BridgeWork AI's ${country.docName} Confidence Coach. Your job: make sure the candidate can genuinely own every word on their new ${country.name}-format ${country.docName.toLowerCase()} before they apply anywhere.

Open by asking, warmly but directly:
1. Does this sound like THEM — their real experience, real achievements?
2. Could they walk into an interview tomorrow and confidently defend every single bullet point?
3. Is there anything that feels exaggerated or that they couldn't explain if pressed?

Keep it conversational, 2-4 sentences. If they raise a concern about a specific line, help them rework it into something powerful AND true to their experience. The goal is pride and readiness, not a stranger's ${country.docName.toLowerCase()}.`;
    const opening=await callClaude([{role:"user",content:`Here is my transformed ${country.docName.toLowerCase()}:\n\n${transformedResume}\n\nWhat should I think about before I start applying?`}],sys);
    setConfMessages([{role:"assistant",content:opening}]);setConfLoading(false);
  };

  const sendConf=async(overrideText)=>{
    const text=overrideText??confInput;
    if(!text.trim()||confLoading)return;
    const userMsg={role:"user",content:text};
    const newMsgs=[...confMessages,userMsg];
    setConfMessages(newMsgs);setConfInput("");setConfLoading(true);
    const sys=`You are BridgeWork AI's Resume Confidence Coach. Help the candidate feel genuinely confident about their transformed resume. If they raise a concern about any bullet, rework it to be powerful AND authentic — never tell them to just "trust it," actually help fix the language. If they signal approval or readiness, respond warmly and tell them their resume is ready to use.`;
    const reply=await callClaude(newMsgs,sys);
    setConfMessages(m=>[...m,{role:"assistant",content:reply}]);setConfLoading(false);
    const approvalWords=["ready","confident","happy","looks good","sounds like me","love it","perfect","yes,","approved","go ahead","i'm good","im good"];
    if(approvalWords.some(w=>text.toLowerCase().includes(w)))setApproved(true);
    setTimeout(()=>confRef.current?.scrollTo({top:99999,behavior:"smooth"}),100);
  };

  return(
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">📄</span>
        <div><div className="panel-title">{country.docName} Transformer</div><div className="panel-subtitle">Upload → Transform → Confidence Check → Ready to apply ({country.flag} {country.name})</div></div>
      </div>
      <div className="panel-body">
        <div className="steps">{["Upload","Options","Transform","Confidence"].map((s,i)=><div key={s} className={`step ${step>i?"done":step===i?"active":""}`}/>)}</div>

        {step===0&&(
          <div>
            {/* Mode tabs */}
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <button onClick={()=>setInputMode("paste")}
                className={`btn ${inputMode==="paste"?"btn-gold":"btn-ghost"}`}
                style={{flex:1,justifyContent:"center",fontSize:13}}>
                📋 Paste CV Text
              </button>
              <button onClick={()=>setInputMode("upload")}
                className={`btn ${inputMode==="upload"?"btn-gold":"btn-ghost"}`}
                style={{flex:1,justifyContent:"center",fontSize:13}}>
                📁 Upload .txt File
              </button>
            </div>

            {/* PASTE MODE */}
            {inputMode==="paste"&&(
              <div>
                <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:12,color:C.cream,lineHeight:1.7}}>
                  💡 <strong style={{color:C.verified}}>Easiest method:</strong> Open your CV in Word, Google Docs, or any app → Select All → Copy → Paste below. Works with any format.
                </div>
                <label className="input-label">Paste your {country.docName} text here</label>
                <textarea className="textarea-field" style={{minHeight:200}}
                  placeholder={`Paste your full ${country.docName.toLowerCase()} text here...\n\nExample:\nJohn Doe\njohn@email.com\n\nExperience:\nBranch Manager, Zenith Bank (2018-2022)\n- Managed team of 25 staff...\n\nEducation:\nBSc Economics, University of Lagos`}
                  value={pasteText} onChange={e=>setPasteText(e.target.value)}/>
                <button className="btn btn-gold" onClick={handlePaste} disabled={!pasteText.trim()} style={{width:"100%",justifyContent:"center"}}>
                  ✨ Transform My {country.docName}
                </button>
              </div>
            )}

            {/* UPLOAD MODE */}
            {inputMode==="upload"&&(
              <div>
                <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:12,color:C.cream,lineHeight:1.7}}>
                  ⚠️ Only <strong style={{color:C.gold}}>.txt files</strong> work right now. To convert your CV: open in Google Docs → File → Download → Plain Text (.txt)
                </div>
                <div className="upload-zone" onClick={()=>inputRef.current.click()}
                  onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}>
                  <input ref={inputRef} type="file" accept=".txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
                  <div className="upload-icon">📤</div>
                  <div className="upload-title">Drop your .txt file here</div>
                  <div className="upload-sub">or click to browse</div>
                  <div className="upload-formats">TXT files only</div>
                </div>
              </div>
            )}
          </div>
        )}

        {step===1&&(
          <div>
            <div className="success-banner"><span>✅</span><span className="success-text">Loaded: <strong>{fileName}</strong></span></div>
            <label className="input-label">Target Role</label>
            <input className="input-field" placeholder="e.g. VP of Finance, Director of Operations" value={targetRole} onChange={e=>setTargetRole(e.target.value)}/>
            <label className="input-label">Industry</label>
            <select className="select-field" value={industry} onChange={e=>setIndustry(e.target.value)}>
              {["Finance","Banking","Technology","Healthcare","Consulting","Operations","Marketing","Legal","Engineering","HR"].map(v=><option key={v}>{v}</option>)}
            </select>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <button className="btn btn-gold" onClick={transform}>✨ Transform My {country.docName}</button>
              <button className="btn btn-ghost" onClick={()=>setStep(0)}>Back</button>
            </div>
          </div>
        )}

        {step===2&&(
          <div>
            {loading
              ? <div className="thinking"><div className="dots"><span/><span/><span/></div>Transforming to {country.name} standards...</div>
              : <div className="ai-response"><div className="ai-label">{country.flag} Transformed {country.docName}</div><div className="ai-content">{result}</div></div>}
          </div>
        )}

        {step===3&&(
          <div>
            {approved&&(
              <div className="success-banner" style={{marginBottom:18}}>
                <span>🎉</span><span className="success-text"><strong>{country.docName} approved!</strong> You're ready to apply.</span>
              </div>
            )}
            <div className="warn-banner">
              🪞 <strong>Confidence Check</strong> — Before you apply anywhere: does this {country.docName.toLowerCase()} sound like <em>you</em>? Could you defend every bullet in the room?
            </div>
            <div className="chat-area" ref={confRef} style={{maxHeight:280}}>
              {confMessages.map((m,i)=>(
                <div key={i} className={`msg-row${m.role==="user"?" user":""}`}>
                  <div className={`msg-av${m.role==="assistant"?" ai":" user"}`}>{m.role==="assistant"?"🤖":"👤"}</div>
                  <div className={`msg-bub${m.role==="assistant"?" ai":" user"}`}>{m.content}</div>
                </div>
              ))}
              {confLoading&&<div className="msg-row"><div className="msg-av ai">🤖</div><div className="msg-bub ai"><div className="dots"><span/><span/><span/></div></div></div>}
            </div>
            <div className="chat-input-row">
              <textarea className="chat-input" rows={2} placeholder="How do you feel about it? Any bullet you're unsure about?" value={confInput} onChange={e=>setConfInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendConf();}}}/>
              <button className="btn btn-gold" onClick={()=>sendConf()} disabled={!confInput.trim()||confLoading} style={{alignSelf:"flex-end",padding:"11px 16px"}}>Send</button>
            </div>
            <div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Yes, it sounds like me!","I'm not sure about one bullet","It feels exaggerated","I'm ready to apply 🚀"].map(q=>(
                <button key={q} className="btn btn-ghost btn-sm" onClick={()=>sendConf(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// INTERVIEW SIMULATION — Multi-panelist version
// ───────────────────────────────────────────────────────────────────────────
const ALL_PANELISTS=[
  {id:"hm",  name:"Alex Rivera",   title:"Hiring Manager",    avatar:"👔", color:"#E8A838", focus:"strategic fit, leadership, big picture decisions",     questionType:"behavioral & leadership"},
  {id:"tl",  name:"Dr. Priya Nair",title:"Technical Lead",    avatar:"👩‍💻", color:"#6C63FF", focus:"technical skills, problem solving, domain knowledge",    questionType:"technical & skills-based"},
  {id:"hr",  name:"Sarah Mitchell",title:"HR Director",       avatar:"👩‍💼", color:"#00C896", focus:"culture fit, values, communication, team dynamics",       questionType:"culture & behavioral"},
  {id:"cfo", name:"James Okafor",  title:"CFO / Finance",     avatar:"💼",  color:"#E07A5F", focus:"numbers, ROI, budget management, financial impact",        questionType:"financial & data-driven"},
  {id:"dei", name:"Amara Diallo",  title:"DEI & Culture Lead",avatar:"🌍",  color:"#52B788", focus:"inclusion, global perspective, diverse team collaboration", questionType:"values & global mindset"},
];

const TOTAL_Q=6;
function InterviewGame({country}){
  const [phase,setPhase]=useState("setup");
  const [setup,setSetup]=useState({company:"",role:"",jobDesc:"",resumeText:""});
  const [selectedPanelists,setSelectedPanelists]=useState(["hm"]); // default: Hiring Manager only
  const [panelCount,setPanelCount]=useState(1);
  const [questions,setQuestions]=useState([]); // [{q, panelistId}]
  const [answers,setAnswers]=useState([]);
  const [currentQ,setCurrentQ]=useState(0);
  const [transcript,setTranscript]=useState("");
  const [isRecording,setIsRecording]=useState(false);
  const [timer,setTimer]=useState(120);
  const [timerActive,setTimerActive]=useState(false);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [textMode,setTextMode]=useState(false);
  const [textInput,setTextInput]=useState("");
  const [perFeedback,setPerFeedback]=useState(null);
  const [perFeedbackLoading,setPerFeedbackLoading]=useState(false);
  const [showingFeedback,setShowingFeedback]=useState(false);
  const recogRef=useRef(null);
  const timerRef=useRef(null);

  // Auto-select panelists when count changes
  useEffect(()=>{
    setSelectedPanelists(ALL_PANELISTS.slice(0,panelCount).map(p=>p.id));
  },[panelCount]);

  const activePanelists=ALL_PANELISTS.filter(p=>selectedPanelists.includes(p.id));
  const currentPanelist=questions[currentQ]
    ? ALL_PANELISTS.find(p=>p.id===questions[currentQ].panelistId)||activePanelists[0]
    : activePanelists[0];

  useEffect(()=>{
    if(timerActive&&timer>0){timerRef.current=setTimeout(()=>setTimer(t=>t-1),1000);}
    return()=>clearTimeout(timerRef.current);
  },[timerActive,timer]);

  const startRecording=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setTextMode(true);return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{
      let finalText="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)finalText+=e.results[i][0].transcript+" ";
      }
      if(finalText)setTranscript(prev=>prev+finalText);
    };
    r.onerror=()=>{setIsRecording(false);setTimerActive(false);};
    r.start();recogRef.current=r;setIsRecording(true);setTimerActive(true);
  };
  const stopRecording=()=>{
    try{recogRef.current?.stop();}catch{}
    setIsRecording(false);setTimerActive(false);clearTimeout(timerRef.current);
  };
  const resetAnswer=()=>{setTranscript("");setTimer(120);stopRecording();};

  const submitAnswer=async()=>{
    const ans=transcript||textInput;
    if(!ans.trim())return;
    const panelist=currentPanelist;
    const updated=[...answers,{q:questions[currentQ]?.q||questions[currentQ],a:ans,panelistId:panelist.id,panelistName:panelist.name}];
    setAnswers(updated);
    setTranscript("");setTextInput("");setTimer(120);stopRecording();
    setShowingFeedback(true);setPerFeedback(null);setPerFeedbackLoading(true);
    const sys=`You are ${panelist.name}, ${panelist.title}, giving instant feedback on ONE interview answer. Your focus area: ${panelist.focus}. Be direct and specific. Return ONLY a JSON object (no markdown):
{
  "score": number 0-10,
  "scoreLabel": "Weak"|"Fair"|"Good"|"Strong"|"Excellent",
  "usedSTAR": true or false,
  "panelistReaction": "One sentence in ${panelist.name}'s voice — what they thought of the answer from their ${panelist.title} perspective",
  "strength": "One specific thing done well",
  "improvement": "One specific thing to improve",
  "strongerOpener": "Rewrite just the first sentence of their answer to be more impactful"
}`;
    const res=await callClaude([{role:"user",content:`Role: ${setup.role} at ${setup.company}\nQuestion asked by ${panelist.name} (${panelist.title}): ${questions[currentQ]?.q||questions[currentQ]}\nAnswer: ${ans}`}],sys,400);
    try{
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
      setPerFeedback(JSON.parse(clean.slice(s,e)));
    }catch{
      setPerFeedback({score:7,scoreLabel:"Good",usedSTAR:false,panelistReaction:`${panelist.name} nodded — you showed some relevant experience but could be more specific.`,strength:"You answered the question directly.",improvement:"Add specific numbers and outcomes.",strongerOpener:"In my previous role, I directly led..."});
    }
    setPerFeedbackLoading(false);
  };

  const continueAfterFeedback=()=>{
    setShowingFeedback(false);setPerFeedback(null);
    if(currentQ+1>=TOTAL_Q){generateResult([...answers]);}
    else{setCurrentQ(q=>q+1);}
  };

  const generateQuestions=async()=>{
    setLoading(true);setPhase("briefing");
    const styleNote=country.code==="UK"?"UK competency-based style, reserved tone.":country.code==="CA"?"Canadian collaborative style.":"US direct, achievement-focused style.";
    const panelistContext=activePanelists.map(p=>`${p.name} (${p.title}) focuses on: ${p.focus}`).join("; ");
    const sys=`You are coordinating a panel interview at ${setup.company} for ${setup.role} in ${country.name}.
Panel: ${panelistContext}
Generate exactly ${TOTAL_Q} interview questions distributed across panelists. ${styleNote}
Return ONLY a JSON array of ${TOTAL_Q} objects — no other text:
[{"q":"question text","panelistId":"one of: ${activePanelists.map(p=>p.id).join(",")}"}]
Distribute questions roughly evenly. Each panelist asks questions aligned with their focus area.`;
    const res=await callClaude([{role:"user",content:`Job Description:\n${setup.jobDesc}\n\nCandidate Resume:\n${setup.resumeText||"Not provided"}`}],sys);
    try{
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("[");const e=clean.lastIndexOf("]")+1;
      const parsed=JSON.parse(clean.slice(s,e));
      setQuestions(parsed.length?parsed:fallbackQuestions());
    }catch{setQuestions(fallbackQuestions());}
    setLoading(false);setPhase("interview");
  };

  const fallbackQuestions=()=>{
    const qs=["Tell me about yourself and why you're interested in this role.","What's your greatest professional achievement?","Describe a time you led a team through a difficult challenge.","How do you handle conflict with a colleague?","Why do you want to work at "+setup.company+"?","Where do you see yourself in five years?"];
    return qs.map((q,i)=>({q,panelistId:activePanelists[i%activePanelists.length].id}));
  };

  const generateResult=async(allAnswers)=>{
    setPhase("result");setLoading(true);
    const panelistNames=activePanelists.map(p=>`${p.name} (${p.title})`).join(", ");
    const sys=`You are the hiring panel: ${panelistNames}. Evaluate this candidate for ${setup.role} at ${setup.company} in ${country.name}.
Return ONLY a JSON object (no markdown):
{
"decision":"HIRED" or "TRY AGAIN",
"overallScore":number 0-100,
"starScore":number 0-100,
"confidenceScore":number 0-100,
"relevanceScore":number 0-100,
"panelistVerdicts":[{"name":"panelist name","verdict":"1 sentence reaction from their specific perspective"}],
"strengths":[3 specific things they did well],
"improvements":[3 specific things to improve],
"missedBuzzwords":[8-12 technical terms relevant to this role and ${country.name} market],
"strongerResponses":[{"q":"question","original":"brief paraphrase","improved":"stronger STAR answer with buzzwords"}] for 2 weakest answers,
"hiringVerdict":"2-3 sentence panel decision explanation"
}`;
    const transcriptText=allAnswers.map((a,i)=>`Q${i+1} [Asked by ${a.panelistName||"Interviewer"}]: ${a.q?.q||a.q}\nA: ${a.a}`).join("\n\n");
    const res=await callClaude([{role:"user",content:`Job: ${setup.role} at ${setup.company} (${country.name})\nJob Description:\n${setup.jobDesc}\n\nInterview Transcript:\n${transcriptText}`}],sys,1800);
    try{
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
      setResult(JSON.parse(clean.slice(s,e)));
    }catch{
      setResult({decision:"TRY AGAIN",overallScore:62,starScore:55,confidenceScore:60,relevanceScore:65,
        panelistVerdicts:activePanelists.map(p=>({name:p.name,verdict:"Showed potential but needs sharper, more structured answers."})),
        strengths:["Showed genuine enthusiasm","Drew on relevant experience","Answered all questions"],
        improvements:["Use specific numbers","Structure with STAR method","Research company more deeply"],
        missedBuzzwords:["KPI","stakeholder management","cross-functional","ROI","process optimization","agile"],
        strongerResponses:[],
        hiringVerdict:"Solid potential but answers need more structure and concrete results."});
    }
    setLoading(false);
  };

  const restart=()=>{
    setPhase("setup");setSetup({company:"",role:"",jobDesc:"",resumeText:""});
    setQuestions([]);setAnswers([]);setCurrentQ(0);setTranscript("");setResult(null);
    setTimer(120);setIsRecording(false);setTimerActive(false);setTextMode(false);setTextInput("");
    setPerFeedback(null);setPerFeedbackLoading(false);setShowingFeedback(false);
    setPanelCount(1);setSelectedPanelists(["hm"]);
  };

  // ── SETUP SCREEN ──
  if(phase==="setup")return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">🎮</span><div><div className="panel-title">Interview Simulation</div><div className="panel-subtitle">{country.flag} {country.name} · Voice answers · Panel or 1-on-1</div></div></div>
      <div className="panel-body">
        <div className="warn-banner">🎯 Paste the real job description. Questions are generated specifically from it — just like a real {country.name} interviewer would.</div>

        {/* PANELIST SELECTOR */}
        <div style={{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:"20px 22px",marginBottom:20,border:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:4}}>Who's interviewing you?</div>
          <div style={{fontSize:12,color:C.gray,marginBottom:16}}>Choose how many panelists. Each brings a different focus — the more panelists, the harder and more realistic.</div>

          {/* Count selector */}
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {[1,2,3,4,5].map(n=>(
              <div key={n} onClick={()=>setPanelCount(n)}
                style={{flex:1,textAlign:"center",padding:"10px 6px",borderRadius:10,cursor:"pointer",
                  background:panelCount===n?"rgba(232,168,56,0.15)":"rgba(255,255,255,0.03)",
                  border:`1.5px solid ${panelCount===n?C.gold:"rgba(255,255,255,0.08)"}`,transition:"all .2s"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:panelCount===n?C.gold:C.gray}}>{n}</div>
                <div style={{fontSize:9,color:panelCount===n?C.gold:C.gray,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{n===1?"Solo":n===2?"Duo":n===3?"Panel":n===4?"Full Panel":"Max Panel"}</div>
              </div>
            ))}
          </div>

          {/* Panelist cards */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {ALL_PANELISTS.slice(0,panelCount).map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:11,background:"rgba(255,255,255,0.03)",border:`1px solid ${p.color}30`}}>
                <div style={{width:38,height:38,borderRadius:10,background:`${p.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,border:`1px solid ${p.color}30`}}>{p.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.white}}>{p.name}</div>
                  <div style={{fontSize:11,color:p.color,marginTop:1}}>{p.title}</div>
                  <div style={{fontSize:11,color:C.gray,marginTop:2}}>Asks: {p.questionType}</div>
                </div>
                <div style={{fontSize:10,color:C.gray,textAlign:"right"}}>Q{i+1}{panelCount>1?`–Q${Math.ceil((i+1)*TOTAL_Q/panelCount)}`:` to Q${TOTAL_Q}`}</div>
              </div>
            ))}
          </div>

          {panelCount>1&&(
            <div style={{marginTop:12,fontSize:12,color:C.gray,lineHeight:1.6,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
              💡 With {panelCount} panelists, each interviewer will ask ~{Math.round(TOTAL_Q/panelCount)} questions from their area of expertise. You'll see who's asking before each question.
            </div>
          )}
        </div>

        {/* Job details */}
        <div className="row">
          <div className="flex1"><label className="input-label">Company Name</label><input className="input-field" placeholder="e.g. JPMorgan Chase" value={setup.company} onChange={e=>setSetup(p=>({...p,company:e.target.value}))}/></div>
          <div className="flex1"><label className="input-label">Job Title</label><input className="input-field" placeholder="e.g. VP of Operations" value={setup.role} onChange={e=>setSetup(p=>({...p,role:e.target.value}))}/></div>
        </div>
        <label className="input-label">Job Description</label>
        <textarea className="textarea-field" style={{minHeight:100}} placeholder="Paste the full job description..." value={setup.jobDesc} onChange={e=>setSetup(p=>({...p,jobDesc:e.target.value}))}/>
        <label className="input-label">Your {country.docName} (optional)</label>
        <textarea className="textarea-field" placeholder={`Paste your ${country.docName.toLowerCase()} so questions probe YOUR background...`} value={setup.resumeText} onChange={e=>setSetup(p=>({...p,resumeText:e.target.value}))}/>
        <button className="btn btn-gold" style={{marginTop:6,width:"100%",justifyContent:"center"}}
          disabled={!setup.company||!setup.role||!setup.jobDesc||loading} onClick={generateQuestions}>
          🎬 Start {panelCount>1?`Panel Interview (${panelCount} interviewers)`:"Interview"}
        </button>
      </div>
    </div>
  );

  // ── BRIEFING SCREEN ──
  if(phase==="briefing")return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">📋</span><div><div className="panel-title">Preparing Your Interview</div><div className="panel-subtitle">{setup.role} at {setup.company} · {activePanelists.length} interviewer{activePanelists.length>1?"s":""}</div></div></div>
      <div className="panel-body">
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,color:C.gray,marginBottom:14}}>Your panel today:</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {activePanelists.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:`1px solid ${p.color}30`}}>
                <span style={{fontSize:18}}>{p.avatar}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.white}}>{p.name}</div>
                  <div style={{fontSize:10,color:p.color}}>{p.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="thinking"><div className="dots"><span/><span/><span/></div>Building {TOTAL_Q} targeted questions across your panel...</div>
      </div>
    </div>
  );

  // ── RESULT SCREEN ──
  if(phase==="result")return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">📊</span><div><div className="panel-title">Panel Decision</div><div className="panel-subtitle">{setup.role} at {setup.company}</div></div></div>
      <div className="panel-body">
        {loading
          ? <div className="thinking"><div className="dots"><span/><span/><span/></div>Panel is deliberating...</div>
          : result && (
            <>
              <div className="result-screen">
                <div className={`result-badge ${result.decision==="HIRED"?"hired":"tryagain"}`}>{result.decision==="HIRED"?"🎉":"💪"}</div>
                <div className={`result-title ${result.decision==="HIRED"?"hired":"tryagain"}`}>{result.decision==="HIRED"?"YOU'RE HIRED!":"TRY AGAIN"}</div>
                <div className="result-sub">{result.hiringVerdict}</div>
                <div className="score-row">
                  {[["Overall",result.overallScore],["STAR Method",result.starScore],["Confidence",result.confidenceScore],["Relevance",result.relevanceScore]].map(([l,v])=>(
                    <div key={l} className="score-pill"><div className="score-pill-num">{v}</div><div className="score-pill-label">{l}</div></div>
                  ))}
                </div>
              </div>

              {/* Panelist verdicts */}
              {result.panelistVerdicts?.length>0&&(
                <div className="feedback-section">
                  <div className="feedback-title">🗣️ What Each Panelist Thought</div>
                  {result.panelistVerdicts.map((pv,i)=>{
                    const p=ALL_PANELISTS.find(p=>pv.name?.includes(p.name.split(" ")[0]))||ALL_PANELISTS[i%ALL_PANELISTS.length];
                    return(
                      <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12,padding:"12px 14px",background:"rgba(0,0,0,0.15)",borderRadius:11,border:`1px solid ${p.color}25`}}>
                        <div style={{width:34,height:34,borderRadius:9,background:`${p.color}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{p.avatar}</div>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:p.color,marginBottom:3}}>{pv.name}</div>
                          <div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{pv.verdict}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="feedback-section">
                <div className="feedback-title">✅ What You Did Well</div>
                {(result.strengths||[]).map((s,i)=><div key={i} className="feedback-item"><div className="feedback-dot good"/><div className="feedback-text">{s}</div></div>)}
              </div>
              <div className="feedback-section">
                <div className="feedback-title">🔧 Areas to Strengthen</div>
                {(result.improvements||[]).map((s,i)=><div key={i} className="feedback-item"><div className="feedback-dot improve"/><div className="feedback-text">{s}</div></div>)}
              </div>
              {result.missedBuzzwords?.length>0&&(
                <div className="feedback-section">
                  <div className="feedback-title">⚡ Buzzwords You Should Have Used</div>
                  <div style={{fontSize:12,color:C.gray,marginBottom:10}}>Weave these naturally into your next attempt.</div>
                  <div className="buzzword-chips">{result.missedBuzzwords.map((w,i)=><div key={i} className="buzzword-chip">{w}</div>)}</div>
                </div>
              )}
              {result.strongerResponses?.length>0&&(
                <div className="feedback-section">
                  <div className="feedback-title">💬 Stronger Versions of Your Weakest Answers</div>
                  {result.strongerResponses.map((sr,i)=>(
                    <div key={i} style={{marginBottom:16}}>
                      <div className="stronger-q">Q: {sr.q}</div>
                      <div className="stronger-orig">You said: <em>{sr.original}</em></div>
                      <div className="stronger-box"><span className="stronger-tag">✓ STRONGER VERSION</span>{sr.improved}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:8}}>
                <button className="btn btn-gold" onClick={restart}>🔄 Try Another Interview</button>
              </div>
            </>
          )}
      </div>
    </div>
  );

  // ── INTERVIEW SCREEN ──
  const currentQ_data=questions[currentQ];
  const questionText=typeof currentQ_data==="string"?currentQ_data:currentQ_data?.q||"";
  const fmt=(s)=>{const m=Math.floor(s/60);const sec=s%60;return`${m}:${sec.toString().padStart(2,"0")}`;};

  return(
    <div className="game-shell">
      <div className="game-topbar">
        <div><div className="game-company">{setup.company}</div><div className="game-role">{setup.role}</div></div>
        <div className="game-progress">
          <span style={{fontSize:12,color:C.gray}}>Q{currentQ+1}/{TOTAL_Q}</span>
          <div className="progress-dots">{questions.map((_,i)=><div key={i} className={`progress-dot ${i<currentQ?"done":i===currentQ?"active":""}`}/>)}</div>
        </div>
      </div>
      <div className="game-body">
        {/* PANELIST HEADER */}
        <div className="interviewer-area">
          <div className="interviewer-avatar" style={{background:`${currentPanelist.color}18`,border:`1px solid ${currentPanelist.color}30`,fontSize:"26px"}}>{currentPanelist.avatar}</div>
          <div className="interviewer-info">
            <div className="interviewer-name" style={{color:C.white}}>{currentPanelist.name}</div>
            <div className="interviewer-title" style={{color:currentPanelist.color}}>{currentPanelist.title}</div>
            {activePanelists.length>1&&(
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                <div className="speaking-dot" style={{background:currentPanelist.color}}/>
                <span style={{fontSize:11,color:currentPanelist.color}}>Asking from their {currentPanelist.questionType} lens</span>
              </div>
            )}
          </div>
          {/* Other panelists mini avatars */}
          {activePanelists.length>1&&(
            <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
              {activePanelists.filter(p=>p.id!==currentPanelist.id).map(p=>(
                <div key={p.id} title={p.name} style={{width:30,height:30,borderRadius:8,background:`${p.color}10`,border:`1px solid ${p.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:0.6}}>{p.avatar}</div>
              ))}
            </div>
          )}
          <div className={`timer-ring${timer<=30?" urgent":""}`}>{fmt(timer)}</div>
        </div>

        {/* QUESTION */}
        <div className="question-box" style={{borderLeftColor:currentPanelist.color}}>
          <div className="question-num" style={{color:currentPanelist.color}}>Question {currentQ+1} of {TOTAL_Q} · {currentPanelist.name}</div>
          <div className="question-text">{questionText}</div>
        </div>

        {/* VOICE / TEXT INPUT + PER-FEEDBACK */}
        <div className="voice-area">
          {showingFeedback?(
            <div>
              {perFeedbackLoading?(
                <div className="thinking" style={{justifyContent:"center",padding:32}}>
                  <div className="dots"><span/><span/><span/></div>
                  {currentPanelist.name} is reviewing your answer...
                </div>
              ):perFeedback&&(
                <div>
                  {/* Panelist reaction pill */}
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:"14px 16px",background:`${currentPanelist.color}10`,border:`1px solid ${currentPanelist.color}25`,borderRadius:12,marginBottom:14}}>
                    <span style={{fontSize:20,flexShrink:0}}>{currentPanelist.avatar}</span>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:currentPanelist.color,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{currentPanelist.name} says</div>
                      <div style={{fontSize:13,color:C.cream,lineHeight:1.65,fontStyle:"italic"}}>"{perFeedback.panelistReaction}"</div>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{background:"rgba(0,0,0,0.2)",borderRadius:13,padding:"16px 20px",marginBottom:12,display:"flex",alignItems:"center",gap:16}}>
                    <div style={{textAlign:"center",flexShrink:0}}>
                      <div style={{fontFamily:"Syne,sans-serif",fontSize:34,fontWeight:800,color:perFeedback.score>=8?C.verified:perFeedback.score>=5?C.gold:"#E74C3C",lineHeight:1}}>{perFeedback.score}<span style={{fontSize:14,color:C.gray}}>/10</span></div>
                      <div style={{fontSize:10,color:C.gray,marginTop:2,letterSpacing:1,textTransform:"uppercase"}}>{perFeedback.scoreLabel}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                        <span style={{fontSize:11,color:C.gray}}>STAR Method:</span>
                        <span style={{fontSize:12,fontWeight:700,color:perFeedback.usedSTAR?C.verified:"#E74C3C"}}>{perFeedback.usedSTAR?"✓ Used":"✗ Not used"}</span>
                      </div>
                      <div style={{height:5,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${perFeedback.score*10}%`,background:perFeedback.score>=8?C.verified:perFeedback.score>=5?C.gold:"#E74C3C",borderRadius:3,transition:"width 1s ease"}}/>
                      </div>
                    </div>
                  </div>

                  {/* Strength */}
                  <div style={{background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:11,padding:"12px 16px",marginBottom:8,display:"flex",gap:10}}>
                    <span style={{fontSize:16,flexShrink:0}}>✅</span>
                    <div><div style={{fontSize:10,fontWeight:700,color:C.verified,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>What worked</div><div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{perFeedback.strength}</div></div>
                  </div>

                  {/* Improvement */}
                  <div style={{background:"rgba(232,168,56,0.07)",border:"1px solid rgba(232,168,56,0.2)",borderRadius:11,padding:"12px 16px",marginBottom:8,display:"flex",gap:10}}>
                    <span style={{fontSize:16,flexShrink:0}}>🔧</span>
                    <div><div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Improve this</div><div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{perFeedback.improvement}</div></div>
                  </div>

                  {/* Stronger opener */}
                  <div style={{background:"rgba(108,99,255,0.07)",border:"1px solid rgba(108,99,255,0.2)",borderRadius:11,padding:"12px 16px",marginBottom:16,display:"flex",gap:10}}>
                    <span style={{fontSize:16,flexShrink:0}}>💬</span>
                    <div><div style={{fontSize:10,fontWeight:700,color:"#9B93FF",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>Stronger opener</div><div style={{fontSize:13,color:C.cream,lineHeight:1.65,fontStyle:"italic"}}>"{perFeedback.strongerOpener}"</div></div>
                  </div>

                  <button className="btn btn-gold" onClick={continueAfterFeedback} style={{width:"100%",justifyContent:"center",fontSize:14,padding:"14px"}}>
                    {currentQ+1>=TOTAL_Q?"See Panel Decision 📊":"Next Question →"}
                  </button>
                </div>
              )}
            </div>
          ):(
            !textMode?(
              <div className="voice-status">
                <button className={`mic-btn${isRecording?" recording":" idle"}`} onClick={isRecording?stopRecording:startRecording}>{isRecording?"🔴":"🎤"}</button>
                <div className="voice-hint">{isRecording?"Recording... tap to stop":"Tap the mic to answer"}</div>
                <div className="transcript-box">{transcript?<span>{transcript}</span>:<span className="transcript-placeholder">Your answer will appear here as you speak...</span>}</div>
                <div className="voice-actions">
                  {transcript&&<button className="btn btn-red btn-sm" onClick={resetAnswer}>↺ Re-record</button>}
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setTextMode(true);stopRecording();}}>⌨️ Type instead</button>
                  <button className="btn btn-gold" onClick={submitAnswer} disabled={!transcript.trim()}>{currentQ+1>=TOTAL_Q?"Submit Final Answer →":"Submit Answer →"}</button>
                </div>
              </div>
            ):(
              <div>
                <textarea className="textarea-field" style={{minHeight:120}} placeholder="Type your answer here..." value={textInput} onChange={e=>setTextInput(e.target.value)}/>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setTextMode(false);resetAnswer();}}>🎤 Switch to voice</button>
                  <button className="btn btn-gold" onClick={submitAnswer} disabled={!textInput.trim()}>{currentQ+1>=TOTAL_Q?"Submit Final Answer →":"Submit Answer →"}</button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ROLE SUGGESTER
// ───────────────────────────────────────────────────────────────────────────
function RolesModule({country}){
  const [bg,setBg]=useState("");
  const [yrs,setYrs]=useState("5-10");
  const [loc,setLoc]=useState("");
  const [loading,setLoading]=useState(false);
  const [roles,setRoles]=useState([]);
  const [raw,setRaw]=useState("");

  const find=async()=>{
    setLoading(true);setRoles([]);setRaw("");
    const sys=`You are BridgeWork AI. Suggest 6 job roles in ${country.name} for an African professional. Return ONLY a JSON array: [{title,companies:[3 names],salaryRange,matchReason,level,growthPath}]. Quote salaryRange in ${country.currencyName} (${country.currency}). African titles translate UP in ${country.name} — emphasize elevation.`;
    const res=await callClaude([{role:"user",content:`Background: ${bg}\nYears: ${yrs}\nLocation: ${loc||`anywhere in ${country.name}`}\nSuggest 6 ${country.name} roles with title-elevation emphasis. JSON only.`}],sys);
    setRaw(res);
    try{const c=res.replace(/```json|```/g,"").trim();const s=c.indexOf("[");setRoles(JSON.parse(c.slice(s,c.lastIndexOf("]")+1)));}catch{setRoles([]);}
    setLoading(false);
  };

  return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">🎯</span><div><div className="panel-title">Role Suggester</div><div className="panel-subtitle">{country.flag} Discover {country.name} roles you're qualified for — at the right level</div></div></div>
      <div className="panel-body">
        {!roles.length&&!loading&&(
          <>
            <label className="input-label">Your Background</label>
            <textarea className="textarea-field" placeholder="e.g. 8 years Nigerian banking — branch manager at Zenith Bank, credit analysis, fintech..." value={bg} onChange={e=>setBg(e.target.value)}/>
            <div className="row">
              <div className="flex1"><label className="input-label">Years Experience</label><select className="select-field" value={yrs} onChange={e=>setYrs(e.target.value)}>{["0-2","3-5","5-10","10-15","15+"].map(v=><option key={v}>{v}</option>)}</select></div>
              <div className="flex1"><label className="input-label">{country.name} City / Remote</label><input className="input-field" placeholder={country.code==="UK"?"e.g. London, Manchester, Remote":country.code==="CA"?"e.g. Toronto, Vancouver, Remote":"e.g. New York, Remote"} value={loc} onChange={e=>setLoc(e.target.value)}/></div>
            </div>
            <button className="btn btn-gold" onClick={find} disabled={!bg.trim()}>🔍 Find My {country.name} Roles</button>
          </>
        )}
        {loading&&<div className="thinking"><div className="dots"><span/><span/><span/></div>Matching to the {country.name} market...</div>}
        {roles.length>0&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span className="tag tag-gold">{roles.length} roles found</span><button className="btn btn-ghost btn-sm" onClick={()=>{setRoles([]);setBg("");}}>Search Again</button></div>
            {roles.map((r,i)=>(
              <div key={i} className="role-card">
                <div className="role-header"><div><div className="role-title">{r.title}</div><div className="role-company">{Array.isArray(r.companies)?r.companies.join(" · "):r.companies}</div></div><div style={{textAlign:"right"}}><div className="role-salary">{r.salaryRange}</div><span className="tag tag-gray" style={{marginTop:4,display:"inline-block"}}>{r.level}</span></div></div>
                <div className="role-why">💡 {r.matchReason}</div>
                {r.growthPath&&<div style={{marginTop:8}}><span className="tag tag-green">📈 {r.growthPath}</span></div>}
              </div>
            ))}
          </>
        )}
        {!loading&&!roles.length&&raw&&<div className="ai-response"><div className="ai-label">Roles</div><div className="ai-content">{raw}</div></div>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// CULTURE BRIDGE
// ───────────────────────────────────────────────────────────────────────────
function CultureModule({country}){
  const [open,setOpen]=useState(null);
  const [q,setQ]=useState("");
  const [loading,setLoading]=useState(false);
  const [ans,setAns]=useState("");
  const cn=country.cultureNotes;
  const S=[
    {id:"sp",icon:"💼",t:"Self-Promotion Culture",items:cn.selfPromo},
    {id:"wp",icon:"🏢",t:`${country.name} Workplace Norms`,items:cn.workplace},
    {id:"sal",icon:"💰",t:"Salary Negotiation",items:cn.salary},
    {id:"net",icon:"🤝",t:`Networking in ${country.name}`,items:cn.networking},
    {id:"acc",icon:"🗣️",t:"Your Accent is an Asset",items:["Never try to mask your accent — authenticity builds trust","Focus on pace and clarity — slow down 20% when presenting","Multilingualism is valued in global companies","Frame international background as competitive advantage explicitly"]},
    {id:"vis",icon:"📋",t:"Work Authorization",items:cn.visa},
  ];
  const ask=async()=>{
    setLoading(true);
    const r=await callClaude([{role:"user",content:q}],`You are BridgeWork AI cultural navigator for African professionals adapting to the ${country.name} workplace. Relevant visa/status terms in this market: ${country.visaTerms.join(", ")}. Give practical, specific advice in 3-5 actionable points. Never suggest hiding identity.`);
    setAns(r);setLoading(false);
  };
  return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">🌉</span><div><div className="panel-title">Culture Bridge</div><div className="panel-subtitle">{country.flag} Navigate {country.name} workplace culture — authentically</div></div></div>
      <div className="panel-body">
        <div className="culture-grid">
          {S.map(s=>(
            <div key={s.id} className={`culture-card${open===s.id?" open":""}`} onClick={()=>setOpen(open===s.id?null:s.id)}>
              <div className="culture-title">{s.icon} {s.t}</div>
              {(open===s.id?s.items:s.items.slice(0,2)).map((item,i)=><div key={i} className="culture-item"><div className="culture-dot"/><div className="culture-text">{item}</div></div>)}
              {open!==s.id&&<div style={{fontSize:11,color:C.gold,marginTop:5}}>+{s.items.length-2} more →</div>}
            </div>
          ))}
        </div>
        <div className="divider"/>
        <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:10}}>🤔 Ask anything</div>
        <div style={{display:"flex",gap:9}}>
          <input className="input-field" style={{marginBottom:0,flex:1}} placeholder="e.g. How do I negotiate salary? Should I send a thank-you after an interview?" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()}/>
          <button className="btn btn-gold" onClick={ask} disabled={!q.trim()||loading} style={{whiteSpace:"nowrap"}}>Ask</button>
        </div>
        {loading&&<div className="thinking"><div className="dots"><span/><span/><span/></div>Thinking...</div>}
        {ans&&!loading&&<div className="ai-response"><div className="ai-label">Culture Guide</div><div className="ai-content">{ans}</div></div>}
      </div>
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// MODULE: MOTIVATION — for candidates stuck in attendance mode
// ───────────────────────────────────────────────────────────────────────────
const REFRAMES=[
  {neg:"I'm just attending interviews now",pos:"Every interview is paid market research. You're learning what you're worth and how rooms respond to you."},
  {neg:"I'm not good enough for these roles",pos:"You're an African professional with international experience. The gap is translation, not talent."},
  {neg:"Maybe I should lower my expectations",pos:"Lower your target? No. Sharpen your pitch. The role exists — the mission is to help them see it's you."},
  {neg:"I've been rejected so many times",pos:"Every rejection is data. The question isn't 'why don't they want me' — it's 'what did I not make clear about my value?'"},
  {neg:"Something must be wrong with me",pos:"Nothing is wrong with you. Job searching is a skill — and like any skill, it gets sharper with deliberate practice."},
  {neg:"I feel embarrassed telling people I'm still looking",pos:"You're building something. That takes longer than people outside the process ever understand. Stay in your lane."},
];
const STATS=[
  {num:"5–6 months",label:"Average job search duration for professionals"},
  {num:"10–20+",label:"Average interviews before landing an offer"},
  {num:"80%",label:"Of hiring decisions involve at least one rejected candidate first"},
  {num:"2%",label:"Typical application-to-interview conversion rate — you're doing better than you think"},
];
function MotivationModule({country}){
  const [phase,setPhase]=useState("check"); // check|vent|reframe|plan|stats
  const [ventMessages,setVentMessages]=useState([]);
  const [ventInput,setVentInput]=useState("");
  const [ventLoading,setVentLoading]=useState(false);
  const [ventStarted,setVentStarted]=useState(false);
  const [reframeIdx,setReframeIdx]=useState(0);
  const [checklist,setChecklist]=useState({
    "Reviewed my last interview honestly — not to punish myself, but to find one thing to improve":false,
    "Researched the company for at least 20 minutes — not just their website":false,
    "Prepared 2 questions that show I understand their actual business challenges":false,
    "Reminded myself of one real achievement I'm proud of — said it out loud":false,
    "Decided what 'success' looks like for THIS interview beyond just getting the job":false,
    "Told one person I trust that I have an interview — accountability matters":false,
  });
  const ventRef=useRef();

  const startVent=async()=>{
    setVentStarted(true);setVentLoading(true);
    const sys=`You are BridgeWork AI's Motivation Coach. You're talking to an African professional who has done many interviews without getting the role and is starting to lose hope or motivation.

FIRST — acknowledge the pain without any toxic positivity. Don't say "you've got this" or "stay positive." Say something real. Something that shows you understand how exhausting this actually is.

Then ask ONE simple question: "Tell me what's been happening — how many interviews have you done, and what does it feel like right now?" 

Keep your opening under 4 sentences. Warm, honest, no platitudes.`;
    const opening=await callClaude([{role:"user",content:"I've been doing interviews for a while without getting the role. I'm starting to feel like just showing up is the point."}],sys);
    setVentMessages([{role:"assistant",content:opening}]);
    setVentLoading(false);
  };

  const sendVent=async(overrideText)=>{
    const text=overrideText??ventInput;
    if(!text.trim()||ventLoading)return;
    const msgs=[...ventMessages,{role:"user",content:text}];
    setVentMessages(msgs);setVentInput("");setVentLoading(true);
    const sys=`You are BridgeWork AI's Motivation Coach for an African professional struggling after multiple unsuccessful interviews.

Your job in this conversation:
1. LISTEN FIRST — reflect back what they share without rushing to fix
2. VALIDATE — what they feel is real and reasonable
3. GENTLY SHIFT — after they've felt heard, start asking diagnostic questions: What feedback have they received? What roles are they targeting? What do they say when asked "tell me about yourself"?
4. REFRAME — help them see this as a solvable problem, not a verdict on their worth
5. NEVER say "stay positive" "you've got this" or other empty phrases
6. Keep responses to 3-5 sentences — don't lecture

If they seem ready for action, offer to move to the "Break the Pattern" plan. But don't rush there.`;
    const reply=await callClaude(msgs,sys);
    setVentMessages(m=>[...m,{role:"assistant",content:reply}]);
    setVentLoading(false);
    setTimeout(()=>ventRef.current?.scrollTo({top:99999,behavior:"smooth"}),100);
  };

  const toggleCheck=(key)=>setChecklist(p=>({...p,[key]:!p[key]}));
  const checkScore=Object.values(checklist).filter(Boolean).length;

  return(
    <div>
      {/* Tab nav */}
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {id:"check",icon:"🪞",label:"Check In"},
          {id:"vent",icon:"💬",label:"Talk It Out"},
          {id:"stats",icon:"📊",label:"The Numbers"},
          {id:"reframe",icon:"🔄",label:"Reframe"},
          {id:"plan",icon:"🎯",label:"Reset Ritual"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setPhase(t.id)}
            className={`btn ${phase===t.id?"btn-gold":"btn-ghost"}`}
            style={{padding:"9px 16px",fontSize:12}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CHECK IN */}
      {phase==="check"&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">🪞</span>
            <div><div className="panel-title">Where Are You Right Now?</div><div className="panel-subtitle">Honest self-assessment — no judgment</div></div>
          </div>
          <div className="panel-body">
            <div style={{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:24,marginBottom:20}}>
              <div style={{fontSize:14,color:C.white,fontWeight:600,marginBottom:16}}>Which of these feels true right now?</div>
              {[
                {icon:"😤",t:"I'm frustrated — I know I'm qualified but keep getting rejected"},
                {icon:"😶",t:"I've gone numb — interviews feel like just going through the motions"},
                {icon:"😔",t:"I'm starting to doubt myself — maybe I'm not good enough"},
                {icon:"😤",t:"I'm angry — the system feels rigged against people like me"},
                {icon:"😴",t:"I'm exhausted — the process is draining me emotionally"},
                {icon:"🤷",t:"I don't even know anymore — just trying to keep going"},
              ].map((item,i)=>(
                <div key={i} onClick={()=>{setPhase("vent");setTimeout(()=>startVent(),100);}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,marginBottom:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",cursor:"pointer",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,168,56,0.3)";e.currentTarget.style.background="rgba(232,168,56,0.05)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
                  <span style={{fontSize:22}}>{item.icon}</span>
                  <span style={{fontSize:13,color:C.cream,lineHeight:1.5}}>{item.t}</span>
                  <span style={{marginLeft:"auto",color:C.gold,fontSize:11}}>Talk about it →</span>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:12,padding:"16px 20px"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:6}}>💡 What BridgeWork knows about your situation</div>
              <div style={{fontSize:13,color:C.cream,lineHeight:1.8}}>Most African professionals in {country.name} need <strong>2-3x more interviews</strong> than local candidates before landing — not because they're less qualified, but because of unconscious bias in screening, unfamiliarity with African company names, and title translation gaps. <strong>This is a system problem, not a you problem.</strong> But we can work both angles.</div>
            </div>
          </div>
        </div>
      )}

      {/* TALK IT OUT */}
      {phase==="vent"&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">💬</span>
            <div><div className="panel-title">Talk It Out</div><div className="panel-subtitle">Say what you're actually feeling. No filters needed here.</div></div>
          </div>
          <div className="panel-body">
            {!ventStarted?(
              <div style={{textAlign:"center",padding:"32px 20px"}}>
                <div style={{fontSize:40,marginBottom:16}}>💬</div>
                <div style={{fontSize:16,fontWeight:600,color:C.white,marginBottom:8}}>This is a safe space to be honest</div>
                <div style={{fontSize:13,color:C.gray,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>No advice yet. No action plan. Just a conversation with something that won't judge you, panic, or offer unsolicited opinions about your interview outfit.</div>
                <button className="btn btn-gold" onClick={startVent}>Start talking</button>
              </div>
            ):(
              <>
                <div className="chat-area" ref={ventRef} style={{maxHeight:340}}>
                  {ventMessages.map((m,i)=>(
                    <div key={i} className={`msg-row${m.role==="user"?" user":""}`}>
                      <div className={`msg-av${m.role==="assistant"?" ai":" user"}`}>{m.role==="assistant"?"🤝":"👤"}</div>
                      <div className={`msg-bub${m.role==="assistant"?" ai":" user"}`}>{m.content}</div>
                    </div>
                  ))}
                  {ventLoading&&<div className="msg-row"><div className="msg-av ai">🤝</div><div className="msg-bub ai"><div className="dots"><span/><span/><span/></div></div></div>}
                </div>
                <div className="chat-input-row">
                  <textarea className="chat-input" rows={2} placeholder="Just say what's on your mind..." value={ventInput} onChange={e=>setVentInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendVent();}}}/>
                  <button className="btn btn-gold" onClick={()=>sendVent()} disabled={!ventInput.trim()||ventLoading} style={{alignSelf:"flex-end",padding:"11px 16px"}}>Send</button>
                </div>
                <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
                  {["I've done 15+ interviews with no offer","I stop preparing as much now","I feel invisible in the process","I'm ready to talk about what to do next"].map(q=>(
                    <button key={q} className="btn btn-ghost btn-sm" onClick={()=>sendVent(q)}>{q}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* THE NUMBERS */}
      {phase==="stats"&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">📊</span>
            <div><div className="panel-title">The Numbers Don't Lie</div><div className="panel-subtitle">What the data actually says about job searching</div></div>
          </div>
          <div className="panel-body">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:24}}>
              {STATS.map((s,i)=>(
                <div key={i} style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"20px 18px",textAlign:"center"}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:C.gold,marginBottom:6}}>{s.num}</div>
                  <div style={{fontSize:12,color:C.gray,lineHeight:1.6}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:13,padding:"18px 22px",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:C.verified,marginBottom:8}}>📌 What this means for you</div>
              <div style={{fontSize:13,color:C.cream,lineHeight:1.8}}>If you've done 5 interviews — you're statistically early. If you've done 12 — you're in the middle of a normal search. If you've done 20+ — something specific needs to change, and that's a solvable problem. <strong>The number of interviews without an offer is not a measure of your worth. It's a signal about where the friction is.</strong></div>
            </div>
            <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:13,padding:"18px 22px"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:8}}>🌍 The immigrant premium you carry</div>
              <div style={{fontSize:13,color:C.cream,lineHeight:1.8}}>Studies consistently show that candidates with African-sounding names get <strong>fewer callbacks</strong> for the same CV — not because the CV is weaker, but because of name recognition bias. This is real. And it means some of your rejections had nothing to do with your interview performance. Your job is to break through the screening layer — BridgeWork exists to help you do exactly that.</div>
            </div>
          </div>
        </div>
      )}

      {/* REFRAME */}
      {phase==="reframe"&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">🔄</span>
            <div><div className="panel-title">Reframe the Narrative</div><div className="panel-subtitle">The story you tell yourself about the process matters</div></div>
          </div>
          <div className="panel-body">
            <div style={{marginBottom:20,fontSize:13,color:C.gray,lineHeight:1.7}}>Tap each one that sounds like a thought you've had recently.</div>
            {REFRAMES.map((r,i)=>(
              <div key={i} style={{marginBottom:12,borderRadius:13,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)",cursor:"pointer"}}
                onClick={()=>setReframeIdx(reframeIdx===i?-1:i)}>
                <div style={{padding:"14px 18px",background:"rgba(231,76,60,0.08)",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:16}}>😔</span>
                  <span style={{fontSize:13,color:"rgba(245,240,232,0.7)",fontStyle:"italic"}}>"{r.neg}"</span>
                  <span style={{marginLeft:"auto",color:C.gold,fontSize:11,flexShrink:0}}>Reframe →</span>
                </div>
                {reframeIdx===i&&(
                  <div style={{padding:"14px 18px",background:"rgba(0,200,150,0.06)",borderTop:"1px solid rgba(0,200,150,0.15)",display:"flex",gap:12,alignItems:"flex-start"}}>
                    <span style={{fontSize:16}}>💡</span>
                    <span style={{fontSize:13,color:C.cream,lineHeight:1.7}}>{r.pos}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESET RITUAL */}
      {phase==="plan"&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">🎯</span>
            <div><div className="panel-title">Pre-Interview Reset Ritual</div><div className="panel-subtitle">Do this before your next interview. All 6. Non-negotiable.</div></div>
          </div>
          <div className="panel-body">
            <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:20,fontSize:13,color:C.cream,lineHeight:1.7}}>
              Attendance mode sets in when interviews stop feeling deliberate. This checklist makes the next interview <strong>intentional</strong>. Do it the night before, not the morning of.
            </div>
            {Object.entries(checklist).map(([key,done])=>(
              <div key={key} onClick={()=>toggleCheck(key)}
                style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 16px",borderRadius:11,marginBottom:8,cursor:"pointer",background:done?"rgba(0,200,150,0.08)":"rgba(0,0,0,0.15)",border:`1px solid ${done?"rgba(0,200,150,0.25)":"rgba(255,255,255,0.06)"}`,transition:"all .2s"}}>
                <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${done?C.verified:"rgba(139,155,180,0.4)"}`,background:done?C.verified:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,color:C.navy,fontWeight:700,marginTop:1}}>
                  {done?"✓":""}
                </div>
                <span style={{fontSize:13,color:done?C.verified:C.cream,lineHeight:1.6,textDecoration:done?"none":"none"}}>{key}</span>
              </div>
            ))}
            <div style={{marginTop:20,background:checkScore===6?"rgba(0,200,150,0.1)":"rgba(0,0,0,0.2)",border:`1px solid ${checkScore===6?"rgba(0,200,150,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:checkScore===6?C.verified:C.gold}}>{checkScore}/6</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:3}}>
                  {checkScore===0?"Not started yet"
                    :checkScore<3?"You're getting warmed up"
                    :checkScore<6?"Almost ready — finish the list"
                    :"You're walking in with intention. That's different."}
                </div>
                <div style={{fontSize:12,color:C.gray}}>{checkScore===6?"This is not attendance. This is strategy.":"Complete all 6 before your next interview."}</div>
              </div>
            </div>
            {checkScore===6&&(
              <div style={{marginTop:16,textAlign:"center"}}>
                <button className="btn btn-gold" onClick={()=>setChecklist(Object.fromEntries(Object.keys(checklist).map(k=>[k,false])))}>
                  Reset for next interview
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// MODULE: BOOK A HUMAN COACH
// ───────────────────────────────────────────────────────────────────────────
const COACH_TYPES=[
  {
    id:"mock",icon:"🎤",title:"Mock Interviewer",
    desc:"A real person runs a full interview simulation for your target role, asks follow-up questions, and gives honest feedback on your answers, tone, and presence.",
    sessions:["30 min — 3 targeted questions + feedback","60 min — Full interview + detailed debrief"],
    bestFor:"People who've done 5+ AI practice sessions and want real human judgment",
    tags:["Voice & presence","Real follow-ups","Honest verdict"],
  },
  {
    id:"coach",icon:"🧭",title:"Career Coach",
    desc:"1-on-1 strategy session to diagnose what's going wrong in your search — CV positioning, role targeting, application strategy, or interview approach.",
    sessions:["30 min — Focused diagnosis on one area","60 min — Full search audit + action plan"],
    bestFor:"People who've been applying widely without results and want a strategic reset",
    tags:["Root cause analysis","Strategy","Action plan"],
  },
  {
    id:"cv",icon:"📄",title:"CV / Resume Reviewer",
    desc:"A human professional reads your CV line by line and gives written + verbal feedback on title translation, formatting, language, and ATS compatibility for your target market.",
    sessions:["30 min — Quick review of key sections","60 min — Full review + live rewrite of 3 sections"],
    bestFor:"People who want human eyes on their document before mass-applying",
    tags:["Line-by-line feedback","Market-specific","Rewrite session"],
  },
];

function BookHumanModule({country}){
  const [selected,setSelected]=useState(null);
  const [sessionLen,setSessionLen]=useState("60");
  const [form,setForm]=useState({name:"",email:"",phone:"",linkedIn:"",currentRole:"",targetRole:"",interviewCount:"",mainChallenge:"",preferredDate:"",preferredTime:""});
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [bookingRef,setBookingRef]=useState("");
  const [formError,setFormError]=useState("");

  const coach=COACH_TYPES.find(c=>c.id===selected);

  const handleSubmit=async()=>{
    if(!form.name||!form.email||!form.targetRole){setFormError("Please fill in your name, email, and target role.");return;}
    if(!form.email.includes("@")){setFormError("Please enter a valid email address.");return;}
    setFormError("");setSubmitting(true);
    const ref=`BW-${Date.now().toString(36).toUpperCase()}`;
    const booking={
      ref, coachType:selected, sessionLength:`${sessionLen} min`,
      country:country.name, submittedAt:new Date().toISOString(),
      ...form, status:"pending"
    };
    try{
      await window.storage.set(`booking:${ref}`,JSON.stringify(booking),true);
    }catch(e){console.error("Storage error",e);}
    setBookingRef(ref);setSubmitted(true);setSubmitting(false);
  };

  if(submitted)return(
    <div className="panel">
      <div className="panel-body" style={{textAlign:"center",padding:"44px 32px"}}>
        <div style={{fontSize:56,marginBottom:20}}>🎉</div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:800,color:C.verified,marginBottom:8}}>You're booked in.</div>
        <div style={{fontSize:14,color:C.gray,marginBottom:24,lineHeight:1.7,maxWidth:380,margin:"0 auto 24px"}}>Your session request has been received. A BridgeWork team member will confirm your coach match and send a calendar invite to <strong style={{color:C.cream}}>{form.email}</strong> within 24–48 hours.</div>
        <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 24px",display:"inline-block",marginBottom:28}}>
          <div style={{fontSize:10,color:C.gray,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Booking Reference</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>{bookingRef}</div>
          <div style={{fontSize:11,color:C.gray,marginTop:4}}>Keep this — you'll need it to reschedule</div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <div style={{background:"rgba(232,168,56,0.08)",border:"1px solid rgba(232,168,56,0.2)",borderRadius:10,padding:"12px 20px",fontSize:13,color:C.cream,lineHeight:1.6}}>
            <strong style={{color:C.gold}}>What happens next:</strong><br/>
            1. BridgeWork matches you with the right coach<br/>
            2. You receive a calendar invite within 48 hrs<br/>
            3. Your coach reviews your details before the call<br/>
            4. You show up ready — not just hoping
          </div>
        </div>
        <div style={{marginTop:24}}>
          <button className="btn btn-ghost" onClick={()=>{setSubmitted(false);setSelected(null);setForm({name:"",email:"",phone:"",linkedIn:"",currentRole:"",targetRole:"",interviewCount:"",mainChallenge:"",preferredDate:"",preferredTime:""});}}>
            Book another session
          </button>
        </div>
      </div>
    </div>
  );

  return(
    <div>
      {/* INTRO BANNER */}
      <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"22px 26px",marginBottom:20,display:"flex",gap:20,alignItems:"flex-start"}}>
        <span style={{fontSize:32,flexShrink:0}}>🤝</span>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:C.white,marginBottom:6}}>AI gets you 80% there. A human gets you the last 20%.</div>
          <div style={{fontSize:13,color:C.gray,lineHeight:1.75}}>The AI coach can transform your {country.docName.toLowerCase()}, simulate interviews, and give structured feedback. But some things only a human can catch — the slight hesitation in your voice, the moment your confidence dips, the question you're dodging without realising it. That's what this is for.</div>
        </div>
      </div>

      {/* COACH TYPE SELECTION */}
      {!selected&&(
        <div>
          <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:14}}>What kind of help do you need?</div>
          {COACH_TYPES.map(ct=>(
            <div key={ct.id} className="panel" style={{marginBottom:14,cursor:"pointer",border:`1px solid rgba(255,255,255,0.07)`,transition:"all .2s"}}
              onClick={()=>setSelected(ct.id)}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(232,168,56,0.35)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}>
              <div className="panel-body" style={{padding:"22px 24px"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                  <div style={{fontSize:32,flexShrink:0}}>{ct.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:C.white,marginBottom:5}}>{ct.title}</div>
                    <div style={{fontSize:13,color:C.gray,lineHeight:1.65,marginBottom:12}}>{ct.desc}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                      {ct.tags.map(tag=><span key={tag} className="tag tag-gold">{tag}</span>)}
                    </div>
                    <div style={{fontSize:12,color:"rgba(139,155,180,0.7)",fontStyle:"italic"}}>Best for: {ct.bestFor}</div>
                  </div>
                  <div style={{color:C.gold,fontSize:18,flexShrink:0,marginTop:4}}>→</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOKING FORM */}
      {selected&&coach&&(
        <div className="panel">
          <div className="panel-header">
            <span className="panel-icon">{coach.icon}</span>
            <div>
              <div className="panel-title">Book a {coach.title}</div>
              <div className="panel-subtitle">{country.flag} {country.name} · Real human · Matched to your needs</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{marginLeft:"auto"}} onClick={()=>setSelected(null)}>← Change</button>
          </div>
          <div className="panel-body">
            {/* Session length */}
            <div style={{marginBottom:20}}>
              <label className="input-label">Session Length</label>
              <div style={{display:"flex",gap:10}}>
                {coach.sessions.map((s,i)=>{
                  const len=i===0?"30":"60";
                  return(
                    <div key={len} onClick={()=>setSessionLen(len)}
                      style={{flex:1,padding:"14px 16px",borderRadius:11,cursor:"pointer",border:`1.5px solid ${sessionLen===len?C.gold:"rgba(255,255,255,0.1)"}`,background:sessionLen===len?"rgba(232,168,56,0.08)":"rgba(0,0,0,0.15)",transition:"all .2s"}}>
                      <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:sessionLen===len?C.gold:C.white,marginBottom:4}}>{len} min</div>
                      <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>{s.split("—")[1]?.trim()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divider"/>

            {/* Personal info */}
            <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:14}}>Your details</div>
            <div className="row">
              <div className="flex1">
                <label className="input-label">Full Name *</label>
                <input className="input-field" placeholder="Your full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
              </div>
              <div className="flex1">
                <label className="input-label">Email Address *</label>
                <input className="input-field" placeholder="you@email.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
              </div>
            </div>
            <div className="row">
              <div className="flex1">
                <label className="input-label">Phone / WhatsApp</label>
                <input className="input-field" placeholder="+1 555 000 0000" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
              </div>
              <div className="flex1">
                <label className="input-label">LinkedIn URL</label>
                <input className="input-field" placeholder="linkedin.com/in/yourname" value={form.linkedIn} onChange={e=>setForm(p=>({...p,linkedIn:e.target.value}))}/>
              </div>
            </div>

            <div className="divider"/>

            {/* Role context */}
            <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:14}}>Your job search context</div>
            <div className="row">
              <div className="flex1">
                <label className="input-label">Current / Most Recent Role</label>
                <input className="input-field" placeholder="e.g. Branch Manager, Zenith Bank" value={form.currentRole} onChange={e=>setForm(p=>({...p,currentRole:e.target.value}))}/>
              </div>
              <div className="flex1">
                <label className="input-label">Target Role in {country.name} *</label>
                <input className="input-field" placeholder="e.g. Director of Operations" value={form.targetRole} onChange={e=>setForm(p=>({...p,targetRole:e.target.value}))}/>
              </div>
            </div>
            <label className="input-label">How many interviews have you done so far?</label>
            <select className="select-field" value={form.interviewCount} onChange={e=>setForm(p=>({...p,interviewCount:e.target.value}))}>
              <option value="">Select...</option>
              {["1-3","4-6","7-10","11-15","16-20","More than 20"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
            <label className="input-label">What's your biggest challenge right now?</label>
            <textarea className="textarea-field" style={{minHeight:80}} placeholder="Be as specific as possible — e.g. 'I get to final round but don't get the offer' or 'I'm not getting past the phone screen'" value={form.mainChallenge} onChange={e=>setForm(p=>({...p,mainChallenge:e.target.value}))}/>

            <div className="divider"/>

            {/* Preferred timing */}
            <div style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:14}}>Preferred timing</div>
            <div className="row">
              <div className="flex1">
                <label className="input-label">Preferred Date</label>
                <input className="input-field" type="date" value={form.preferredDate} onChange={e=>setForm(p=>({...p,preferredDate:e.target.value}))} style={{colorScheme:"dark"}}/>
              </div>
              <div className="flex1">
                <label className="input-label">Preferred Time ({country.code==="UK"?"GMT":country.code==="CA"?"EST/PST":"EST"})</label>
                <select className="select-field" value={form.preferredTime} onChange={e=>setForm(p=>({...p,preferredTime:e.target.value}))}>
                  <option value="">Select time...</option>
                  {["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {formError&&<div style={{background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.3)",borderRadius:9,padding:"10px 14px",fontSize:13,color:"#E74C3C",marginBottom:14}}>{formError}</div>}

            <div style={{background:"rgba(232,168,56,0.05)",border:"1px solid rgba(232,168,56,0.12)",borderRadius:10,padding:"12px 16px",fontSize:12,color:C.gray,lineHeight:1.7,marginBottom:16}}>
              📌 Your coach will review your details before the session so you don't waste time on background. We'll email you a confirmation and calendar invite within 24–48 hours.
            </div>

            <button className="btn btn-gold" onClick={handleSubmit} disabled={submitting} style={{fontSize:14,padding:"13px 28px"}}>
              {submitting?"Submitting...":"🤝 Request My Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// FEEDBACK WIDGET — floating button, always visible
// ───────────────────────────────────────────────────────────────────────────
const RATING_LABELS=["","😞 Poor","😕 Fair","😐 OK","😊 Good","🤩 Excellent"];
function FeedbackWidget({currentModule}){
  const [open,setOpen]=useState(false);
  const [rating,setRating]=useState(0);
  const [hovered,setHovered]=useState(0);
  const [text,setText]=useState("");
  const [email,setEmail]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);

  const MODULE_NAMES={
    home:"Dashboard",resume:"Resume Transformer",game:"Interview Simulation",
    verify:"Work Verification",roles:"Role Suggester",culture:"Culture Bridge",
    motivation:"Motivation",human:"Book a Human Coach",
  };

  const submit=async()=>{
    if(!rating)return;
    setSubmitting(true);
    const entry={
      id:`fb-${Date.now()}`,
      module:MODULE_NAMES[currentModule]||currentModule,
      rating,text:text.trim(),email:email.trim(),
      submittedAt:new Date().toISOString(),
      userAgent:navigator.userAgent.slice(0,80),
    };
    try{
      // Save individual entry
      await window.storage.set(`feedback:${entry.id}`,JSON.stringify(entry),true);
      // Update summary counter
      let summary={total:0,avgRating:0,byModule:{}};
      try{const s=await window.storage.get("feedback:summary",true);if(s)summary=JSON.parse(s.value);}catch{}
      summary.total+=1;
      summary.avgRating=((summary.avgRating*(summary.total-1))+rating)/summary.total;
      summary.byModule[entry.module]=(summary.byModule[entry.module]||0)+1;
      await window.storage.set("feedback:summary",JSON.stringify(summary),true);
    }catch(e){console.error("Feedback storage error",e);}
    setSubmitting(false);setSubmitted(true);
    setTimeout(()=>{setOpen(false);setSubmitted(false);setRating(0);setText("");setEmail("");},3000);
  };

  return(
    <div className="feedback-fab">
      {open&&(
        <div className="feedback-panel">
          {submitted?(
            <div className="feedback-submitted">
              <div className="feedback-submitted-icon">🙏</div>
              <div className="feedback-submitted-title">Thank you!</div>
              <div className="feedback-submitted-sub">Your feedback goes directly to the team building CrossBorder AI. We read every single one.</div>
            </div>
          ):(
            <>
              <div className="feedback-panel-title">Help us improve</div>
              <div className="feedback-panel-sub">You're using: <strong style={{color:C.gold}}>{MODULE_NAMES[currentModule]}</strong><br/>30 seconds — honest feedback only.</div>

              {/* Stars */}
              <div style={{fontSize:11,fontWeight:600,color:C.gray,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>How was your experience?</div>
              <div className="star-row">
                {[1,2,3,4,5].map(n=>(
                  <span key={n} className="star"
                    onMouseEnter={()=>setHovered(n)}
                    onMouseLeave={()=>setHovered(0)}
                    onClick={()=>setRating(n)}>
                    {n<=(hovered||rating)?"⭐":"☆"}
                  </span>
                ))}
              </div>
              <div className="rating-label">{RATING_LABELS[hovered||rating]}</div>

              {/* Text */}
              <textarea className="feedback-textarea" rows={3}
                placeholder="What would make this better? What's confusing? What's missing?"
                value={text} onChange={e=>setText(e.target.value)}/>

              {/* Email optional */}
              <input
                style={{width:"100%",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,padding:"9px 14px",color:C.cream,fontSize:12,fontFamily:"Inter,sans-serif",outline:"none",marginBottom:14}}
                placeholder="Your email (optional — if you want us to follow up)"
                value={email} onChange={e=>setEmail(e.target.value)}/>

              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-gold" onClick={submit}
                  disabled={!rating||submitting} style={{flex:1,justifyContent:"center"}}>
                  {submitting?"Sending...":"Send Feedback"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>✕</button>
              </div>
            </>
          )}
        </div>
      )}
      <button className="feedback-btn" onClick={()=>setOpen(o=>!o)} title="Give feedback">
        {open?"✕":"💬"}
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// FEEDBACK ADMIN VIEW — visit /#/feedback to see all submissions
// ───────────────────────────────────────────────────────────────────────────
function FeedbackAdmin(){
  const [entries,setEntries]=useState([]);
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      try{
        // Load summary
        const s=await window.storage.get("feedback:summary",true);
        if(s)setSummary(JSON.parse(s.value));
        // Load all entries
        const keys=await window.storage.list("feedback:fb-",true);
        const items=await Promise.all(
          (keys.keys||[]).map(async k=>{
            try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):null;}
            catch{return null;}
          })
        );
        setEntries(items.filter(Boolean).sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt)));
      }catch(e){console.error(e);}
      setLoading(false);
    };
    load();
  },[]);

  const stars=n=>"⭐".repeat(n)+"☆".repeat(5-n);

  return(
    <div style={{maxWidth:800,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:C.gold,marginBottom:6}}>
        CrossBorder AI — Feedback Dashboard
      </div>
      <div style={{fontSize:13,color:C.gray,marginBottom:32}}>All user feedback submissions — shared storage</div>

      {loading&&<div className="thinking"><div className="dots"><span/><span/><span/></div>Loading...</div>}

      {summary&&(
        <div style={{display:"flex",gap:14,marginBottom:28,flexWrap:"wrap"}}>
          {[
            {label:"Total responses",value:summary.total},
            {label:"Avg rating",value:`${summary.avgRating?.toFixed(1)}/5 ⭐`},
            {label:"Most feedback on",value:Object.entries(summary.byModule||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—"},
          ].map(s=>(
            <div key={s.label} style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"16px 20px",flex:1,minWidth:140}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>{s.value}</div>
              <div style={{fontSize:11,color:C.gray,marginTop:3,textTransform:"uppercase",letterSpacing:1}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {entries.length===0&&!loading&&(
        <div style={{color:C.gray,fontSize:14,textAlign:"center",padding:"40px 0"}}>No feedback yet. Share the site and come back!</div>
      )}

      {entries.map(e=>(
        <div key={e.id} style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"20px 22px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div>
              <span style={{fontSize:11,fontWeight:700,color:C.gold,background:"rgba(232,168,56,0.1)",padding:"3px 10px",borderRadius:10,marginRight:8}}>{e.module}</span>
              <span style={{fontSize:13}}>{stars(e.rating)}</span>
            </div>
            <div style={{fontSize:11,color:C.gray}}>{new Date(e.submittedAt).toLocaleString()}</div>
          </div>
          {e.text&&<div style={{fontSize:13,color:C.cream,lineHeight:1.7,marginBottom:8}}>{e.text}</div>}
          {e.email&&<div style={{fontSize:12,color:C.gray}}>📧 {e.email}</div>}
        </div>
      ))}
    </div>
  );
}

const NAV=[
  {id:"home",icon:"🏠",label:"Dashboard"},
  {id:"resume",icon:"📄",label:"Resume Transformer",badge:"🔥"},
  {id:"game",icon:"🎮",label:"Interview Simulation",badge:"NEW"},
  {id:"verify",icon:"✅",label:"Work Verification"},
  {id:"roles",icon:"🎯",label:"Role Suggester"},
  {id:"culture",icon:"🌉",label:"Culture Bridge"},
  {id:"motivation",icon:"💪",label:"Motivation",badge:"NEW"},
  {id:"human",icon:"🤝",label:"Book a Human Coach",badge:"NEW"},
];

export default function App(){
  const [active,setActive]=useState("home");
  const [countryCode,setCountryCode]=useState("US");
  const country=COUNTRIES[countryCode];

  // Secret admin route via URL hash
  if(typeof window!=="undefined"&&window.location.hash==="#/feedback"){
    return(<><style>{css}</style><FeedbackAdmin/></>);
  }

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="logo"><div className="logo-mark">CrossBorder AI</div><div className="logo-sub">Your Global Career Partner</div></div>
          <div className="country-switcher">
            <div className="country-label">Target Market</div>
            <div className="country-pills">
              {COUNTRY_LIST.map(c=>(
                <div key={c.code} className={`country-pill${countryCode===c.code?" active":""}`} onClick={()=>setCountryCode(c.code)}>
                  <span className="country-pill-flag">{c.flag}</span>
                  <span className="country-pill-code">{c.code}</span>
                </div>
              ))}
            </div>
          </div>
          <nav className="nav">
            <div className="nav-sec">Tools</div>
            {NAV.map(m=>(
              <div key={m.id} className={`nav-item${active===m.id?" active":""}`} onClick={()=>setActive(m.id)}>
                <span className="nav-icon">{m.icon}</span>{m.label}
                {m.badge&&<span className={`nav-badge${m.badge==="NEW"?" new":""}`}>{m.badge}</span>}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer"><p>Built for <span>African professionals</span> breaking into {country.name}, the UK, and Canada. Your experience is worth more than you think.</p></div>
        </aside>
        <main className="main">
          <div className="hero">
            <div className="country-banner">{country.flag} Currently targeting: {country.name}</div>
            <div className="hero-eyebrow">🌍 African Excellence, Global Opportunity</div>
            <h1 className="hero-title">Your experience is <span>worth more</span> than your title suggests</h1>
            <p className="hero-sub">Transform your {country.docName.toLowerCase()}. Practice the real interview. Verify your history. Land the role — in the US, UK, or Canada.</p>
            <TitleMorph pairs={country.morphPairs}/>
          </div>
          <div className="content">
            {active==="home"&&(
              <>
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:17,fontWeight:700,color:C.white,marginBottom:5}}>Where would you like to start?</div>
                  <div style={{fontSize:13,color:C.gray}}>New here? Start with {country.docName} Transformer, then practice with Interview Simulation.</div>
                </div>
                <div className="module-grid">
                  {[
                    {id:"resume",e:"📄",t:`${country.docName} Transformer`,d:`Upload your ${country.docName.toLowerCase()}. AI upgrades titles, quantifies achievements, formats to ${country.name} standard — then a Confidence Check makes sure it sounds like YOU.`,cta:`Transform my ${country.docName.toLowerCase()} →`},
                    {id:"game",e:"🎮",t:"Interview Simulation",d:`Paste a real job description. Answer 6 voice questions from an AI interviewer trained on ${country.name} interview style. Get a Hired or Try Again verdict, plus stronger answers and missing buzzwords.`,cta:"Start interview game →"},
                    {id:"motivation",e:"💪",t:"Motivation",d:"Done many interviews without the offer? Feeling like attendance is the point? This module acknowledges the real pain — then builds your way back to intentional, strategic searching.",cta:"Talk it out →"},
                    {id:"human",e:"🤝",t:"Book a Human Coach",d:"AI gets you 80% there. A real mock interviewer, career coach, or CV reviewer gets you the last 20% — the things only a human catches.",cta:"Book a session →"},
                    {id:"verify",e:"✅",t:"Work Verification",d:"Add official reference emails. We send automated verification requests. Each confirmed role gets a ✅ badge on your public profile.",cta:"Verify my experience →"},
                    {id:"roles",e:"🎯",t:"Role Suggester",d:`Tell us your background. We suggest specific ${country.name} roles — often at Director or VP level when you've been applying for Analyst.`,cta:`Find my ${country.name} roles →`},
                  ].map(m=>(
                    <div key={m.id} className="module-card" onClick={()=>setActive(m.id)}>
                      <div className="module-emoji">{m.e}</div>
                      <div className="module-title">{m.t}</div>
                      <div className="module-desc">{m.d}</div>
                      <div className="module-cta">{m.cta}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(232,168,56,0.05)",border:"1px solid rgba(232,168,56,0.12)",borderRadius:13,padding:"18px 22px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:6,letterSpacing:1,textTransform:"uppercase"}}>💡 The Title Gap</div>
                  <div style={{fontSize:13,color:C.cream,lineHeight:1.85}}>{country.titleGapExample} Yet most African professionals apply for Analyst roles. <strong>CrossBorder AI closes that gap.</strong></div>
                </div>
              </>
            )}
            {active==="resume"&&<ResumeModule country={country}/>}
            {active==="game"&&<InterviewGame country={country}/>}
            {active==="verify"&&<VerifyModule country={country}/>}
            {active==="roles"&&<RolesModule country={country}/>}
            {active==="culture"&&<CultureModule country={country}/>}
            {active==="motivation"&&<MotivationModule country={country}/>}
            {active==="human"&&<BookHumanModule country={country}/>}
          </div>
        </main>
        {/* Floating feedback button — always visible */}
        <FeedbackWidget currentModule={active}/>
      </div>
    </>
  );
}
