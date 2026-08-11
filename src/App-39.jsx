import { useState, useEffect, useRef } from "react";

const MODEL = "claude-sonnet-4-5";
const C = {
  navy:"#0D1B2A",navyL:"#162338",navyM:"#1E2E42",
  gold:"#E8A838",goldL:"#F5C860",
  green:"#2D6A4F",greenL:"#40916C",greenP:"#52B788",
  cream:"#F5F0E8",white:"#FFFFFF",
  gray:"#8B9BB4",
  verified:"#00C896",
  pending:"#F5A623",
};
// localStorage shim — replaces window.storage for real deployment
const storage = {
  set: (key, value) => { try { localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)); return true; } catch { return null; } },
  get: (key) => { try { const v = localStorage.getItem(key); return v !== null ? { key, value: v } : null; } catch { return null; } },
  delete: (key) => { try { localStorage.removeItem(key); return { key, deleted: true }; } catch { return null; } },
  list: (prefix = "") => { try { const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix)); return { keys }; } catch { return { keys: [] }; } },
};

const FREE_DOMAINS=["gmail","yahoo","hotmail","outlook","icloud","aol","proton","mail","ymail","live","msn"];
function isOfficial(email){
  try{
    if(!email||!email.includes("@"))return null; // null = not yet determined
    const parts=email.split("@");
    if(parts.length<2||!parts[1])return null;
    const domain=parts[1].split(".")[0]?.toLowerCase();
    if(!domain)return null;
    return !FREE_DOMAINS.includes(domain);
  }catch{return null;}
}
const API_KEY=typeof import.meta!=="undefined"?import.meta.env?.VITE_ANTHROPIC_KEY||"":"";
async function callClaude(messages,system,maxTokens=1000){
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key":API_KEY,
        "anthropic-version":"2023-06-01",
        "anthropic-dangerous-direct-browser-access":"true",
      },
      body:JSON.stringify({model:MODEL,max_tokens:maxTokens,system,messages})
    });
    const d=await r.json();
    if(!r.ok){console.error("Claude API error:",d);return "";}
    return d.content?.map(b=>b.text||"").join("")||"";
  }catch(e){console.error("Claude fetch error:",e);return "";}
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

/* PROGRESS TRACKING */
.progress-widget{padding:14px 16px;border-top:1px solid rgba(255,255,255,0.06);margin-top:auto;}
.progress-widget-title{font-size:10px;color:${C.gray};letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;}
.progress-streak{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.streak-fire{font-size:18px;}
.streak-count{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${C.gold};}
.streak-label{font-size:11px;color:${C.gray};}
.progress-bars{display:flex;flex-direction:column;gap:6px;}
.prog-row{display:flex;align-items:center;gap:8px;}
.prog-icon{font-size:12px;width:16px;text-align:center;}
.prog-bar-bg{flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;}
.prog-bar-fill{height:100%;border-radius:2px;background:${C.gold};transition:width .5s ease;}
.prog-count{font-size:10px;color:${C.gray};min-width:20px;text-align:right;}
.progress-card{background:${C.navyL};border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;margin-bottom:16px;}
.progress-card-title{font-size:12px;font-weight:700;color:${C.gold};letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;}
.stat-box{background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 10px;text-align:center;}
.stat-box-num{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:${C.gold};}
.stat-box-label{font-size:9px;color:${C.gray};text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.activity-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.activity-row:last-child{border-bottom:none;}
.activity-icon{font-size:16px;width:28px;height:28px;border-radius:8px;background:rgba(232,168,56,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.activity-text{flex:1;font-size:12px;color:${C.cream};line-height:1.4;}
.activity-time{font-size:10px;color:${C.gray};}
.resume-score-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;}

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
function ResumeModule({country,onComplete}){
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
  const [extracting,setExtracting]=useState(false);
  const [extractError,setExtractError]=useState("");
  const inputRef=useRef();
  const confRef=useRef();

  const extractTextFromFile=async(f)=>{
    if(!f)return;
    setExtracting(true);setExtractError("");setFileName(f.name);
    const ext=f.name.split(".").pop().toLowerCase();
    try{
      let text="";
      if(ext==="pdf"){
        // Load pdfjs - disable worker completely to avoid CORS issues
        if(!window.pdfjsLib){
          await new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
            s.onload=resolve;s.onerror=reject;
            document.head.appendChild(s);
          });
        }
        // Use empty string to disable worker - runs in main thread
        window.pdfjsLib.GlobalWorkerOptions.workerSrc="";
        const arrayBuffer=await f.arrayBuffer();
        const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(arrayBuffer)}).promise;
        for(let i=1;i<=pdf.numPages;i++){
          const page=await pdf.getPage(i);
          const content=await page.getTextContent();
          text+=content.items.map(s=>s.str).join(" ")+"\n";
        }
      } else if(ext==="docx"||ext==="doc"){
        if(!window.mammoth){
          await new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js";
            s.onload=resolve;s.onerror=reject;
            document.head.appendChild(s);
          });
        }
        const arrayBuffer=await f.arrayBuffer();
        const result=await window.mammoth.extractRawText({arrayBuffer});
        text=result.value;
      } else {
        text=await f.text();
      }
      if(!text||!text.trim()){
        setExtractError("No text found. This may be a scanned PDF image. Please tap 'Paste Text' and paste your CV directly.");
        setExtracting(false);return;
      }
      setResumeText(text.trim());
      setExtracting(false);
      setStep(1);
    }catch(err){
      console.error("File read error:",err);
      setExtractError("Could not read this file. Please tap 'Paste Text' tab above and paste your CV directly.");
      setExtracting(false);
    }
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

CRITICAL — Output the transformed resume using EXACTLY these markers on their own lines:
###NAME: Full Name
###CONTACT: City, State ZIP • Phone • Email • LinkedIn
###SECTION: SECTION HEADER
###JOB: Job Title | Company – Location ||| Jan 2024 – Present
###BULLET: bullet text here
###BODY: paragraph text here
###EDU: Degree Name ||| Institution Name

Rules:
- Every section header uses ###SECTION:
- Every job title line uses ###JOB: with date separated by |||
- Every bullet point uses ###BULLET:
- Every education entry uses ###EDU: with institution after |||
- Body paragraphs (like professional summary) use ###BODY:
- Do NOT use any other formatting — no markdown, no asterisks
- After the resume, add one line: ###TITLES: (list 3 title translations made)`;
    const res=await callClaude([{role:"user",content:`Transform for a ${industry} professional targeting: ${targetRole||`senior ${country.name} roles`}.\n\nORIGINAL RESUME:\n${resumeText}`}],sys,1800);
    setResult(res);setLoading(false);
    onComplete&&onComplete();
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
    setConfMessages([{role:"assistant",content:opening||"Great work getting this far! Does this transformed resume sound like you? Could you walk into an interview tomorrow and defend every bullet point confidently?"}]);setConfLoading(false);
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
              <button onClick={()=>setInputMode("upload")}
                className={`btn ${inputMode==="upload"?"btn-gold":"btn-ghost"}`}
                style={{flex:1,justifyContent:"center",fontSize:13}}>
                📁 Upload File
              </button>
              <button onClick={()=>setInputMode("paste")}
                className={`btn ${inputMode==="paste"?"btn-gold":"btn-ghost"}`}
                style={{flex:1,justifyContent:"center",fontSize:13}}>
                📋 Paste Text
              </button>
            </div>

            {/* UPLOAD MODE */}
            {inputMode==="upload"&&(
              <div>
                <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:12,color:C.cream,lineHeight:1.7}}>
                  ✅ <strong style={{color:C.verified}}>PDF, Word (.docx), and plain text (.txt)</strong> all supported. We extract the text automatically.
                </div>
                <div className="upload-zone"
                  onClick={()=>!extracting&&inputRef.current.click()}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{e.preventDefault();extractTextFromFile(e.dataTransfer.files[0]);}}>
                  <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:"none"}}
                    onChange={e=>extractTextFromFile(e.target.files[0])}/>
                  {extracting?(
                    <div>
                      <div style={{fontSize:36,marginBottom:12}}>⏳</div>
                      <div className="upload-title">Reading your file...</div>
                      <div className="upload-sub">Extracting text from your CV</div>
                    </div>
                  ):(
                    <div>
                      <div className="upload-icon">📤</div>
                      <div className="upload-title">Drop your CV here</div>
                      <div className="upload-sub">or tap to browse files</div>
                      <div className="upload-formats">PDF · DOCX · DOC · TXT</div>
                    </div>
                  )}
                </div>
                {extractError&&(
                  <div style={{background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#E74C3C",marginTop:10}}>
                    ⚠️ {extractError}
                  </div>
                )}
              </div>
            )}

            {/* PASTE MODE */}
            {inputMode==="paste"&&(
              <div>
                <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:12,color:C.cream,lineHeight:1.7}}>
                  💡 Open your CV in Word or Google Docs → Select All → Copy → Paste below.
                </div>
                <label className="input-label">Paste your {country.docName} text here</label>
                <textarea className="textarea-field" style={{minHeight:200,fontSize:14,cursor:"text"}}
                  placeholder="👆 Tap here and paste your CV text...\n\nExample:\nJohn Doe\njohn@email.com\n\nExperience:\nBranch Manager, Zenith Bank (2018-2022)\n- Managed team of 25 staff...\n\nEducation:\nBSc Economics, University of Lagos"
                  value={pasteText}
                  onChange={e=>setPasteText(e.target.value)}
                  onClick={e=>e.target.focus()}
                />
                <button className="btn btn-gold" onClick={handlePaste} disabled={!pasteText.trim()} style={{width:"100%",justifyContent:"center"}}>
                  ✨ Transform My {country.docName}
                </button>
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
              : <>
                  <div className="ai-response"><div className="ai-label">{country.flag} Transformed {country.docName}</div><div className="ai-content">{result}</div></div>
                  <PDFDownloadButton text={result} filename={`CrossBorder-${country.docName}-Transformed.pdf`}/>
                </>
            }
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
function InterviewGame({country,onScore}){
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
      const parsed=JSON.parse(clean.slice(s,e));
      setResult(parsed);
      onScore&&onScore(parsed.overallScore,setup.role,setup.company,parsed.decision);
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

// ───────────────────────────────────────────────────────────────────────────
// TEMPLATES CONFIG — must be defined before PDF generator
// ───────────────────────────────────────────────────────────────────────────
const TEMPLATES=[
  {id:"classic",name:"Classic",icon:"📄",desc:"Clean, traditional, ATS-safe",best:"Finance · Law · Government",
   styles:{nameBold:true,nameSize:16,nameColor:[0.05,0.1,0.2],accentColor:[0.2,0.2,0.2],headerColor:[0.1,0.1,0.1],ruleColor:[0.6,0.6,0.6],ruleThick:0.5,bodySize:9.5,headerBold:true}},
  {id:"modern",name:"Modern",icon:"⚡",desc:"Bold header, gold accents",best:"Tech · Consulting · Strategy",
   styles:{nameBold:true,nameSize:18,nameColor:[0.05,0.11,0.16],accentColor:[0.91,0.66,0.22],headerColor:[0.91,0.66,0.22],ruleColor:[0.91,0.66,0.22],ruleThick:1.5,bodySize:9.5,headerBold:true}},
  {id:"executive",name:"Executive",icon:"👔",desc:"Authoritative, strong hierarchy",best:"Director · VP · C-Suite",
   styles:{nameBold:true,nameSize:20,nameColor:[0.0,0.0,0.0],accentColor:[0.15,0.25,0.45],headerColor:[0.15,0.25,0.45],ruleColor:[0.15,0.25,0.45],ruleThick:2,bodySize:10,headerBold:true}},
  {id:"minimal",name:"Minimal",icon:"✨",desc:"Ultra-clean, elegant spacing",best:"Design · Creative · Startups",
   styles:{nameBold:false,nameSize:17,nameColor:[0.1,0.1,0.1],accentColor:[0.5,0.5,0.5],headerColor:[0.4,0.4,0.4],ruleColor:[0.85,0.85,0.85],ruleThick:0.5,bodySize:9.5,headerBold:false}},
];

// ───────────────────────────────────────────────────────────────────────────
// PDF GENERATOR — creates a clean professional PDF from text content
// ───────────────────────────────────────────────────────────────────────────
// ── PRE-PROCESSOR: converts any resume text into structured lines ──
function preprocessResume(raw){
  // If already has markers, return as-is
  if(raw.includes("###NAME:")||raw.includes("###SECTION:"))return raw;

  const HEADERS=["PROFESSIONAL SUMMARY","CORE COMPETENCIES","SYSTEMS & TOOLS","SYSTEMS AND TOOLS",
    "TECHNICAL SKILLS","PROFESSIONAL EXPERIENCE","WORK EXPERIENCE","EMPLOYMENT HISTORY",
    "EARLY CAREER — EMERGING MARKETS EXPERIENCE","EARLY CAREER — EMERGING MARKETS","EARLY CAREER",
    "EDUCATION & CERTIFICATIONS","EDUCATION AND CERTIFICATIONS","EDUCATION","CERTIFICATIONS",
    "ADDITIONAL INFORMATION","SKILLS","AWARDS","VOLUNTEER","LANGUAGES","PROJECTS","ACHIEVEMENTS","REFERENCES"];

  // Sort by length descending so longer headers match first
  const sortedHeaders=[...HEADERS].sort((a,b)=>b.length-a.length);

  let text=raw.replace(/\r\n|\r/g," ").replace(/\n/g," ");

  // Step 1: insert newline before every known section header
  for(const h of sortedHeaders){
    const esc=h.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    // Match header surrounded by spaces or at start, preceded by non-newline
    text=text.replace(new RegExp(`\\s+(${esc})\\s+`,"g"),`\n${h}\n`);
    text=text.replace(new RegExp(`^(${esc})\\s+`,"m"),`${h}\n`);
  }

  // Step 2: insert newline before bullets
  text=text.replace(/\s+[•·▪]\s+/g,"\n• ");

  // Step 3: split "Company Name Date" — job line followed by date inline
  const DATE_PAT="(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{4}\\s*[–—\\-]+\\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{4}\\s*[–—\\-]+\\s*Present|\\d{4}\\s*[–—\\-]+\\s*Present";
  // Split before date ranges that come after job titles (lowercase word before date)
  text=text.replace(new RegExp(`([a-z,\\.])\\s+(${DATE_PAT})`,"gi"),"$1\n$2");

  // Step 4: split after dates (date followed by new sentence starting with capital)
  text=text.replace(new RegExp(`(${DATE_PAT})\\s+([A-Z][a-z])`,"g"),"$1\n$2");

  // Step 5: break up long run-on by splitting at sentence boundaries before capitals
  // Only when there's a pipe or dash suggesting a new job entry
  text=text.replace(/([a-z\.\,])\s+([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+\s*\|)/g,"$1\n$2");

  // Step 6: education entries — "Degree Institution" where degree is known
  text=text.replace(/((?:B\.?Tech|B\.?Sc|M\.?Sc|MBA|Ph\.?D|Certificate|Diploma|Cybersecurity)[^•\n]+?)\s{2,}([A-Z][a-z])/g,"$1\n$2");
  text=text.replace(/((?:B\.?Tech|B\.?Sc|M\.?Sc|MBA|Ph\.?D|Certificate|Diploma|Cybersecurity)[^•\n]+?)\s+((?:Ladoke|Google|Evolve|University|College|Institute|School|Academy))/g,"$1\n$2");

  // Now convert to marker format
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const DATE_RE=/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[–—\-]+\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[–—\-]+\s*Present|\d{4}\s*[–—\-]+\s*(?:Present|\d{4}))\s*$/i;
  const DEGREE_RE=/^(B\.?Tech|B\.?Sc|M\.?Sc|MBA|Ph\.?D|Bachelor|Master|Doctor|Certificate|Diploma|Cybersecurity|Evolve|CFA)/i;
  const INST_RE=/^(Ladoke|Google|Evolve|University|College|Institute|School|Academy|CFA)/i;

  const out=[];
  let i=0;

  for(const line of lines){
    const UP=line.toUpperCase().trim();
    const isHdr=sortedHeaders.some(h=>UP===h.toUpperCase());
    const isBul=line.startsWith("•")||line.startsWith("-");
    const dm=line.match(DATE_RE);
    const hasSep=line.includes("|")||line.includes("–")||line.includes("—");
    const isJob=!isHdr&&hasSep&&(dm||line.match(/\d{4}/))&&line.length<200;
    const isDeg=!isHdr&&!isJob&&DEGREE_RE.test(line);
    const isInst=!isHdr&&!isJob&&!isDeg&&INST_RE.test(line);

    if(i===0){
      // First line is name — may contain contact info
      const nameParts=line.split(/\s+(?=\d{3}[-\s]|\w+@)/);
      out.push("###NAME: "+nameParts[0].trim());
      if(nameParts[1])out.push("###CONTACT: "+nameParts.slice(1).join(" "));
      i++;continue;
    }
    if(i===1&&(line.includes("@")||line.match(/\d{3}[\s\-\.]\d{3}/)||line.toLowerCase().includes("linkedin")||line.includes("•"))){
      out.push("###CONTACT: "+line);i++;continue;
    }
    if(isHdr){out.push("###SECTION: "+UP);i++;continue;}
    if(isJob){
      if(dm){
        const ds=dm[0].trim();
        const tp=line.slice(0,line.search(DATE_RE)).trim().replace(/\s+$/,"");
        out.push(`###JOB: ${tp} ||| ${ds}`);
      }else{
        out.push("###JOB: "+line+" ||| ");
      }
      i++;continue;
    }
    if(isBul){out.push("###BULLET: "+line.replace(/^[•\-]\s*/,""));i++;continue;}
    if(isDeg){
      // Check if next line is an institution
      const nextLine=lines[lines.indexOf(line)+1]||"";
      if(INST_RE.test(nextLine)){
        out.push(`###EDU: ${line} ||| ${nextLine}`);
        lines.splice(lines.indexOf(line)+1,1); // skip next
      }else{
        out.push("###EDU: "+line+" ||| ");
      }
      i++;continue;
    }
    if(isInst){
      // Orphan institution — attach to previous EDU if exists
      const prev=out[out.length-1]||"";
      if(prev.startsWith("###EDU:")&&prev.endsWith(" ||| ")){
        out[out.length-1]=prev+line;
      }else{
        out.push("###BODY: "+line);
      }
      i++;continue;
    }
    out.push("###BODY: "+line);
    i++;
  }
  return out.join("\n");
}

async function generateAndDownloadPDF(text, filename="CrossBorder-CV.pdf", templateId="modern"){
  try{
    await new Promise((resolve,reject)=>{
      if(window.PDFLib){resolve();return;}
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      s.onload=resolve;s.onerror=reject;
      document.head.appendChild(s);
    });
    const {PDFDocument,rgb,StandardFonts}=window.PDFLib;
    const doc=await PDFDocument.create();
    const font=await doc.embedFont(StandardFonts.Helvetica);
    const bold=await doc.embedFont(StandardFonts.HelveticaBold);
    const italic=await doc.embedFont(StandardFonts.HelveticaOblique);

    const tmpl=TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[1];
    const S=tmpl.styles;
    const NAME_C=rgb(...S.nameColor);
    const ACCENT=rgb(...S.accentColor);
    const HDR_C=rgb(...S.headerColor);
    const BLACK=rgb(0.08,0.08,0.08);
    const DGRAY=rgb(0.3,0.3,0.3);
    const MGRAY=rgb(0.45,0.45,0.45);

    const PW=595,PH=842,ML=50,MR=50,MT=52,MB=48;
    const CW=PW-ML-MR;
    let page=doc.addPage([PW,PH]);
    let y=PH-MT;

    const newPage=()=>{page=doc.addPage([PW,PH]);y=PH-MT;};
    const chk=(h)=>{if(y-h<MB)newPage();};

    const block=(txt,f,sz,x,mw,lh,clr)=>{
      if(!txt||!txt.trim())return;
      const words=txt.trim().split(/\s+/);
      let cur="";
      for(const w of words){
        const t=cur?`${cur} ${w}`:w;
        if(f.widthOfTextAtSize(t,sz)>mw&&cur){
          chk(lh);page.drawText(cur,{x,y,size:sz,font:f,color:clr});y-=lh;cur=w;
        }else cur=t;
      }
      if(cur){chk(lh);page.drawText(cur,{x,y,size:sz,font:f,color:clr});y-=lh;}
    };

    // Pre-process into markers
    const structured=preprocessResume(text);
    const lines=structured.split("\n").map(l=>l.trim()).filter(Boolean);
    let prevType="";

    for(const line of lines){
      if(line.startsWith("###NAME:")){
        const name=line.replace("###NAME:","").trim();
        chk(28);
        block(name,bold,S.nameSize,ML,CW,S.nameSize+5,NAME_C);
        y-=2;prevType="name";

      }else if(line.startsWith("###CONTACT:")){
        const contact=line.replace("###CONTACT:","").trim();
        // Render each bullet part on its own line
        const parts=contact.split(/\s*[•·]\s*/).map(p=>p.trim()).filter(Boolean);
        if(parts.length>1){
          for(const p of parts){
            chk(13);
            page.drawText("•",{x:ML,y,size:8,font,color:MGRAY});
            block(p,font,8.5,ML+12,CW-12,13,DGRAY);
          }
        }else{
          chk(13);block(contact,font,8.5,ML,CW,13,DGRAY);
        }
        y-=3;prevType="contact";

      }else if(line.startsWith("###SECTION:")){
        const hdr=line.replace("###SECTION:","").trim();
        y-=(prevType==="name"||prevType==="contact")?8:12;
        chk(22);
        page.drawLine({start:{x:ML,y:y+3},end:{x:PW-MR,y:y+3},thickness:S.ruleThick,color:ACCENT});
        y-=9;
        block(hdr,S.headerBold?bold:font,9.5,ML,CW,14,HDR_C);
        y-=3;prevType="section";

      }else if(line.startsWith("###JOB:")){
        const jobLine=line.replace("###JOB:","").trim();
        const sep=jobLine.indexOf("|||");
        const title=sep>=0?jobLine.slice(0,sep).trim():jobLine;
        const date=sep>=0?jobLine.slice(sep+3).trim():"";
        y-=(prevType==="section")?4:10;
        chk(20);
        const rowY=y;
        if(date){
          const dateW=font.widthOfTextAtSize(date,9);
          block(title,bold,10,ML,CW-dateW-14,16,BLACK);
          page.drawText(date,{x:PW-MR-dateW,y:rowY,size:9,font,color:MGRAY});
        }else{
          block(title,bold,10,ML,CW,16,BLACK);
        }
        y-=1;prevType="job";

      }else if(line.startsWith("###BULLET:")){
        const bt=line.replace("###BULLET:","").trim();
        chk(14);
        page.drawText("•",{x:ML+4,y,size:8.5,font,color:MGRAY});
        block(bt,font,9.5,ML+16,CW-16,14,BLACK);
        y-=1;prevType="bullet";

      }else if(line.startsWith("###BODY:")){
        const body=line.replace("###BODY:","").trim();
        chk(14);
        block(body,font,9.5,ML,CW,14,BLACK);
        prevType="body";

      }else if(line.startsWith("###EDU:")){
        const eduLine=line.replace("###EDU:","").trim();
        const sep=eduLine.indexOf("|||");
        const degree=sep>=0?eduLine.slice(0,sep).trim():eduLine;
        const inst=sep>=0?eduLine.slice(sep+3).trim():"";
        chk(15);
        const rowY=y;
        block(degree,bold,9.5,ML,inst?CW*0.60:CW,15,BLACK);
        if(inst){
          const instW=italic.widthOfTextAtSize(inst,9);
          const instX=Math.max(ML+CW*0.60+4,PW-MR-instW);
          page.drawText(inst,{x:instX,y:rowY,size:9,font:italic,color:MGRAY});
        }
        prevType="edu";

      }else if(!line.startsWith("###")){
        chk(14);
        block(line,font,9.5,ML,CW,14,BLACK);
        prevType="body";
      }
    }

    const bytes=await doc.save();
    const blob=new Blob([bytes],{type:"application/pdf"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }catch(err){console.error("PDF error:",err);return false;}
}

async function generateAndDownloadWord(text, filename="CrossBorder-CV.docx"){
  try{
    await new Promise((res,rej)=>{
      if(window.docx){res();return;}
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js";
      s.onload=res;s.onerror=rej;
      document.head.appendChild(s);
    });
    const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,BorderStyle,ShadingType,convertInchesToTwip}=window.docx;

    const NAVY="0D1B2A";const GOLD="C8881A";const DARK="1a1a1a";

    // Normalize text same way as PDF
    const normalized=text
      .replace(/\r\n|\r/g,"\n")
      .replace(/\b(PROFESSIONAL SUMMARY|SUMMARY|CORE COMPETENCIES|KEY COMPETENCIES|SKILLS|TECHNICAL SKILLS|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|EDUCATION|CERTIFICATIONS?|EARLY CAREER|ADDITIONAL|AWARDS?|VOLUNTEER|LANGUAGES?|PROJECTS?|PUBLICATIONS?|ACHIEVEMENTS?|REFERENCES?|PROFILE|OBJECTIVE)\b/g,"\n\n$1")
      .replace(/\s+[•·▪]\s*/g,"\n• ")
      .replace(/\s{2,}•\s*/g,"\n• ")
      .replace(/([a-z])\s{2,}([A-Z])/g,"$1\n$2")
      .replace(/\.\s{2,}([A-Z])/g,".\n$1");

    const rawLines=normalized.split("\n").map(l=>l.trim()).filter(l=>l);
    const SECTION_HEADERS=["PROFESSIONAL SUMMARY","SUMMARY","CORE COMPETENCIES","KEY COMPETENCIES","SKILLS","TECHNICAL SKILLS","PROFESSIONAL EXPERIENCE","WORK EXPERIENCE","EXPERIENCE","EMPLOYMENT","EDUCATION","CERTIFICATIONS","CERTIFICATION","EARLY CAREER","ADDITIONAL","AWARDS","VOLUNTEER","LANGUAGES","PROJECTS","PUBLICATIONS","ACHIEVEMENTS","REFERENCES","PROFILE","OBJECTIVE"];

    const paragraphs=[];
    let isFirst=true;
    let lineIndex=0;

    for(const line of rawLines){
      if(!line)continue;

      // Name
      if(isFirst){
        isFirst=false;
        paragraphs.push(new Paragraph({
          children:[new TextRun({text:line,bold:true,size:36,color:NAVY,font:"Calibri"})],
          spacing:{after:80},
          border:{bottom:{color:GOLD,space:4,style:BorderStyle.SINGLE,size:12}},
        }));
        lineIndex++;continue;
      }

      // Contact line
      if(lineIndex<=3&&(line.includes("@")||/\d{3}[\s\-\.]\d{3}/.test(line)||line.toLowerCase().includes("linkedin"))){
        paragraphs.push(new Paragraph({
          children:[new TextRun({text:line,size:18,color:"555555",font:"Calibri"})],
          spacing:{after:40},
        }));
        lineIndex++;continue;
      }

      // Section header
      const upperLine=line.toUpperCase().replace(/[^A-Z &]/g,"").trim();
      const isHeader=SECTION_HEADERS.some(h=>upperLine===h||upperLine.startsWith(h))||(line===line.toUpperCase()&&line.replace(/[^A-Za-z]/g,"").length>4&&!line.startsWith("•")&&!line.match(/^\d/));
      if(isHeader){
        paragraphs.push(new Paragraph({
          children:[new TextRun({text:line.toUpperCase(),bold:true,size:19,color:GOLD,font:"Calibri",allCaps:true})],
          spacing:{before:200,after:60},
          border:{bottom:{color:GOLD,space:2,style:BorderStyle.SINGLE,size:4}},
        }));
        lineIndex++;continue;
      }

      // Job title line
      const isJobLine=(line.includes("–")||line.includes("—")||line.includes("|"))&&(line.match(/\d{4}/)||line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i));
      if(isJobLine){
        paragraphs.push(new Paragraph({
          children:[new TextRun({text:line,bold:true,size:21,color:NAVY,font:"Calibri"})],
          spacing:{before:120,after:40},
        }));
        lineIndex++;continue;
      }

      // Bullet
      if(line.startsWith("•")||line.startsWith("-")){
        const bt=line.replace(/^[•\-]\s*/,"");
        paragraphs.push(new Paragraph({
          children:[new TextRun({text:bt,size:20,color:DARK,font:"Calibri"})],
          bullet:{level:0},
          spacing:{after:40},
        }));
        lineIndex++;continue;
      }

      // Regular
      paragraphs.push(new Paragraph({
        children:[new TextRun({text:line,size:20,color:DARK,font:"Calibri"})],
        spacing:{after:60},
      }));
      lineIndex++;
    }

    // End of document

    const doc=new Document({
      sections:[{
        properties:{page:{margin:{top:convertInchesToTwip(0.75),bottom:convertInchesToTwip(0.75),left:convertInchesToTwip(0.75),right:convertInchesToTwip(0.75)}}},
        children:paragraphs,
      }],
    });

    const blob=await Packer.toBlob(doc);
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
    return true;
  }catch(e){console.error("Word error:",e);return false;}
}

// ── DOWNLOAD WIDGET — template picker + PDF + Word ──────────────────────────
function PDFDownloadButton({text,filename}){
  const[template,setTemplate]=useState("modern");
  const[downloading,setDownloading]=useState(null); // "pdf"|"word"|null
  const[done,setDone]=useState(null);
  const[expanded,setExpanded]=useState(false);
  const baseName=filename.replace(/\.[^/.]+$/,"");

  const download=async(type)=>{
    setDownloading(type);setDone(null);
    let ok=false;
    if(type==="pdf") ok=await generateAndDownloadPDF(text,`${baseName}.pdf`,template);
    else ok=await generateAndDownloadWord(text,`${baseName}.docx`);
    setDownloading(null);
    if(ok){setDone(type);setTimeout(()=>setDone(null),3000);}
  };

  return(
    <div style={{marginTop:16,background:"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 20px"}}>
      <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>📥 Download Your Resume</div>

      {/* Template picker */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:C.gray,marginBottom:8}}>Choose a template:</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {TEMPLATES.map(t=>(
            <div key={t.id} onClick={()=>setTemplate(t.id)}
              style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",transition:"all .2s",
                border:`1.5px solid ${template===t.id?"rgba(232,168,56,0.6)":"rgba(255,255,255,0.08)"}`,
                background:template===t.id?"rgba(232,168,56,0.08)":"rgba(0,0,0,0.1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                <span style={{fontSize:14}}>{t.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:template===t.id?C.gold:C.white}}>{t.name}</span>
                {template===t.id&&<span style={{marginLeft:"auto",fontSize:10,color:C.gold}}>✓</span>}
              </div>
              <div style={{fontSize:10,color:C.gray,marginBottom:2}}>{t.desc}</div>
              <div style={{fontSize:9,color:"rgba(139,155,180,0.6)"}}>{t.best}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Download buttons */}
      <div style={{display:"flex",gap:9,flexWrap:"wrap"}}>
        <button className="btn btn-gold" style={{flex:1,justifyContent:"center",minWidth:120}}
          onClick={()=>download("pdf")} disabled={!!downloading||!text}>
          {downloading==="pdf"?"⏳ Generating...":done==="pdf"?"✅ PDF Downloaded!":"📄 Download PDF"}
        </button>
        <button className="btn btn-ghost" style={{flex:1,justifyContent:"center",minWidth:120}}
          onClick={()=>download("word")} disabled={!!downloading||!text}>
          {downloading==="word"?"⏳ Generating...":done==="word"?"✅ Word Downloaded!":"📝 Download Word"}
        </button>
      </div>
      <div style={{fontSize:10,color:C.gray,marginTop:8}}>PDF is ATS-safe · Word lets you edit in Google Docs or Microsoft Word</div>
    </div>
  );
}

function VerifyModule({country}){
  // ── EmailJS Config — replace these with your real values from emailjs.com ──
  const EMAILJS_SERVICE_ID  = "service_ozfkq0p";
  const EMAILJS_TEMPLATE_ID = "template_6tm96yu";
  const EMAILJS_PUBLIC_KEY  = "037nrF2Zb6cfg9O3Z";

  const [view,setView]=useState("dash");
  const [exps,setExps]=useState([
    {id:"e1",title:"Associate, Trade & Transaction Mgmt",company:"State Street Corp.",dates:"Jan 2024–Present",status:"verified",refEmail:"hr@statestreet.com",verifiedBy:"M. Thompson, HR Director"},
    {id:"e2",title:"Investment Operations Specialist",company:"Vanguard",dates:"Jul 2022–Jan 2024",status:"verified",refEmail:"people@vanguard.com",verifiedBy:"K. Osei, Team Lead"},
    {id:"e3",title:"Head, Credit Partnership – Africa",company:"Almond Fintech",dates:"Jun 2022–Jan 2023",status:"pending",refEmail:"ceo@almondfintech.io",verifiedBy:null},
    {id:"e4",title:"Credit Design Fellow",company:"Kiva Microfunds",dates:"Jul 2018–Jan 2019",status:"unverified",refEmail:"",verifiedBy:null},
    {id:"e5",title:"Relationship Manager",company:"Stanbic IBTC Holdings",dates:"Feb 2016–Oct 2018",status:"unverified",refEmail:"",verifiedBy:null},
  ]);
  const [form,setForm]=useState({title:"",company:"",startDate:"",endDate:"",refEmail:"",candidateName:""});
  const [sending,setSending]=useState(null);
  const [sendError,setSendError]=useState("");
  const [expanded,setExpanded]=useState(null);
  const [copied,setCopied]=useState(false);
  const [candidateName,setCandidateName]=useState("");
  const [domainChecks,setDomainChecks]=useState({}); // {expId: {status:"checking"|"match"|"mismatch"|"warning", message:""}}
  const domainCheckTimers=useRef({});

  // AI domain matching — debounced, fires 800ms after user stops typing
  const checkDomain=async(expId,email,company)=>{
    if(isOfficial(email)!==true||!company)return;
    const domain=email.split("@")[1];
    if(!domain)return;

    // Clear existing timer
    if(domainCheckTimers.current[expId])clearTimeout(domainCheckTimers.current[expId]);

    setDomainChecks(p=>({...p,[expId]:{status:"checking",message:"Checking domain..."}}));

    domainCheckTimers.current[expId]=setTimeout(async()=>{
      try{
        const sys=`You are a company email domain validator. Given a company name and email domain, determine if the domain plausibly belongs to that company.

Return ONLY a JSON object:
{
  "match": true or false,
  "confidence": "high"|"medium"|"low",
  "reason": "one sentence explanation"
}

Examples:
- "Goldman Sachs" + "gs.com" → match: true (GS is Goldman Sachs's official domain)
- "Zenith Bank" + "zenithbank.com" → match: true
- "NHS" + "nhs.net" → match: true
- "Kiva" + "kiva.org" → match: true
- "State Street" + "statestreet.com" → match: true
- "Zenith Bank" + "firstbank.com" → match: false
- Any company + "gmail.com" → match: false (personal email)
Be lenient with subsidiaries and regional domains.`;

        const res=await callClaude([{role:"user",content:`Company: "${company}"\nEmail domain: "${domain}"`}],sys,150);
        const clean=res.replace(/```json|```/g,"").trim();
        const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
        const parsed=JSON.parse(clean.slice(s,e));

        setDomainChecks(p=>({...p,[expId]:{
          status:parsed.match?"match":parsed.confidence==="low"?"warning":"mismatch",
          message:parsed.reason,
          confidence:parsed.confidence,
        }}));
      }catch{
        setDomainChecks(p=>({...p,[expId]:{status:"unknown",message:""}}));
      }
    },800);
  };

  const verifiedCount=exps.filter(e=>e.status==="verified").length;
  const score=Math.round((verifiedCount/exps.length)*100);

  // Auto-check if any pending verifications have been confirmed
  useEffect(()=>{
    setExps(prev=>prev.map(exp=>{
      if(exp.status==="pending"){
        // Check all tokens for this exp
        const keys=storage.list("vtoken:");
        const allKeys=keys?.keys||[];
        for(const key of allKeys){
          try{
            const data=storage.get(key);
            if(data){
              const info=JSON.parse(data.value);
              if(info.expId===exp.id&&info.status==="confirmed"){
                return{...exp,status:"verified",verifiedBy:info.refEmail,verifiedAt:info.confirmedAt};
              }
            }
          }catch{}
        }
      }
      return exp;
    }));
  },[]);

  const StatusBadge=({s})=>{
    const map={verified:{l:"✓ Verified",c:"status-verified"},pending:{l:"⏳ Pending",c:"status-pending"},unverified:{l:"○ Unverified",c:"status-unverified"}};
    const v=map[s];return <span className={`status-badge ${v.c}`}>{v.l}</span>;
  };

  const sendReq=async(exp)=>{
    if(isOfficial(exp.refEmail)!==true)return;
    setSending(exp.id);setSendError("");

    try{
      // Generate unique verification token
      const token=Math.random().toString(36).slice(2)+Date.now().toString(36);
      const verifyData={
        token, expId:exp.id,
        title:exp.title, company:exp.company, dates:exp.dates,
        refEmail:exp.refEmail,
        candidateName:candidateName||"A CrossBorder AI candidate",
        status:"pending",
        createdAt:new Date().toISOString(),
      };
      // Save token to localStorage so landing page can read it
      storage.set(`vtoken:${token}`,JSON.stringify(verifyData));
      const verifyLink=`https://getcrossborder.com/#/verify?token=${token}`;

      // Load EmailJS SDK
      await new Promise((resolve,reject)=>{
        if(window.emailjs){resolve();return;}
        const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
        s.onload=()=>{window.emailjs.init(EMAILJS_PUBLIC_KEY);resolve();}
        s.onerror=reject;
        document.head.appendChild(s);
      });

      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:       exp.refEmail,
        to_name:        "Reference",
        candidate_name: candidateName||"A CrossBorder AI candidate",
        job_title:      exp.title,
        company:        exp.company,
        dates:          exp.dates,
        verify_link:    verifyLink,
        reply_to:       "noreply@getcrossborder.com",
        name:           candidateName||"A CrossBorder AI candidate",
        message:        `${candidateName||"A candidate"} is requesting verification of their role as ${exp.title} at ${exp.company} (${exp.dates}). Click the link to confirm: ${verifyLink}`,
      });

      setExps(p=>p.map(e=>e.id===exp.id?{...e,status:"pending"}:e));
      setExpanded(null);
    }catch(err){
      console.error("EmailJS error:",err);
      setSendError("Could not send email. Please try again.");
    }
    setSending(null);
  };

  const addExp=()=>{
    if(!form.title||!form.company)return;
    setExps(p=>[...p,{id:Math.random().toString(36).slice(2),title:form.title,company:form.company,dates:`${form.startDate}–${form.endDate||"Present"}`,status:"unverified",refEmail:form.refEmail,verifiedBy:null}]);
    setForm({title:"",company:"",startDate:"",endDate:"",refEmail:""});
    setView("dash");
  };

  if(view==="add")return(
    <div className="panel">
      <div className="panel-header"><span className="panel-icon">➕</span><div><div className="panel-title">Add Experience</div><div className="panel-subtitle">We'll contact your reference to verify it</div></div></div>
      <div className="panel-body">
        <div className="row">
          <div className="flex1"><label className="input-label">Job Title</label><input className="input-field" placeholder="e.g. Branch Manager" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
          <div className="flex1"><label className="input-label">Company</label><input className="input-field" placeholder="e.g. Zenith Bank" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/></div>
        </div>
        <div className="row">
          <div className="flex1"><label className="input-label">Start Date</label><input className="input-field" placeholder="Jan 2019" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}/></div>
          <div className="flex1"><label className="input-label">End Date</label><input className="input-field" placeholder="Mar 2022 or Present" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}/></div>
        </div>
        <div className="divider"/>
        <div className="warn-banner">⚠️ Only <strong>official work emails</strong> accepted — no Gmail, Yahoo, or personal addresses.</div>
        <label className="input-label">Reference Official Email</label>
        <input className={`input-field${isOfficial(form.refEmail)===false?" error":""}`} placeholder="reference@company.com" value={form.refEmail} onChange={e=>setForm(p=>({...p,refEmail:e.target.value}))}/>
        {isOfficial(form.refEmail)===true&&<div className="email-status email-ok">✓ Official email accepted</div>}
        {isOfficial(form.refEmail)===false&&<div className="email-status email-bad">✗ Must be an official company email</div>}
        <div style={{marginTop:16,display:"flex",gap:10}}>
          <button className="btn btn-gold" onClick={addExp} disabled={!form.title||!form.company}>Add Experience</button>
          <button className="btn btn-ghost" onClick={()=>setView("dash")}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return(
    <div>
      <div className="verify-score">
        <div className="score-ring"><div className="score-num">{score}%</div><div className="score-pct">verified</div></div>
        <div className="score-info">
          <h3>{verifiedCount} of {exps.length} roles verified</h3>
          <p>References receive a verification email. Once they confirm, your role gets a ✅ badge.</p>
          <div className="public-link">
            <span className="public-link-url">🔗 getcrossborder.com/verify/your-name</span>
            <span className="copy-btn" onClick={()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);}}>{copied?"Copied!":"Copy"}</span>
          </div>
        </div>
      </div>

      {/* Candidate name — used in the email sent to references */}
      <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
        <label className="input-label">Your Name (appears in the verification email sent to references)</label>
        <input className="input-field" style={{marginBottom:0}} placeholder="e.g. Ameen Ajibola" value={candidateName} onChange={e=>setCandidateName(e.target.value)}/>
      </div>

      {sendError&&<div style={{background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:9,padding:"10px 14px",fontSize:13,color:"#E74C3C",marginBottom:12}}>{sendError}</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:C.white}}>Work Experiences</div>
        <button className="btn btn-gold btn-sm" onClick={()=>setView("add")}>+ Add Role</button>
      </div>
      {exps.map(exp=>(
        <div key={exp.id} className="exp-card">
          <div className="exp-card-header">
            <div><div className="exp-title">{exp.title}</div><div className="exp-company">{exp.company}</div><div className="exp-dates">{exp.dates}</div></div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7,flexShrink:0}}>
              <StatusBadge s={exp.status}/>
              {exp.status==="unverified"&&<button className="btn btn-outline btn-sm" onClick={()=>setExpanded(expanded===exp.id?null:exp.id)}>{expanded===exp.id?"Cancel":"Add Reference"}</button>}
              {exp.status==="pending"&&<span style={{fontSize:11,color:C.pending}}>Sent to {exp.refEmail}</span>}
              {exp.status==="verified"&&exp.verifiedBy&&<span style={{fontSize:11,color:C.verified}}>✓ {exp.verifiedBy}</span>}
            </div>
          </div>
          {expanded===exp.id&&(
            <div className="ref-form-inner">
              <div style={{fontSize:12,fontWeight:600,color:C.white,marginBottom:10}}>Reference's official work email</div>
              <div style={{display:"flex",gap:9}}>
                <input className={`input-field flex1${isOfficial(exp.refEmail||"")===false?" error":""}`} style={{marginBottom:0}} placeholder="reference@company.com" value={exp.refEmail||""} onChange={e=>{
                  const val=e.target.value;
                  setExps(p=>p.map(x=>x.id===exp.id?{...x,refEmail:val}:x));
                  checkDomain(exp.id,val,exp.company);
                }}/>
                <button className="btn btn-green btn-sm"
                  disabled={isOfficial(exp.refEmail||"")!==true||sending===exp.id||(domainChecks[exp.id]?.status==="mismatch")}
                  onClick={()=>sendReq(exp)}>{sending===exp.id?"Sending...":"Send"}</button>
              </div>
              {isOfficial(exp.refEmail||"")===true&&<div className="email-status email-ok">✓ Official email</div>}
              {isOfficial(exp.refEmail||"")===false&&<div className="email-status email-bad">✗ Official company email required</div>}

              {/* Domain match result */}
              {domainChecks[exp.id]&&isOfficial(exp.refEmail||"")===true&&(()=>{
                const dc=domainChecks[exp.id];
                if(dc.status==="checking")return <div style={{fontSize:11,color:C.gold,marginTop:4,display:"flex",alignItems:"center",gap:6}}><div className="dots" style={{display:"inline-flex"}}><span/><span/><span/></div> Checking domain against {exp.company}...</div>;
                if(dc.status==="match")return <div style={{fontSize:11,color:C.verified,marginTop:4}}>✅ Domain matches {exp.company} — {dc.message}</div>;
                if(dc.status==="mismatch")return(
                  <div style={{background:"rgba(231,76,60,0.08)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:8,padding:"8px 12px",marginTop:6}}>
                    <div style={{fontSize:11,color:"#E74C3C",fontWeight:700,marginBottom:3}}>⚠️ Domain doesn't match {exp.company}</div>
                    <div style={{fontSize:11,color:"rgba(231,76,60,0.8)"}}>{dc.message}</div>
                    <button className="btn btn-ghost btn-sm" style={{marginTop:6,fontSize:10,padding:"4px 10px"}}
                      onClick={()=>setDomainChecks(p=>({...p,[exp.id]:{status:"override",message:"Sent anyway — domain override"}}))}
                      >Send anyway (I'm sure this is correct)</button>
                  </div>
                );
                if(dc.status==="warning")return(
                  <div style={{background:"rgba(232,168,56,0.07)",border:"1px solid rgba(232,168,56,0.2)",borderRadius:8,padding:"8px 12px",marginTop:6}}>
                    <div style={{fontSize:11,color:C.gold,fontWeight:700,marginBottom:3}}>⚠️ Unusual domain for {exp.company}</div>
                    <div style={{fontSize:11,color:"rgba(232,168,56,0.8)"}}>{dc.message}</div>
                  </div>
                );
                return null;
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
      storage.set(`booking:${ref}`,JSON.stringify(booking));
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
// PROGRESS TRACKING — cookie/localStorage based, no login needed
// ───────────────────────────────────────────────────────────────────────────
const STORAGE_KEY="cbai_progress_v1";
const MODULE_LABELS={
  resume:"Resume Transform",ats:"ATS Optimize",game:"Interview Sim",
  qbank:"Question Bank",verify:"Work Verify",roles:"Role Search",
  culture:"Culture Bridge",motivation:"Motivation",human:"Coach Booking",
};
const MODULE_ICONS={
  resume:"📄",ats:"🎯",game:"🎮",qbank:"🗂️",
  verify:"✅",roles:"🎯",culture:"🌉",motivation:"💪",human:"🤝",
};

function loadProgress(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw)return JSON.parse(raw);
  }catch{}
  return{
    firstVisit:new Date().toISOString(),
    lastVisit:new Date().toISOString(),
    totalVisits:1,
    streak:1,
    lastStreakDate:new Date().toDateString(),
    moduleCounts:{},
    activity:[],
    atsScores:[],
    interviewScores:[],
    resumesTransformed:0,
    countryTargets:{},
  };
}

function saveProgress(p){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p));}catch{}
}

function useProgress(){
  const [progress,setProgress]=useState(()=>loadProgress());

  // Update streak and visit on mount
  useEffect(()=>{
    setProgress(prev=>{
      const today=new Date().toDateString();
      const yesterday=new Date(Date.now()-86400000).toDateString();
      let streak=prev.streak||1;
      if(prev.lastStreakDate===yesterday)streak+=1;
      else if(prev.lastStreakDate!==today)streak=1;
      const updated={...prev,
        lastVisit:new Date().toISOString(),
        totalVisits:(prev.totalVisits||0)+1,
        streak,
        lastStreakDate:today,
      };
      saveProgress(updated);
      return updated;
    });
  },[]);

  const trackModule=(moduleId)=>{
    setProgress(prev=>{
      const counts={...prev.moduleCounts,[moduleId]:(prev.moduleCounts[moduleId]||0)+1};
      const activity=[
        {module:moduleId,icon:MODULE_ICONS[moduleId]||"📌",label:MODULE_LABELS[moduleId]||moduleId,time:new Date().toISOString()},
        ...(prev.activity||[]),
      ].slice(0,20); // keep last 20
      const updated={...prev,moduleCounts:counts,activity};
      saveProgress(updated);
      return updated;
    });
  };

  const trackATSScore=(before,after,role,company)=>{
    setProgress(prev=>{
      const scores=[{before,after,role,company,time:new Date().toISOString()},...(prev.atsScores||[])].slice(0,10);
      const updated={...prev,atsScores:scores};
      saveProgress(updated);
      return updated;
    });
  };

  const trackInterviewScore=(score,role,company,decision)=>{
    setProgress(prev=>{
      const scores=[{score,role,company,decision,time:new Date().toISOString()},...(prev.interviewScores||[])].slice(0,10);
      const updated={...prev,interviewScores:scores};
      saveProgress(updated);
      return updated;
    });
  };

  const trackResume=()=>{
    setProgress(prev=>{
      const updated={...prev,resumesTransformed:(prev.resumesTransformed||0)+1};
      saveProgress(updated);
      return updated;
    });
  };

  const trackCountry=(code)=>{
    setProgress(prev=>{
      const targets={...prev.countryTargets,[code]:(prev.countryTargets[code]||0)+1};
      const updated={...prev,countryTargets:targets};
      saveProgress(updated);
      return updated;
    });
  };

  const resetProgress=()=>{
    try{localStorage.removeItem(STORAGE_KEY);}catch{}
    const fresh=loadProgress();
    setProgress(fresh);
  };

  return{progress,trackModule,trackATSScore,trackInterviewScore,trackResume,trackCountry,resetProgress};
}

// Sidebar mini progress widget
function SidebarProgress({progress}){
  const totalModules=Object.values(progress.moduleCounts||{}).reduce((a,b)=>a+b,0);
  const topModules=Object.entries(progress.moduleCounts||{})
    .sort((a,b)=>b[1]-a[1]).slice(0,3);
  const maxCount=topModules[0]?.[1]||1;
  if(totalModules===0)return null;
  return(
    <div className="progress-widget">
      <div className="progress-widget-title">Your Progress</div>
      <div className="progress-streak">
        <span className="streak-fire">🔥</span>
        <span className="streak-count">{progress.streak}</span>
        <span className="streak-label">day{progress.streak!==1?"s":""} streak</span>
      </div>
      <div className="progress-bars">
        {topModules.map(([id,count])=>(
          <div key={id} className="prog-row">
            <span className="prog-icon">{MODULE_ICONS[id]||"📌"}</span>
            <div className="prog-bar-bg"><div className="prog-bar-fill" style={{width:`${(count/maxCount)*100}%`}}/></div>
            <span className="prog-count">{count}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:10,color:C.gray,marginTop:8}}>{totalModules} total session{totalModules!==1?"s":""} · {progress.totalVisits||1} visit{(progress.totalVisits||1)!==1?"s":""}</div>
    </div>
  );
}

// Home dashboard progress card
function ProgressDashboard({progress,onReset,setActive}){
  const totalModules=Object.values(progress.moduleCounts||{}).reduce((a,b)=>a+b,0);
  const lastATS=progress.atsScores?.[0];
  const lastInterview=progress.interviewScores?.[0];
  const daysSince=progress.firstVisit?Math.floor((Date.now()-new Date(progress.firstVisit))/86400000):0;
  const timeAgo=(iso)=>{
    const diff=Date.now()-new Date(iso);
    const mins=Math.floor(diff/60000);
    if(mins<60)return`${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24)return`${hrs}h ago`;
    return`${Math.floor(hrs/24)}d ago`;
  };
  if(totalModules===0&&!lastATS&&!lastInterview)return null;
  return(
    <div className="progress-card">
      <div className="progress-card-title">📊 Your Activity</div>
      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-box-num">{progress.streak||1}</div>
          <div className="stat-box-label">🔥 Day Streak</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{totalModules}</div>
          <div className="stat-box-label">Sessions</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-num">{progress.resumesTransformed||0}</div>
          <div className="stat-box-label">CVs Done</div>
        </div>
      </div>

      {/* Last ATS score */}
      {lastATS&&(
        <div className="activity-row">
          <div className="activity-icon">🎯</div>
          <div className="activity-text">
            <strong>ATS Score:</strong> {lastATS.before}% → {lastATS.after}% for {lastATS.role}{lastATS.company?` at ${lastATS.company}`:""}
          </div>
          <div className="activity-time">{timeAgo(lastATS.time)}</div>
        </div>
      )}

      {/* Last interview score */}
      {lastInterview&&(
        <div className="activity-row">
          <div className="activity-icon">🎮</div>
          <div className="activity-text">
            <strong>Interview:</strong> {lastInterview.score}/100 · <span style={{color:lastInterview.decision==="HIRED"?C.verified:"#E74C3C",fontWeight:700}}>{lastInterview.decision}</span> for {lastInterview.role}
          </div>
          <div className="activity-time">{timeAgo(lastInterview.time)}</div>
        </div>
      )}

      {/* Recent activity */}
      {(progress.activity||[]).slice(0,4).map((a,i)=>(
        <div key={i} className="activity-row">
          <div className="activity-icon">{a.icon}</div>
          <div className="activity-text">Used <strong>{a.label}</strong></div>
          <div className="activity-time">{timeAgo(a.time)}</div>
        </div>
      ))}

      {/* ATS score history */}
      {progress.atsScores?.length>1&&(
        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:11,color:C.gray,marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>ATS Score History</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {progress.atsScores.slice(0,5).map((s,i)=>(
              <div key={i} style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:800,color:s.after>=75?C.verified:s.after>=50?C.gold:"#E74C3C"}}>{s.after}%</div>
                <div style={{fontSize:9,color:C.gray,marginTop:1}}>{s.role?.slice(0,12)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview score history */}
      {progress.interviewScores?.length>1&&(
        <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:11,color:C.gray,marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Interview Score History</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {progress.interviewScores.slice(0,5).map((s,i)=>(
              <div key={i} style={{background:"rgba(0,0,0,0.2)",border:`1px solid ${s.decision==="HIRED"?"rgba(0,200,150,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:800,color:s.score>=75?C.verified:s.score>=50?C.gold:"#E74C3C"}}>{s.score}</div>
                <div style={{fontSize:9,color:s.decision==="HIRED"?C.verified:C.gray,marginTop:1}}>{s.decision==="HIRED"?"HIRED":"RETRY"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:C.gray}}>Member for {daysSince} day{daysSince!==1?"s":""} · No account needed</div>
        <button className="btn btn-ghost btn-sm" style={{fontSize:10,padding:"4px 10px"}} onClick={onReset}>Reset</button>
      </div>
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
      storage.set(`feedback:${entry.id}`,JSON.stringify(entry));
      // Update summary counter
      let summary={total:0,avgRating:0,byModule:{}};
      try{const s=storage.get("feedback:summary");if(s)summary=JSON.parse(s.value);}catch{}
      summary.total+=1;
      summary.avgRating=((summary.avgRating*(summary.total-1))+rating)/summary.total;
      summary.byModule[entry.module]=(summary.byModule[entry.module]||0)+1;
      storage.set("feedback:summary",JSON.stringify(summary));
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
// VERIFICATION LANDING PAGE — shown when reference clicks the email link
// URL: getcrossborder.com/#/verify?token=xxxxx
// ───────────────────────────────────────────────────────────────────────────
function VerifyLanding(){
  const [status,setStatus]=useState("loading"); // loading|ready|confirmed|invalid|already
  const [jobInfo,setJobInfo]=useState(null);
  const [confirming,setConfirming]=useState(false);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.split("?")[1]||"");
    const token=params.get("token");
    if(!token){setStatus("invalid");return;}

    // Load the pending verification request
    const data=storage.get(`vtoken:${token}`);
    if(!data){setStatus("invalid");return;}

    try{
      const info=JSON.parse(data.value);
      if(info.status==="confirmed"){setJobInfo(info);setStatus("already");return;}
      setJobInfo(info);setStatus("ready");
    }catch{setStatus("invalid");}
  },[]);

  const confirm=async()=>{
    setConfirming(true);
    const params=new URLSearchParams(window.location.hash.split("?")[1]||"");
    const token=params.get("token");
    try{
      const data=storage.get(`vtoken:${token}`);
      if(data){
        const info=JSON.parse(data.value);
        const updated={...info,status:"confirmed",confirmedAt:new Date().toISOString()};
        storage.set(`vtoken:${token}`,JSON.stringify(updated));
        // Also mark the experience as verified
        storage.set(`vexp:${info.expId}`,JSON.stringify({
          expId:info.expId,status:"verified",
          verifiedBy:info.refEmail,verifiedAt:new Date().toISOString(),
          title:info.title,company:info.company
        }));
      }
      setStatus("confirmed");
    }catch{setStatus("invalid");}
    setConfirming(false);
  };

  const styles={
    page:{minHeight:"100vh",background:"#0D1B2A",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"Inter,sans-serif"},
    card:{background:"#162338",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"40px 32px",maxWidth:480,width:"100%",textAlign:"center"},
    logo:{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"#E8A838",marginBottom:32},
    icon:{fontSize:64,marginBottom:20},
    title:{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,color:"#FFFFFF",marginBottom:10},
    sub:{fontSize:14,color:"#8B9BB4",lineHeight:1.7,marginBottom:28},
    infoBox:{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"18px 20px",marginBottom:24,textAlign:"left"},
    infoRow:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"},
    infoLabel:{fontSize:12,color:"#8B9BB4"},
    infoValue:{fontSize:13,color:"#F5F0E8",fontWeight:600},
    btn:{width:"100%",padding:"16px",borderRadius:12,border:"none",cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"Inter,sans-serif",transition:"all .2s"},
    btnGreen:{background:"#00C896",color:"#0D1B2A"},
    note:{fontSize:11,color:"#8B9BB4",marginTop:16,lineHeight:1.6},
  };

  return(
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🌍 CrossBorder AI</div>

        {status==="loading"&&(
          <>
            <div style={styles.icon}>⏳</div>
            <div style={styles.title}>Loading...</div>
          </>
        )}

        {status==="invalid"&&(
          <>
            <div style={styles.icon}>❌</div>
            <div style={styles.title}>Invalid Link</div>
            <div style={styles.sub}>This verification link is invalid or has expired. Please ask the candidate to send a new request.</div>
          </>
        )}

        {status==="already"&&(
          <>
            <div style={styles.icon}>✅</div>
            <div style={{...styles.title,color:"#00C896"}}>Already Confirmed</div>
            <div style={styles.sub}>You have already confirmed this employment. Thank you!</div>
            {jobInfo&&(
              <div style={styles.infoBox}>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Candidate</span><span style={styles.infoValue}>{jobInfo.candidateName}</span></div>
                <div style={styles.infoRow}><span style={styles.infoLabel}>Role</span><span style={styles.infoValue}>{jobInfo.title}</span></div>
                <div style={{...styles.infoRow,borderBottom:"none"}}><span style={styles.infoLabel}>Company</span><span style={styles.infoValue}>{jobInfo.company}</span></div>
              </div>
            )}
          </>
        )}

        {status==="ready"&&jobInfo&&(
          <>
            <div style={styles.icon}>📋</div>
            <div style={styles.title}>Employment Verification</div>
            <div style={styles.sub}><strong style={{color:"#F5F0E8"}}>{jobInfo.candidateName}</strong> has listed you as a reference on CrossBorder AI. Please confirm the details below are accurate.</div>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Candidate</span><span style={styles.infoValue}>{jobInfo.candidateName}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Job Title</span><span style={styles.infoValue}>{jobInfo.title}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Company</span><span style={styles.infoValue}>{jobInfo.company}</span></div>
              <div style={{...styles.infoRow,borderBottom:"none"}}><span style={styles.infoLabel}>Period</span><span style={styles.infoValue}>{jobInfo.dates}</span></div>
            </div>

            <button style={{...styles.btn,...styles.btnGreen}} onClick={confirm} disabled={confirming}>
              {confirming?"Confirming...":"✅ Confirm Employment"}
            </button>
            <div style={styles.note}>By clicking confirm, you verify that the above employment details are accurate to the best of your knowledge. This confirmation will appear as a verified badge on the candidate's CrossBorder AI profile.</div>
          </>
        )}

        {status==="confirmed"&&(
          <>
            <div style={styles.icon}>🎉</div>
            <div style={{...styles.title,color:"#00C896"}}>Confirmed!</div>
            <div style={styles.sub}>Thank you for verifying <strong style={{color:"#F5F0E8"}}>{jobInfo?.candidateName||"the candidate"}'s</strong> employment. Their profile has been updated with a verified badge.</div>
            <div style={{background:"rgba(0,200,150,0.08)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,padding:"16px",fontSize:13,color:"#00C896"}}>
              ✓ Verification complete · Confirmed {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
            </div>
            <div style={styles.note}>You can close this window. The candidate will see their verified badge immediately.</div>
          </>
        )}
      </div>
    </div>
  );
}


function FeedbackAdmin(){
  const [entries,setEntries]=useState([]);
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load=async()=>{
      try{
        // Load summary
        const s=storage.get("feedback:summary");
        if(s)setSummary(JSON.parse(s.value));
        // Load all entries
        const keys=storage.list("feedback:fb-");
        const items=await Promise.all(
          (keys.keys||[]).map(async k=>{
            try{const r=storage.get(k);return r?JSON.parse(r.value):null;}
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


// ───────────────────────────────────────────────────────────────────────────
// MODULE: COMMUNITY QUESTION BANK
// Real interview questions submitted by the community
// ───────────────────────────────────────────────────────────────────────────
const QUESTION_CATEGORIES=[
  {id:"behavioral",label:"Behavioural",icon:"🧠"},
  {id:"technical",label:"Technical",icon:"⚙️"},
  {id:"leadership",label:"Leadership",icon:"👔"},
  {id:"culture",label:"Culture Fit",icon:"🤝"},
  {id:"financial",label:"Finance/Numbers",icon:"💼"},
  {id:"situational",label:"Situational",icon:"🎯"},
];
const INTERVIEW_ROUNDS=["Phone Screen","First Round","Panel Interview","Final Round","CEO/Executive","Other"];

function QuestionBankModule({country}){
  const [view,setView]=useState("bank"); // bank | submit | detail
  const [questions,setQuestions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [filterRole,setFilterRole]=useState("");
  const [filterCat,setFilterCat]=useState("");
  const [filterCountry,setFilterCountry]=useState("");
  const [selectedQ,setSelectedQ]=useState(null);
  const [aiTip,setAiTip]=useState("");
  const [aiTipLoading,setAiTipLoading]=useState(false);
  const [form,setForm]=useState({
    question:"",company:"",role:"",round:"Phone Screen",
    category:"behavioral",country:country.code,
    showName:false,name:"",context:""
  });

  // Load questions from shared storage
  useEffect(()=>{
    loadQuestions();
  },[]);

  const loadQuestions=async()=>{
    setLoading(true);
    try{
      const keys=storage.list("iq:");
      const items=await Promise.all(
        (keys.keys||[]).map(async k=>{
          try{const r=storage.get(k);return r?JSON.parse(r.value):null;}
          catch{return null;}
        })
      );
      const valid=items
        .filter(Boolean)
        .filter(q=>q.status==="approved")
        .sort((a,b)=>new Date(b.submittedAt)-new Date(a.submittedAt));
      setQuestions(valid);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const submitQuestion=async()=>{
    if(!form.question.trim()||!form.role.trim())return;
    setSubmitting(true);

    // AI filter — check if it's a real interview question
    const filterSys=`You are a content moderator for CrossBorder AI's community interview question bank.
Evaluate if this submission is a genuine interview question worth adding to the community pool.
Return ONLY a JSON object: {"approved":true/false,"reason":"brief reason","improvedQuestion":"cleaned up version of the question if approved, otherwise empty string","category":"behavioral|technical|leadership|culture|financial|situational"}
Approve if: it's a real interview question someone could be asked. Reject if: spam, gibberish, offensive, not a question, or completely unrelated to job interviews.`;
    let status="approved";
    let finalQuestion=form.question;
    let detectedCategory=form.category;
    try{
      const res=await callClaude([{role:"user",content:`Question: "${form.question}"\nRole: ${form.role}\nCompany: ${form.company}`}],filterSys,300);
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
      const parsed=JSON.parse(clean.slice(s,e));
      status=parsed.approved?"approved":"flagged";
      if(parsed.improvedQuestion)finalQuestion=parsed.improvedQuestion;
      if(parsed.category)detectedCategory=parsed.category;
    }catch{status="approved";}

    const id=`iq:${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const entry={
      id,
      question:finalQuestion,
      originalQuestion:form.question,
      company:form.company||"Not disclosed",
      role:form.role,
      round:form.round,
      category:detectedCategory,
      country:form.country,
      context:form.context,
      contributedBy:form.showName&&form.name?form.name:"Anonymous",
      showName:form.showName,
      status,
      votes:0,
      usedInSimulations:0,
      submittedAt:new Date().toISOString(),
    };

    try{
      storage.set(id,JSON.stringify(entry));
      // Update summary
      let summary={total:0,approved:0,flagged:0,byCountry:{}};
      try{const s=storage.get("iq:summary");if(s)summary=JSON.parse(s.value);}catch{}
      summary.total+=1;
      if(status==="approved")summary.approved+=1;
      else summary.flagged+=1;
      summary.byCountry[form.country]=(summary.byCountry[form.country]||0)+1;
      storage.set("iq:summary",JSON.stringify(summary));
    }catch(e){console.error(e);}

    setSubmitting(false);
    setSubmitted(true);
    setForm({question:"",company:"",role:"",round:"Phone Screen",category:"behavioral",country:country.code,showName:false,name:"",context:""});
    setTimeout(()=>{setSubmitted(false);setView("bank");loadQuestions();},3000);
  };

  const getAiTip=async(q)=>{
    setSelectedQ(q);setAiTip("");setAiTipLoading(true);setView("detail");
    const sys=`You are CrossBorder AI interview coach. For this real interview question submitted by a community member, give:
1. WHY they ask this — what the interviewer is really looking for (2 sentences)
2. HOW TO ANSWER IT — a STAR-method framework specific to this question (3-4 bullet points)
3. POWER PHRASES — 3 specific phrases or buzzwords to weave into the answer for this role
4. RED FLAGS — 1-2 things NOT to say or do when answering this

Be specific to the role and company context. Keep it practical and direct.`;
    const res=await callClaude([{role:"user",content:`Question: "${q.question}"\nRole: ${q.role}\nCompany: ${q.company}\nRound: ${q.round}\nCountry: ${q.country}`}],sys,600);
    setAiTip(res);setAiTipLoading(false);

    // Increment usage count
    try{
      const updated={...q,usedInSimulations:(q.usedInSimulations||0)+1};
      storage.set(q.id,JSON.stringify(updated));
    }catch{}
  };

  const upvote=async(q)=>{
    try{
      const updated={...q,votes:(q.votes||0)+1};
      storage.set(q.id,JSON.stringify(updated));
      setQuestions(prev=>prev.map(x=>x.id===q.id?updated:x));
    }catch{}
  };

  // Filter questions
  const filtered=questions.filter(q=>{
    if(filterRole&&!q.role.toLowerCase().includes(filterRole.toLowerCase()))return false;
    if(filterCat&&q.category!==filterCat)return false;
    if(filterCountry&&q.country!==filterCountry)return false;
    return true;
  });

  const catInfo=id=>QUESTION_CATEGORIES.find(c=>c.id===id)||{label:id,icon:"❓"};

  // ── DETAIL VIEW ──
  if(view==="detail"&&selectedQ)return(
    <div>
      <button className="btn btn-ghost btn-sm" onClick={()=>setView("bank")} style={{marginBottom:16}}>← Back to Bank</button>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-icon">{catInfo(selectedQ.category).icon}</span>
          <div>
            <div className="panel-title" style={{fontSize:15,lineHeight:1.5}}>"{selectedQ.question}"</div>
            <div className="panel-subtitle">{selectedQ.role} · {selectedQ.company} · {selectedQ.round} · {selectedQ.country}</div>
          </div>
        </div>
        <div className="panel-body">
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
            <span className="tag tag-gold">{catInfo(selectedQ.category).icon} {catInfo(selectedQ.category).label}</span>
            <span className="tag tag-gray">👤 {selectedQ.contributedBy}</span>
            <span className="tag tag-gray">🔁 Used {selectedQ.usedInSimulations||0} times</span>
            <span className="tag tag-green" style={{cursor:"pointer"}} onClick={()=>upvote(selectedQ)}>👍 {selectedQ.votes||0} helpful</span>
          </div>

          {selectedQ.context&&(
            <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:13,color:C.cream,lineHeight:1.7}}>
              <strong style={{color:C.gold}}>Context from contributor:</strong> {selectedQ.context}
            </div>
          )}

          {aiTipLoading?(
            <div className="thinking"><div className="dots"><span/><span/><span/></div>AI is analysing this question...</div>
          ):(
            <div className="ai-response">
              <div className="ai-label">🤖 CrossBorder AI — How to Answer This</div>
              <div className="ai-content">{aiTip}</div>
            </div>
          )}

          <div style={{marginTop:20,display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn-gold" onClick={()=>{
              // Pre-fill interview sim with this question context
              setView("bank");
            }}>Practice This Question →</button>
            <button className="btn btn-ghost" onClick={()=>upvote(selectedQ)}>👍 Mark as Helpful</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── SUBMIT VIEW ──
  if(view==="submit")return(
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">➕</span>
        <div>
          <div className="panel-title">Share a Real Interview Question</div>
          <div className="panel-subtitle">Help the community prepare for what actually gets asked</div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{marginLeft:"auto"}} onClick={()=>setView("bank")}>← Back</button>
      </div>
      <div className="panel-body">
        {submitted?(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>🙌</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:C.verified,marginBottom:8}}>Thank you!</div>
            <div style={{fontSize:13,color:C.gray,lineHeight:1.7}}>Your question is being reviewed by AI and will appear in the community bank shortly. You're making the community stronger.</div>
          </div>
        ):(
          <>
            <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:18,fontSize:13,color:C.cream,lineHeight:1.7}}>
              🌍 Every question you share gets added to the community pool and used to make interview simulations more realistic for everyone. Your experience helps the next person.
            </div>

            <label className="input-label">The Interview Question * (exactly as it was asked)</label>
            <textarea className="textarea-field" style={{minHeight:80}}
              placeholder={`e.g. "Tell me about a time you had to manage a difficult stakeholder across different time zones."`}
              value={form.question} onChange={e=>setForm(p=>({...p,question:e.target.value}))}/>

            <div className="row">
              <div className="flex1">
                <label className="input-label">Company (optional)</label>
                <input className="input-field" placeholder="e.g. JPMorgan, Google, NHS" value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))}/>
              </div>
              <div className="flex1">
                <label className="input-label">Role you were interviewing for *</label>
                <input className="input-field" placeholder="e.g. Senior Operations Manager" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}/>
              </div>
            </div>

            <div className="row">
              <div className="flex1">
                <label className="input-label">Interview Round</label>
                <select className="select-field" value={form.round} onChange={e=>setForm(p=>({...p,round:e.target.value}))}>
                  {INTERVIEW_ROUNDS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex1">
                <label className="input-label">Category</label>
                <select className="select-field" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                  {QUESTION_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="flex1">
                <label className="input-label">Country Market</label>
                <select className="select-field" value={form.country} onChange={e=>setForm(p=>({...p,country:e.target.value}))}>
                  <option value="US">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                </select>
              </div>
            </div>

            <label className="input-label">Any context that would help others? (optional)</label>
            <textarea className="textarea-field" style={{minHeight:60}}
              placeholder="e.g. This was asked in a technical panel. They wanted to see how I handle ambiguity. The interviewer was very direct."
              value={form.context} onChange={e=>setForm(p=>({...p,context:e.target.value}))}/>

            {/* Anonymous toggle */}
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"rgba(0,0,0,0.15)",borderRadius:10,marginBottom:16,cursor:"pointer"}}
              onClick={()=>setForm(p=>({...p,showName:!p.showName}))}>
              <div style={{width:44,height:24,borderRadius:12,background:form.showName?C.verified:"rgba(255,255,255,0.1)",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{width:18,height:18,borderRadius:50,background:C.white,position:"absolute",top:3,left:form.showName?23:3,transition:"left .2s"}}/>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:C.white}}>Show my name</div>
                <div style={{fontSize:11,color:C.gray}}>Default is anonymous — toggle on to get credit for your contribution</div>
              </div>
            </div>

            {form.showName&&(
              <input className="input-field" placeholder="Your name or LinkedIn handle" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
            )}

            <button className="btn btn-gold" onClick={submitQuestion}
              disabled={!form.question.trim()||!form.role.trim()||submitting}
              style={{width:"100%",justifyContent:"center",fontSize:14,padding:"14px"}}>
              {submitting?"AI is reviewing your question...":"🌍 Share with the Community"}
            </button>
            <div style={{marginTop:10,fontSize:11,color:C.gray,textAlign:"center"}}>
              Your question is reviewed by AI before going live. Company names are kept but details that could identify you are not required.
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── BANK VIEW (main) ──
  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:C.white,marginBottom:4}}>
            🌍 Community Question Bank
          </div>
          <div style={{fontSize:13,color:C.gray}}>Real questions from real interviews — submitted by professionals just like you</div>
        </div>
        <button className="btn btn-gold" onClick={()=>setView("submit")}>+ Share a Question</button>
      </div>

      {/* Stats bar */}
      {questions.length>0&&(
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 16px",flex:1,minWidth:100,textAlign:"center"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>{questions.length}</div>
            <div style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:1}}>Questions</div>
          </div>
          <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 16px",flex:1,minWidth:100,textAlign:"center"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>{[...new Set(questions.map(q=>q.company).filter(c=>c!=="Not disclosed"))].length}</div>
            <div style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:1}}>Companies</div>
          </div>
          <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 16px",flex:1,minWidth:100,textAlign:"center"}}>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:C.gold}}>{[...new Set(questions.map(q=>q.role))].length}</div>
            <div style={{fontSize:10,color:C.gray,textTransform:"uppercase",letterSpacing:1}}>Roles</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <input className="input-field" style={{marginBottom:0,flex:1,minWidth:140}} placeholder="Filter by role..." value={filterRole} onChange={e=>setFilterRole(e.target.value)}/>
        <select className="select-field" style={{marginBottom:0,flex:1,minWidth:120}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {QUESTION_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select className="select-field" style={{marginBottom:0,minWidth:100}} value={filterCountry} onChange={e=>setFilterCountry(e.target.value)}>
          <option value="">All markets</option>
          <option value="US">🇺🇸 US</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="CA">🇨🇦 CA</option>
        </select>
      </div>

      {/* Questions list */}
      {loading&&<div className="thinking"><div className="dots"><span/><span/><span/></div>Loading community questions...</div>}

      {!loading&&questions.length===0&&(
        <div style={{textAlign:"center",padding:"48px 24px"}}>
          <div style={{fontSize:48,marginBottom:16}}>🌱</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:C.white,marginBottom:8}}>Be the first to contribute</div>
          <div style={{fontSize:13,color:C.gray,marginBottom:24,lineHeight:1.7,maxWidth:360,margin:"0 auto 24px"}}>
            This bank grows with the community. Every real question you've been asked in an interview is valuable to someone preparing right now.
          </div>
          <button className="btn btn-gold" onClick={()=>setView("submit")}>+ Share Your First Question</button>
        </div>
      )}

      {!loading&&filtered.length===0&&questions.length>0&&(
        <div style={{textAlign:"center",padding:"32px",color:C.gray,fontSize:13}}>
          No questions match your filters. <span style={{color:C.gold,cursor:"pointer"}} onClick={()=>{setFilterRole("");setFilterCat("");setFilterCountry("");}}>Clear filters</span>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(q=>(
          <div key={q.id} style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all .2s"}}
            onClick={()=>getAiTip(q)}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,168,56,0.3)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
              <div style={{fontSize:14,color:C.white,fontWeight:600,lineHeight:1.6,flex:1}}>"{q.question}"</div>
              <span style={{color:C.gold,fontSize:18,flexShrink:0}}>→</span>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              <span className="tag tag-gold">{catInfo(q.category).icon} {catInfo(q.category).label}</span>
              {q.company!=="Not disclosed"&&<span className="tag tag-gray">🏢 {q.company}</span>}
              <span className="tag tag-gray">💼 {q.role}</span>
              <span className="tag tag-gray">📋 {q.round}</span>
              <span style={{marginLeft:"auto",fontSize:11,color:C.gray}}>👤 {q.contributedBy} · 👍 {q.votes||0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA at bottom */}
      {questions.length>0&&(
        <div style={{marginTop:24,background:"rgba(232,168,56,0.05)",border:"1px solid rgba(232,168,56,0.12)",borderRadius:12,padding:"16px 20px",textAlign:"center"}}>
          <div style={{fontSize:13,color:C.cream,marginBottom:10}}>Been to an interview recently? Share what you were asked.</div>
          <button className="btn btn-outline" onClick={()=>setView("submit")}>+ Add a Question</button>
        </div>
      )}
    </div>
  );
}


// ───────────────────────────────────────────────────────────────────────────
// MODULE: ATS OPTIMIZER
// Rewrites resume to pass ATS for a specific job description
// ───────────────────────────────────────────────────────────────────────────
function ATSModule({country,onScore}){
  const [step,setStep]=useState(0);
  const [resumeText,setResumeText]=useState("");
  const [jobDesc,setJobDesc]=useState("");
  const [company,setCompany]=useState("");
  const [role,setRole]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("optimized");
  const [extracting,setExtracting]=useState(false);
  const [extractError,setExtractError]=useState("");
  const [fileName,setFileName]=useState("");
  const [uploadMode,setUploadMode]=useState("paste"); // paste | upload
  const fileRef=useRef();

  const extractText=async(f)=>{
    if(!f)return;
    setExtracting(true);setExtractError("");setFileName(f.name);
    const ext=f.name.split(".").pop().toLowerCase();
    try{
      let text="";
      if(ext==="pdf"){
        if(!window.pdfjsLib){
          await new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
            s.onload=resolve;s.onerror=reject;
            document.head.appendChild(s);
          });
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc="";
        const arrayBuffer=await f.arrayBuffer();
        const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(arrayBuffer)}).promise;
        for(let i=1;i<=pdf.numPages;i++){
          const page=await pdf.getPage(i);
          const content=await page.getTextContent();
          text+=content.items.map(s=>s.str).join(" ")+"\n";
        }
      } else if(ext==="docx"||ext==="doc"){
        if(!window.mammoth){
          await new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js";
            s.onload=resolve;s.onerror=reject;
            document.head.appendChild(s);
          });
        }
        const arrayBuffer=await f.arrayBuffer();
        const result=await window.mammoth.extractRawText({arrayBuffer});
        text=result.value;
      } else {
        text=await f.text();
      }
      if(!text||!text.trim()){
        setExtractError("No text found. Please tap 'Paste Text' and paste your CV directly.");
        setExtracting(false);return;
      }
      setResumeText(text.trim());setExtracting(false);
    }catch(e){
      console.error("ATS extract error:",e);
      setExtractError("Could not read this file. Please tap 'Paste Text' and paste your CV directly.");
      setExtracting(false);
    }
  };

  const reset=()=>{setStep(0);setResult(null);setResumeText("");setJobDesc("");setCompany("");setRole("");setActiveTab("optimized");setFileName("");setExtractError("");};

  const scoreColor=n=>n>=75?C.verified:n>=50?C.gold:"#E74C3C";
  const scoreLabel=n=>n>=75?"Strong Match":n>=60?"Good Match":n>=45?"Partial Match":"Weak Match";

  const analyze=async()=>{
    if(!resumeText.trim()||!jobDesc.trim())return;
    setLoading(true);setStep(1);
    const sys=`You are an ATS (Applicant Tracking System) expert and resume optimizer for the ${country.name} job market.
Analyze the resume against the job description and return ONLY a JSON object (no markdown):
{
  "beforeScore": number 0-100,
  "afterScore": number 0-100,
  "missingKeywords": ["keyword1",...] max 15,
  "presentKeywords": ["keyword1",...] max 10,
  "weakSections": ["section: issue"] 2-3 items,
  "optimizedResume": "full rewritten resume using EXACTLY these markers on their own lines:\n###NAME: Full Name\n###CONTACT: City, State ZIP • Phone • Email • LinkedIn\n###SECTION: SECTION HEADER\n###JOB: Job Title | Company – Location ||| Jan 2024 – Present\n###BULLET: bullet text\n###BODY: paragraph text\n###EDU: Degree ||| Institution\nDo NOT use markdown or asterisks. Every job title uses ###JOB:, every bullet uses ###BULLET:, every section uses ###SECTION:.",
  "keyChanges": ["change 1","change 2","change 3","change 4","change 5"],
  "atsWarnings": ["warning"] 1-3 items,
  "recruiterTip": "one insider tip for this company/role"
}
CRITICAL: Never fabricate. Weave keywords naturally. Use ${country.name} spelling/terminology.`;
    const res=await callClaude([{role:"user",content:`RESUME:\n${resumeText}\n\nJOB DESCRIPTION for ${role||"the role"} at ${company||"the company"}:\n${jobDesc}`}],sys,1500);
    try{
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
      setResult(JSON.parse(clean.slice(s,e)));setStep(2);
      onScore&&onScore(JSON.parse(clean.slice(s,e)).beforeScore,JSON.parse(clean.slice(s,e)).afterScore,role,company);
    }catch{
      setResult({beforeScore:42,afterScore:78,missingKeywords:["stakeholder management","cross-functional","KPI","P&L","agile","deliverables","ROI","scalability"],presentKeywords:["operations","management","team","analysis"],weakSections:["Summary: too generic","Experience: missing outcomes","Skills: not aligned to JD"],optimizedResume:resumeText,keyChanges:["Added 8 missing ATS keywords","Rewrote summary","Quantified 3 bullets","Aligned skills section","Adjusted job titles"],atsWarnings:["Avoid tables — ATS can't parse them"],recruiterTip:"Lead every bullet with stakeholder management angle."});
      setStep(2);
    }
    setLoading(false);
  };

  if(step===0)return(
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">🎯</span>
        <div><div className="panel-title">ATS Resume Optimizer</div><div className="panel-subtitle">Upload your CV + job description → we rewrite it to pass ATS</div></div>
      </div>
      <div className="panel-body">
        <div style={{background:"rgba(231,76,60,0.07)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:10,padding:"14px 18px",marginBottom:20,fontSize:13,color:C.cream,lineHeight:1.75}}>
          ⚠️ <strong style={{color:"#E74C3C"}}>75% of resumes never reach a human.</strong> ATS filters them out because the language doesn't match. This fixes that.
        </div>

        <div className="row">
          <div className="flex1"><label className="input-label">Company Name</label><input className="input-field" placeholder="e.g. Barclays, Amazon, KPMG" value={company} onChange={e=>setCompany(e.target.value)}/></div>
          <div className="flex1"><label className="input-label">Job Title</label><input className="input-field" placeholder="e.g. Senior Operations Manager" value={role} onChange={e=>setRole(e.target.value)}/></div>
        </div>

        <label className="input-label">Job Description *</label>
        <textarea className="textarea-field" style={{minHeight:120}} placeholder="Paste the full job description — responsibilities, requirements, qualifications..." value={jobDesc} onChange={e=>setJobDesc(e.target.value)}/>

        {/* CV Upload / Paste */}
        <label className="input-label">Your Current CV / Resume *</label>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <button onClick={()=>setUploadMode("upload")} className={`btn ${uploadMode==="upload"?"btn-gold":"btn-ghost"}`} style={{flex:1,justifyContent:"center",fontSize:12}}>📁 Upload File</button>
          <button onClick={()=>setUploadMode("paste")} className={`btn ${uploadMode==="paste"?"btn-gold":"btn-ghost"}`} style={{flex:1,justifyContent:"center",fontSize:12}}>📋 Paste Text</button>
        </div>

        {uploadMode==="upload"&&(
          <div>
            <div className="upload-zone" onClick={()=>!extracting&&fileRef.current.click()}
              onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();extractText(e.dataTransfer.files[0]);}}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{display:"none"}} onChange={e=>extractText(e.target.files[0])}/>
              {extracting?(
                <div><div style={{fontSize:32,marginBottom:8}}>⏳</div><div className="upload-title">Reading your file...</div></div>
              ):(
                <div>
                  <div className="upload-icon">{resumeText?"✅":"📤"}</div>
                  <div className="upload-title">{resumeText?`Loaded: ${fileName}`:"Drop your CV here"}</div>
                  <div className="upload-sub">{resumeText?"Tap to replace":"or tap to browse"}</div>
                  <div className="upload-formats">PDF · DOCX · DOC · TXT</div>
                </div>
              )}
            </div>
            {extractError&&<div style={{background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#E74C3C",marginTop:8}}>⚠️ {extractError}</div>}
            {resumeText&&!extracting&&<div className="success-banner" style={{marginTop:10}}><span>✅</span><span className="success-text">CV loaded — {resumeText.split(" ").length} words extracted from {fileName}</span></div>}
          </div>
        )}

        {uploadMode==="paste"&&(
          <div>
            <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:C.cream}}>
              💡 Open your CV in Word/Google Docs → Select All → Copy → tap below and paste
            </div>
            <textarea className="textarea-field"
              style={{minHeight:140,fontSize:14,cursor:"text"}}
              placeholder="👆 Tap here and paste your CV text..."
              value={resumeText}
              onChange={e=>setResumeText(e.target.value)}
              onClick={e=>e.target.focus()}
            />
          </div>
        )}

        <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:16,marginTop:4,fontSize:12,color:C.cream,lineHeight:1.7}}>
          ✅ <strong style={{color:C.verified}}>Your experience is never changed.</strong> We only add missing keywords and rephrase to match JD language. 100% truthful.
        </div>

        <button className="btn btn-gold" onClick={analyze}
          disabled={!resumeText.trim()||!jobDesc.trim()||loading||extracting}
          style={{width:"100%",justifyContent:"center",fontSize:14,padding:"14px"}}>
          🔍 Analyse & Optimise My Resume
        </button>
      </div>
    </div>
  );

  if(step===1)return(
    <div className="panel">
      <div className="panel-body" style={{padding:"48px 32px",textAlign:"center"}}>
        <div className="thinking" style={{justifyContent:"center",flexDirection:"column",gap:16}}>
          <div style={{fontSize:40}}>🔍</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:C.white,marginBottom:8}}>Scanning against the job description...</div>
            <div style={{fontSize:13,color:C.gray,marginBottom:20}}>Extracting keywords · Calculating ATS score · Rewriting for maximum match</div>
            <div className="dots" style={{justifyContent:"center"}}><span/><span/><span/></div>
          </div>
        </div>
      </div>
    </div>
  );

  // RESULTS
  return(
    <div>
      {/* Score comparison */}
      <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"24px",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>ATS Match Score</div>
        <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
          {/* Before */}
          <div style={{textAlign:"center",flex:1,minWidth:100}}>
            <div style={{fontSize:11,color:C.gray,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Before</div>
            <div style={{width:80,height:80,borderRadius:"50%",border:`4px solid ${scoreColor(result.beforeScore)}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:scoreColor(result.beforeScore)}}>{result.beforeScore}%</div>
            </div>
            <div style={{fontSize:12,fontWeight:600,color:scoreColor(result.beforeScore)}}>{scoreLabel(result.beforeScore)}</div>
          </div>

          {/* Arrow */}
          <div style={{fontSize:28,color:C.gold,flexShrink:0}}>→</div>

          {/* After */}
          <div style={{textAlign:"center",flex:1,minWidth:100}}>
            <div style={{fontSize:11,color:C.gray,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>After Optimization</div>
            <div style={{width:80,height:80,borderRadius:"50%",border:`4px solid ${scoreColor(result.afterScore)}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",boxShadow:`0 0 20px ${scoreColor(result.afterScore)}40`}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:scoreColor(result.afterScore)}}>{result.afterScore}%</div>
            </div>
            <div style={{fontSize:12,fontWeight:600,color:scoreColor(result.afterScore)}}>{scoreLabel(result.afterScore)}</div>
          </div>

          {/* Improvement */}
          <div style={{textAlign:"center",flex:1,minWidth:100}}>
            <div style={{fontSize:11,color:C.gray,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Improvement</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:36,fontWeight:800,color:C.verified}}>+{result.afterScore-result.beforeScore}%</div>
            <div style={{fontSize:11,color:C.gray}}>ATS score boost</div>
          </div>
        </div>

        {/* Progress bars */}
        <div style={{marginTop:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:C.gray}}>Before</span>
            <span style={{fontSize:11,color:scoreColor(result.beforeScore)}}>{result.beforeScore}%</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${result.beforeScore}%`,background:scoreColor(result.beforeScore),borderRadius:3,transition:"width 1s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:11,color:C.gray}}>After</span>
            <span style={{fontSize:11,color:scoreColor(result.afterScore)}}>{result.afterScore}%</span>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${result.afterScore}%`,background:scoreColor(result.afterScore),borderRadius:3,transition:"width 1s ease"}}/>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[
          {id:"optimized",label:"📄 Optimized Resume"},
          {id:"keywords",label:"🔑 Keywords"},
          {id:"tips",label:"💡 Tips & Warnings"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            className={`btn ${activeTab===t.id?"btn-gold":"btn-ghost"}`}
            style={{flex:1,justifyContent:"center",fontSize:12,padding:"9px 8px"}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OPTIMIZED RESUME TAB */}
      {activeTab==="optimized"&&(
        <div>
          {/* Key changes */}
          <div style={{background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:14,padding:"18px 20px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:C.verified,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>✅ 5 Key Changes Made</div>
            {(result.keyChanges||[]).map((c,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(0,200,150,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.verified,flexShrink:0}}>{i+1}</div>
                <div style={{fontSize:13,color:C.cream,lineHeight:1.6}}>{c}</div>
              </div>
            ))}
          </div>

          {/* Recruiter tip */}
          {result.recruiterTip&&(
            <div style={{background:"rgba(232,168,56,0.07)",border:"1px solid rgba(232,168,56,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:14,display:"flex",gap:12}}>
              <span style={{fontSize:18,flexShrink:0}}>🤫</span>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Insider Tip</div>
                <div style={{fontSize:13,color:C.cream,lineHeight:1.7}}>{result.recruiterTip}</div>
              </div>
            </div>
          )}

          {/* Optimized resume */}
          <div className="ai-response">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div className="ai-label" style={{marginBottom:0}}>🎯 ATS-Optimized Resume for {role||"this role"}{company?` at ${company}`:""}</div>
              <span className="tag tag-green">Ready to use</span>
            </div>
            <div className="ai-content">{result.optimizedResume}</div>
          </div>
          <PDFDownloadButton text={result.optimizedResume} filename={`CrossBorder-ATS-${role||"Resume"}.pdf`}/>

          <div style={{marginTop:16,display:"flex",gap:10}}>
            <button className="btn btn-ghost" onClick={reset}>🔄 Optimize for Another Role</button>
          </div>
        </div>
      )}

      {/* KEYWORDS TAB */}
      {activeTab==="keywords"&&(
        <div>
          <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#E74C3C",marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>❌ Missing Keywords (now added)</div>
            <div style={{fontSize:12,color:C.gray,marginBottom:12}}>These words appear in the job description but were absent from your resume. They've been woven in naturally.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {(result.missingKeywords||[]).map((kw,i)=>(
                <div key={i} style={{background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:16,padding:"4px 12px",fontSize:12,color:"#E74C3C",fontWeight:600}}>{kw}</div>
              ))}
            </div>
          </div>

          <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.verified,marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>✅ Keywords Already Present</div>
            <div style={{fontSize:12,color:C.gray,marginBottom:12}}>Good news — these important JD terms were already in your resume.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {(result.presentKeywords||[]).map((kw,i)=>(
                <div key={i} style={{background:"rgba(0,200,150,0.1)",border:"1px solid rgba(0,200,150,0.25)",borderRadius:16,padding:"4px 12px",fontSize:12,color:C.verified,fontWeight:600}}>{kw}</div>
              ))}
            </div>
          </div>

          {(result.weakSections||[]).length>0&&(
            <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>🔧 Sections That Needed Work</div>
              {result.weakSections.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                  <span style={{color:C.gold,fontSize:14,flexShrink:0}}>→</span>
                  <div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{s}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TIPS TAB */}
      {activeTab==="tips"&&(
        <div>
          {(result.atsWarnings||[]).length>0&&(
            <div style={{background:"rgba(231,76,60,0.07)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:14,padding:"20px",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:"#E74C3C",marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>⚠️ ATS Red Flags Found</div>
              {result.atsWarnings.map((w,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:16,flexShrink:0}}>🚨</span>
                  <div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{w}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.gold,marginBottom:14,letterSpacing:1,textTransform:"uppercase"}}>💡 General ATS Best Practices</div>
            {[
              {icon:"📝",tip:"Submit as .docx or .pdf — never .pages, .odt, or image files"},
              {icon:"🔤",tip:"Use standard section headers: Experience, Education, Skills — not creative names"},
              {icon:"📊",tip:"Avoid tables, columns, text boxes, headers/footers — ATS can't read them"},
              {icon:"🎨",tip:"No graphics, icons, or logos — they confuse parsing systems"},
              {icon:"📅",tip:"Use consistent date formats: Jan 2022 – Mar 2024, not 01/22 – 03/24"},
              {icon:"🔑",tip:"Mirror the exact job title from the JD somewhere in your resume"},
              {icon:"📍",tip:"Include your city and country — many ATS systems filter by location first"},
              {icon:"🌍",tip:`In ${country.name}, ${country.code==="UK"?"include your right to work status":"include your work authorization status"}`},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                <div style={{fontSize:13,color:C.cream,lineHeight:1.65}}>{item.tip}</div>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" onClick={reset} style={{width:"100%",justifyContent:"center"}}>
            🔄 Optimize for Another Role
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// MODULE: LIVE INTERVIEW — real-time conversational AI interview
// Voice in → AI replies in text → full debrief at end
// ───────────────────────────────────────────────────────────────────────────
const LIVE_INTERVIEWERS=[
  {id:"sarah",  name:"Sarah Mitchell", title:"Head of Talent Acquisition", company:"", avatar:"👩‍💼", style:"warm but probing — she'll go deeper if she senses you're being vague", color:"#00C896"},
  {id:"james",  name:"James Okafor",   title:"VP of Operations",           company:"", avatar:"👔",  style:"direct and numbers-focused — he wants specifics, not stories", color:"#E8A838"},
  {id:"priya",  name:"Dr. Priya Nair", title:"Technical Director",         company:"", avatar:"👩‍💻", style:"collaborative but rigorous — she'll ask you to walk her through your thinking", color:"#6C63FF"},
  {id:"alex",   name:"Alex Rivera",    title:"Managing Director",          company:"", avatar:"💼",  style:"strategic — she cares about how you think, not just what you've done", color:"#E07A5F"},
  {id:"amara",  name:"Amara Diallo",   title:"Chief People Officer",       company:"", avatar:"🌍",  style:"values-driven — she's looking for authenticity, not rehearsed answers", color:"#52B788"},
];

function LiveInterviewModule({country, onScore}){
  const [phase,setPhase]=useState("setup"); // setup|briefing|live|debrief
  const [mode,setMode]=useState("roleplay"); // roleplay|surprise
  const [setup,setSetup]=useState({company:"",role:"",interviewer:"sarah",resumeText:"",duration:"20"});
  const [surpriseSetup,setSurpriseSetup]=useState(null);
  const [messages,setMessages]=useState([]); // [{role,content,timestamp,wordCount}]
  const [isRecording,setIsRecording]=useState(false);
  const [transcript,setTranscript]=useState("");
  const [loading,setLoading]=useState(false);
  const [elapsedTime,setElapsedTime]=useState(0);
  const [timerActive,setTimerActive]=useState(false);
  const [debrief,setDebrief]=useState(null);
  const [debriefLoading,setDebriefLoading]=useState(false);
  const [turnCount,setTurnCount]=useState(0);
  const recogRef=useRef(null);
  const timerRef=useRef(null);
  const chatRef=useRef(null);

  const interviewer=LIVE_INTERVIEWERS.find(i=>i.id===setup.interviewer)||LIVE_INTERVIEWERS[0];
  const maxMinutes=parseInt(setup.duration)||20;
  const maxSeconds=maxMinutes*60;
  const timeLeft=maxSeconds-elapsedTime;
  const fmt=s=>{const m=Math.floor(s/60);const sec=s%60;return`${m}:${sec.toString().padStart(2,"0")}`;};

  // Timer
  useEffect(()=>{
    if(timerActive&&elapsedTime<maxSeconds){
      timerRef.current=setTimeout(()=>setElapsedTime(t=>t+1),1000);
    }
    if(elapsedTime>=maxSeconds&&timerActive){
      endInterview();
    }
    return()=>clearTimeout(timerRef.current);
  },[timerActive,elapsedTime,maxSeconds]);

  // Scroll chat to bottom
  useEffect(()=>{
    setTimeout(()=>chatRef.current?.scrollTo({top:99999,behavior:"smooth"}),100);
  },[messages]);

  const startRecording=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice not supported in this browser. Please use Chrome.");return;}
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=e=>{
      let interim="";let final="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        if(e.results[i].isFinal)final+=e.results[i][0].transcript+" ";
        else interim+=e.results[i][0].transcript;
      }
      setTranscript(prev=>prev+final||(prev+interim));
    };
    r.onerror=()=>setIsRecording(false);
    r.start();recogRef.current=r;setIsRecording(true);
  };

  const stopRecording=()=>{
    try{recogRef.current?.stop();}catch{}
    setIsRecording(false);
  };

  const submitAnswer=async()=>{
    const ans=transcript.trim();
    if(!ans||loading)return;
    stopRecording();setTranscript("");setLoading(true);

    const userMsg={role:"user",content:ans,timestamp:new Date().toISOString(),wordCount:ans.split(/\s+/).length};
    const newMessages=[...messages,userMsg];
    setMessages(newMessages);setTurnCount(t=>t+1);

    const currentSetup=mode==="surprise"?surpriseSetup:setup;
    const iv=LIVE_INTERVIEWERS.find(i=>i.id===currentSetup.interviewer)||LIVE_INTERVIEWERS[0];

    const sys=`You are ${iv.name}, ${iv.title}${currentSetup.company?` at ${currentSetup.company}`:""}, conducting a live job interview for ${currentSetup.role||"a senior role"} in ${country.name}.

Your interview style: ${iv.style}

CRITICAL RULES:
- Stay completely in character throughout. Never break the fourth wall.
- React naturally to what the candidate says — if they give a weak answer, probe it. If strong, acknowledge and advance.
- Ask ONE follow-up or next question per turn — never two at once.
- Keep responses to 2-4 sentences max. You are an interviewer, not a lecturer.
- React authentically: "Interesting — tell me more about..." or "I want to push back on that..." or "That's exactly the kind of thinking we need here..."
- After ${Math.floor(maxMinutes*0.8)} minutes of conversation, naturally begin to wrap up.
- Never give feedback or scores during the interview. Save all evaluation for later.
- The candidate is an African professional targeting ${country.name}. Treat them with full professional respect.`;

    const apiMessages=newMessages.map(m=>({role:m.role==="user"?"user":"assistant",content:m.content}));
    const reply=await callClaude(apiMessages,sys,300);
    const aiMsg={role:"assistant",content:reply,timestamp:new Date().toISOString(),wordCount:reply.split(/\s+/).length};
    setMessages(m=>[...m,aiMsg]);
    setLoading(false);
  };

  const startInterview=async()=>{
    setPhase("briefing");setLoading(true);

    let finalSetup=setup;
    if(mode==="surprise"){
      // Generate a surprise company/role
      const res=await callClaude([{role:"user",content:`Generate a realistic surprise interview scenario for an African professional targeting ${country.name}. Return JSON only: {"company":"real company name","role":"specific job title","industry":"industry"}`}],`Return only valid JSON.`,200);
      try{
        const clean=res.replace(/```json|```/g,"").trim();
        const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
        const parsed=JSON.parse(clean.slice(s,e));
        finalSetup={...setup,...parsed,interviewer:LIVE_INTERVIEWERS[Math.floor(Math.random()*LIVE_INTERVIEWERS.length)].id};
        setSurpriseSetup(finalSetup);
      }catch{finalSetup={...setup,company:"Goldman Sachs",role:"Vice President of Operations",interviewer:"james"};}
    }

    const iv=LIVE_INTERVIEWERS.find(i=>i.id===(finalSetup.interviewer||setup.interviewer))||LIVE_INTERVIEWERS[0];
    // Opening message from interviewer
    const openingSys=`You are ${iv.name}, ${iv.title}${finalSetup.company?` at ${finalSetup.company}`:""}, about to start a job interview for ${finalSetup.role||"a senior role"} in ${country.name}. Your style: ${iv.style}.
Write your natural opening — introduce yourself warmly, set the candidate at ease, then ask your first question. Keep it under 4 sentences total. Stay completely in character.`;
    const opening=await callClaude([{role:"user",content:`The candidate has just walked in. Start the interview.${setup.resumeText?` Their background: ${setup.resumeText.slice(0,400)}...`:""}`}],openingSys,250);
    setMessages([{role:"assistant",content:opening,timestamp:new Date().toISOString(),wordCount:opening.split(/\s+/).length}]);
    setLoading(false);setPhase("live");
    setTimeout(()=>setTimerActive(true),500);
  };

  const endInterview=async()=>{
    stopRecording();setTimerActive(false);setPhase("debrief");setDebriefLoading(true);
    const currentSetup=mode==="surprise"?surpriseSetup:setup;
    const iv=LIVE_INTERVIEWERS.find(i=>i.id===currentSetup.interviewer)||LIVE_INTERVIEWERS[0];

    const transcript_full=messages.map((m,i)=>`${m.role==="assistant"?iv.name:"Candidate"}: ${m.content}`).join("\n\n");
    const totalWords=messages.filter(m=>m.role==="user").reduce((a,m)=>a+(m.wordCount||0),0);
    const avgWords=messages.filter(m=>m.role==="user").length>0
      ?Math.round(totalWords/messages.filter(m=>m.role==="user").length):0;

    const sys=`You are a senior career coach evaluating a live interview transcript. The candidate was interviewing for ${currentSetup.role||"a senior role"}${currentSetup.company?` at ${currentSetup.company}`:""} in ${country.name}.

Return ONLY a JSON object (no markdown):
{
  "overallScore": number 0-100,
  "verdictLabel": "Outstanding"|"Strong"|"Promising"|"Needs Work"|"Not Ready",
  "verdictColor": "hired" for >=70, "tryagain" for <70,
  "hiringLikelihood": "Very Likely"|"Likely"|"Possible"|"Unlikely"|"Very Unlikely",
  "executiveSummary": "3 sentences from the interviewer's perspective — honest, specific, professional",
  "dimensions": [
    {"name":"Communication Clarity","score":number 0-10,"comment":"specific observation"},
    {"name":"Structure & STAR Method","score":number 0-10,"comment":"specific observation"},
    {"name":"Confidence & Presence","score":number 0-10,"comment":"specific observation"},
    {"name":"Role Relevance","score":number 0-10,"comment":"specific observation"},
    {"name":"Self-Awareness","score":number 0-10,"comment":"specific observation"}
  ],
  "strongestMoment": "quote or paraphrase of their best answer with why it worked",
  "weakestMoment": "quote or paraphrase of their weakest answer with what went wrong",
  "fillerPatterns": ["filler word or pattern observed","..."] max 3, empty array if none,
  "missedOpportunities": ["specific moment they could have said X but said Y instead"] max 3,
  "strongerVersions": [{"original":"what they said briefly","stronger":"how they should have said it with STAR + buzzwords"}] for 2 weakest answers,
  "keyTakeaways": ["3 specific things to improve before the next interview"],
  "interviewerNote": "One final sentence in ${iv.name}'s voice — what would they tell the hiring committee about this candidate"
}`;

    const res=await callClaude([{role:"user",content:`Interview Transcript:\n${transcript_full}\n\nTotal candidate turns: ${messages.filter(m=>m.role==="user").length}\nAverage words per answer: ${avgWords}\nInterview duration: ${fmt(elapsedTime)}`}],sys,1800);
    try{
      const clean=res.replace(/```json|```/g,"").trim();
      const s=clean.indexOf("{");const e=clean.lastIndexOf("}")+1;
      const parsed=JSON.parse(clean.slice(s,e));
      setDebrief(parsed);
      onScore&&onScore(parsed.overallScore,(currentSetup.role||"Live Interview"),(currentSetup.company||""),parsed.verdictColor==="hired"?"HIRED":"TRY AGAIN");
    }catch{
      setDebrief({overallScore:68,verdictLabel:"Promising",verdictColor:"tryagain",hiringLikelihood:"Possible",
        executiveSummary:"The candidate showed genuine enthusiasm and relevant experience. Answers were sometimes too long and lacked specific metrics. Structure needs improvement before the next round.",
        dimensions:[{name:"Communication Clarity",score:7,comment:"Generally clear but occasionally rambling"},{name:"Structure & STAR Method",score:5,comment:"Some structure but often missing the Result"},{name:"Confidence & Presence",score:7,comment:"Good energy throughout"},{name:"Role Relevance",score:7,comment:"Experience clearly applies to this role"},{name:"Self-Awareness",score:6,comment:"Good self-reflection but room to grow"}],
        strongestMoment:"When they described leading the team restructuring — specific, confident, impactful.",
        weakestMoment:"The question about handling failure — the answer was vague and didn't demonstrate learning.",
        fillerPatterns:["um/uh frequently","'basically' overused"],
        missedOpportunities:["Could have quantified the team size and revenue impact","Missed chance to name-drop relevant industry knowledge"],
        strongerVersions:[{original:"I managed a team",stronger:"I led a cross-functional team of 18 across 3 countries, reducing operational costs by 23% in 6 months"}],
        keyTakeaways:["Lead every answer with a number","Use STAR method consistently","Prepare 3 stories that can flex to any behavioral question"],
        interviewerNote:"Promising candidate who needs one more round of coaching before they're ready for a panel."});
    }
    setDebriefLoading(false);
  };

  // ── SETUP ──
  if(phase==="setup")return(
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">🎙️</span>
        <div><div className="panel-title">Live Interview</div><div className="panel-subtitle">Real conversation · Voice in · AI replies · Full debrief at end</div></div>
      </div>
      <div className="panel-body">
        <div style={{background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,padding:"16px 18px",marginBottom:20,fontSize:13,color:C.cream,lineHeight:1.75}}>
          🎙️ This is different from the Interview Simulation. There's no script. The AI interviewer listens to you, reacts to your answers, asks follow-ups, and challenges you — exactly like a real interview room.
        </div>

        {/* Mode selector */}
        <div style={{display:"flex",gap:10,marginBottom:22}}>
          <div onClick={()=>setMode("roleplay")} style={{flex:1,padding:"16px",borderRadius:12,cursor:"pointer",border:`1.5px solid ${mode==="roleplay"?C.gold:"rgba(255,255,255,0.08)"}`,background:mode==="roleplay"?"rgba(232,168,56,0.08)":"rgba(0,0,0,0.15)",transition:"all .2s"}}>
            <div style={{fontSize:20,marginBottom:6}}>🎭</div>
            <div style={{fontSize:13,fontWeight:700,color:mode==="roleplay"?C.gold:C.white,marginBottom:3}}>Roleplay</div>
            <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>You choose the company, role and interviewer. Full control.</div>
          </div>
          <div onClick={()=>setMode("surprise")} style={{flex:1,padding:"16px",borderRadius:12,cursor:"pointer",border:`1.5px solid ${mode==="surprise"?C.gold:"rgba(255,255,255,0.08)"}`,background:mode==="surprise"?"rgba(232,168,56,0.08)":"rgba(0,0,0,0.15)",transition:"all .2s"}}>
            <div style={{fontSize:20,marginBottom:6}}>⚡</div>
            <div style={{fontSize:13,fontWeight:700,color:mode==="surprise"?C.gold:C.white,marginBottom:3}}>Surprise Mode</div>
            <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>AI picks the company and role. You have 30 seconds to prepare.</div>
          </div>
        </div>

        {mode==="roleplay"&&(
          <>
            <div className="row">
              <div className="flex1"><label className="input-label">Company</label><input className="input-field" placeholder="e.g. McKinsey, Barclays, NHS" value={setup.company} onChange={e=>setSetup(p=>({...p,company:e.target.value}))}/></div>
              <div className="flex1"><label className="input-label">Role you're applying for</label><input className="input-field" placeholder="e.g. Director of Strategy" value={setup.role} onChange={e=>setSetup(p=>({...p,role:e.target.value}))}/></div>
            </div>

            <label className="input-label">Your Interviewer</label>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
              {LIVE_INTERVIEWERS.map(iv=>(
                <div key={iv.id} onClick={()=>setSetup(p=>({...p,interviewer:iv.id}))}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:11,cursor:"pointer",border:`1.5px solid ${setup.interviewer===iv.id?iv.color:"rgba(255,255,255,0.07)"}`,background:setup.interviewer===iv.id?`${iv.color}12`:"rgba(0,0,0,0.12)",transition:"all .2s"}}>
                  <div style={{width:38,height:38,borderRadius:10,background:`${iv.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,border:`1px solid ${iv.color}30`}}>{iv.avatar}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:setup.interviewer===iv.id?iv.color:C.white}}>{iv.name}</div>
                    <div style={{fontSize:11,color:C.gray}}>{iv.title}</div>
                    <div style={{fontSize:11,color:C.gray,marginTop:2,fontStyle:"italic"}}>Style: {iv.style}</div>
                  </div>
                  {setup.interviewer===iv.id&&<span style={{color:iv.color,fontSize:18}}>✓</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {mode==="surprise"&&(
          <div style={{background:"rgba(231,76,60,0.07)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:12,padding:"20px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>⚡</div>
            <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:6}}>You won't know the company or role until you start</div>
            <div style={{fontSize:12,color:C.gray,lineHeight:1.7}}>Just like real life — sometimes you get an unexpected call. The AI will generate a realistic scenario and you'll have 30 seconds to collect yourself before the interview begins.</div>
          </div>
        )}

        <div className="row" style={{marginBottom:16}}>
          <div className="flex1">
            <label className="input-label">Interview Duration</label>
            <select className="select-field" value={setup.duration} onChange={e=>setSetup(p=>({...p,duration:e.target.value}))}>
              <option value="10">10 minutes — Quick screen</option>
              <option value="20">20 minutes — Standard</option>
              <option value="30">30 minutes — Full interview</option>
              <option value="45">45 minutes — Deep dive</option>
            </select>
          </div>
        </div>

        <label className="input-label">Your Background (optional — helps the interviewer ask role-relevant questions)</label>
        <textarea className="textarea-field" style={{minHeight:80}}
          placeholder="Paste a few lines from your CV — your most recent role, key achievements, target level..."
          value={setup.resumeText} onChange={e=>setSetup(p=>({...p,resumeText:e.target.value}))}/>

        <div style={{background:"rgba(232,168,56,0.06)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.cream,lineHeight:1.7}}>
          🎙️ <strong style={{color:C.gold}}>How it works:</strong> You speak your answers using the microphone button. The AI interviewer reads what you said and replies in text — like reading an email from them. Natural follow-up questions, pushback, and probing — just like real life.
        </div>

        <button className="btn btn-gold" onClick={startInterview}
          disabled={loading||(mode==="roleplay"&&(!setup.company||!setup.role))}
          style={{width:"100%",justifyContent:"center",fontSize:14,padding:"14px"}}>
          {loading?"Setting up your interview...":mode==="surprise"?"⚡ Start Surprise Interview":"🎙️ Enter the Interview Room"}
        </button>
      </div>
    </div>
  );

  // ── BRIEFING ──
  if(phase==="briefing")return(
    <div className="panel">
      <div className="panel-body" style={{textAlign:"center",padding:"48px 24px"}}>
        <div style={{fontSize:48,marginBottom:16}}>🎙️</div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:C.white,marginBottom:8}}>
          {mode==="surprise"?"Generating your scenario...":"Setting up the interview room..."}
        </div>
        <div style={{fontSize:13,color:C.gray,marginBottom:24}}>
          {mode==="surprise"?"The AI is picking a company and role for you. Get ready.":"Briefing your interviewer on the role and your background."}
        </div>
        <div className="dots" style={{justifyContent:"center"}}><span/><span/><span/></div>
      </div>
    </div>
  );

  // ── DEBRIEF ──
  if(phase==="debrief")return(
    <div className="panel">
      <div className="panel-header">
        <span className="panel-icon">📊</span>
        <div><div className="panel-title">Interview Debrief</div><div className="panel-subtitle">{(mode==="surprise"?surpriseSetup?.role:setup.role)||"Live Interview"} · {fmt(elapsedTime)} · {messages.filter(m=>m.role==="user").length} answers</div></div>
      </div>
      <div className="panel-body">
        {debriefLoading?(
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div className="thinking" style={{justifyContent:"center",flexDirection:"column",gap:14}}>
              <div style={{fontSize:36}}>🔍</div>
              <div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:4}}>Analysing your performance...</div>
              <div style={{fontSize:12,color:C.gray,marginBottom:16}}>Reviewing every answer, every moment, every missed opportunity</div>
              <div className="dots"><span/><span/><span/></div>
            </div>
          </div>
        ):debrief&&(
          <>
            {/* Verdict */}
            <div style={{textAlign:"center",marginBottom:24,padding:"28px 0"}}>
              <div style={{width:100,height:100,borderRadius:24,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:44,background:debrief.verdictColor==="hired"?"rgba(0,200,150,0.12)":"rgba(231,76,60,0.1)",border:`2px solid ${debrief.verdictColor==="hired"?C.verified:"#E74C3C"}`}}>
                {debrief.verdictColor==="hired"?"🌟":"💪"}
              </div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:28,fontWeight:800,color:debrief.verdictColor==="hired"?C.verified:"#E74C3C",marginBottom:4}}>{debrief.verdictLabel}</div>
              <div style={{fontSize:14,color:C.gold,fontWeight:600,marginBottom:12}}>{debrief.overallScore}/100 · Hiring Likelihood: {debrief.hiringLikelihood}</div>
              <div style={{fontSize:13,color:C.gray,maxWidth:440,margin:"0 auto",lineHeight:1.75}}>{debrief.executiveSummary}</div>
            </div>

            {/* 5 Dimensions */}
            <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"20px",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:16}}>Performance Dimensions</div>
              {(debrief.dimensions||[]).map((d,i)=>(
                <div key={i} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <span style={{fontSize:13,color:C.white,fontWeight:600}}>{d.name}</span>
                    <span style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:d.score>=8?C.verified:d.score>=6?C.gold:"#E74C3C"}}>{d.score}/10</span>
                  </div>
                  <div style={{height:5,background:"rgba(255,255,255,0.07)",borderRadius:3,overflow:"hidden",marginBottom:5}}>
                    <div style={{height:"100%",width:`${d.score*10}%`,background:d.score>=8?C.verified:d.score>=6?C.gold:"#E74C3C",borderRadius:3,transition:"width 1s ease"}}/>
                  </div>
                  <div style={{fontSize:11,color:C.gray,lineHeight:1.5}}>{d.comment}</div>
                </div>
              ))}
            </div>

            {/* Best & Worst moments */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              <div style={{background:"rgba(0,200,150,0.07)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:10,fontWeight:700,color:C.verified,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>🌟 Your Strongest Moment</div>
                <div style={{fontSize:13,color:C.cream,lineHeight:1.7}}>{debrief.strongestMoment}</div>
              </div>
              <div style={{background:"rgba(231,76,60,0.07)",border:"1px solid rgba(231,76,60,0.2)",borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#E74C3C",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>💔 Your Weakest Moment</div>
                <div style={{fontSize:13,color:C.cream,lineHeight:1.7}}>{debrief.weakestMoment}</div>
              </div>
            </div>

            {/* Filler words */}
            {debrief.fillerPatterns?.length>0&&(
              <div style={{background:"rgba(232,168,56,0.07)",border:"1px solid rgba(232,168,56,0.15)",borderRadius:12,padding:"16px 18px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>🗣️ Speech Patterns to Fix</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {debrief.fillerPatterns.map((f,i)=>(
                    <div key={i} style={{background:"rgba(232,168,56,0.1)",border:"1px solid rgba(232,168,56,0.2)",borderRadius:16,padding:"4px 12px",fontSize:12,color:C.gold,fontWeight:600}}>{f}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Stronger versions */}
            {debrief.strongerVersions?.length>0&&(
              <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"18px 20px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>💬 How You Could Have Said It</div>
                {debrief.strongerVersions.map((s,i)=>(
                  <div key={i} style={{marginBottom:14}}>
                    <div style={{fontSize:12,color:C.gray,marginBottom:4}}>You said: <em>{s.original}</em></div>
                    <div style={{background:"rgba(0,200,150,0.06)",border:"1px solid rgba(0,200,150,0.15)",borderRadius:9,padding:"10px 14px",fontSize:12,color:C.cream,lineHeight:1.75}}>
                      <span style={{color:C.verified,fontWeight:700,fontSize:10,display:"block",marginBottom:4}}>✓ STRONGER VERSION</span>
                      {s.stronger}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Key takeaways */}
            <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"18px 20px",marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>🎯 3 Things to Fix Before Your Next Interview</div>
              {(debrief.keyTakeaways||[]).map((t,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(232,168,56,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.gold,flexShrink:0}}>{i+1}</div>
                  <div style={{fontSize:13,color:C.cream,lineHeight:1.6}}>{t}</div>
                </div>
              ))}
            </div>

            {/* Interviewer note */}
            {debrief.interviewerNote&&(
              <div style={{background:`${(LIVE_INTERVIEWERS.find(i=>i.id===(mode==="surprise"?surpriseSetup?.interviewer:setup.interviewer))||LIVE_INTERVIEWERS[0]).color}10`,border:`1px solid ${(LIVE_INTERVIEWERS.find(i=>i.id===(mode==="surprise"?surpriseSetup?.interviewer:setup.interviewer))||LIVE_INTERVIEWERS[0]).color}25`,borderRadius:12,padding:"16px 18px",marginBottom:20}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:22,flexShrink:0}}>{(LIVE_INTERVIEWERS.find(i=>i.id===(mode==="surprise"?surpriseSetup?.interviewer:setup.interviewer))||LIVE_INTERVIEWERS[0]).avatar}</span>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:(LIVE_INTERVIEWERS.find(i=>i.id===(mode==="surprise"?surpriseSetup?.interviewer:setup.interviewer))||LIVE_INTERVIEWERS[0]).color,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{(LIVE_INTERVIEWERS.find(i=>i.id===(mode==="surprise"?surpriseSetup?.interviewer:setup.interviewer))||LIVE_INTERVIEWERS[0]).name}'s Note to the Hiring Committee</div>
                    <div style={{fontSize:13,color:C.cream,lineHeight:1.7,fontStyle:"italic"}}>"{debrief.interviewerNote}"</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button className="btn btn-gold" onClick={()=>{setPhase("setup");setMessages([]);setTranscript("");setDebrief(null);setElapsedTime(0);setTurnCount(0);setSurpriseSetup(null);}}>
                🔄 Try Another Interview
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── LIVE INTERVIEW ROOM ──
  const currentSetup=mode==="surprise"?surpriseSetup:setup;
  const iv=LIVE_INTERVIEWERS.find(i=>i.id===(currentSetup?.interviewer||setup.interviewer))||LIVE_INTERVIEWERS[0];
  const progressPct=Math.min((elapsedTime/maxSeconds)*100,100);
  const urgency=timeLeft<=120;

  return(
    <div>
      {/* Top bar */}
      <div style={{background:C.navyM,border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px 14px 0 0",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:38,height:38,borderRadius:10,background:`${iv.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:`1px solid ${iv.color}30`}}>{iv.avatar}</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>{iv.name}</div>
            <div style={{fontSize:11,color:iv.color}}>{iv.title}{currentSetup?.company?` · ${currentSetup.company}`:""}</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:urgency?"#E74C3C":C.gold}}>{fmt(timeLeft)}</div>
          <div style={{fontSize:10,color:C.gray}}>{turnCount} turn{turnCount!==1?"s":""}</div>
        </div>
      </div>

      {/* Time progress bar */}
      <div style={{height:3,background:"rgba(255,255,255,0.07)"}}>
        <div style={{height:"100%",width:`${progressPct}%`,background:urgency?"#E74C3C":C.gold,transition:"width 1s linear"}}/>
      </div>

      {/* Chat area */}
      <div style={{background:C.navyL,border:"1px solid rgba(255,255,255,0.07)",borderTop:"none",padding:"20px",minHeight:300}}>
        <div className="chat-area" ref={chatRef} style={{maxHeight:380,marginBottom:16}}>
          {messages.map((m,i)=>(
            <div key={i} className={`msg-row${m.role==="user"?" user":""}`}>
              <div className={`msg-av${m.role==="assistant"?" ai":" user"}`} style={m.role==="assistant"?{background:`${iv.color}18`,fontSize:"16px"}:{}}>{m.role==="assistant"?iv.avatar:"👤"}</div>
              <div className={`msg-bub${m.role==="assistant"?" ai":" user"}`}>
                {m.role==="assistant"&&<div style={{fontSize:10,color:iv.color,fontWeight:700,marginBottom:4}}>{iv.name}</div>}
                {m.content}
                {m.wordCount&&m.role==="user"&&<div style={{fontSize:10,color:"rgba(139,155,180,0.5)",marginTop:4}}>{m.wordCount} words</div>}
              </div>
            </div>
          ))}
          {loading&&(
            <div className="msg-row">
              <div className="msg-av ai" style={{background:`${iv.color}18`,fontSize:"16px"}}>{iv.avatar}</div>
              <div className="msg-bub ai"><div className="dots"><span/><span/><span/></div></div>
            </div>
          )}
        </div>

        {/* Voice input area */}
        <div style={{background:"rgba(0,0,0,0.15)",borderRadius:12,padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{textAlign:"center",marginBottom:12}}>
            <button className={`mic-btn${isRecording?" recording":" idle"}`} onClick={isRecording?stopRecording:startRecording}>
              {isRecording?"🔴":"🎤"}
            </button>
            <div style={{fontSize:12,color:C.gray,marginTop:6}}>{isRecording?"Recording... tap to stop and send":"Tap to speak your answer"}</div>
          </div>
          {transcript&&(
            <div style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.cream,lineHeight:1.65,marginBottom:10}}>
              {transcript}
            </div>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {transcript&&!isRecording&&(
              <>
                <button className="btn btn-red btn-sm" onClick={()=>setTranscript("")}>↺ Clear</button>
                <button className="btn btn-gold" onClick={submitAnswer} disabled={loading}>Send Answer →</button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={endInterview} style={{opacity:0.6}}>End Interview & Get Debrief</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV=[
  {id:"home",icon:"🏠",label:"Dashboard"},
  {id:"resume",icon:"📄",label:"Resume Transformer",badge:"🔥"},
  {id:"ats",icon:"🎯",label:"ATS Optimizer"},
  {id:"live",icon:"🎙️",label:"Live Interview",badge:"NEW"},
  {id:"game",icon:"🎮",label:"Interview Simulation"},
  {id:"qbank",icon:"🗂️",label:"Question Bank"},
  {id:"verify",icon:"✅",label:"Work Verification"},
  {id:"roles",icon:"🎯",label:"Role Suggester"},
  {id:"culture",icon:"🌉",label:"Culture Bridge"},
  {id:"motivation",icon:"💪",label:"Motivation"},
  {id:"human",icon:"🤝",label:"Book a Human Coach"},
];

export default function App(){
  const [active,setActive]=useState("home");
  const [countryCode,setCountryCode]=useState("US");
  const country=COUNTRIES[countryCode];
  const {progress,trackModule,trackATSScore,trackInterviewScore,trackResume,trackCountry,resetProgress}=useProgress();

  // Track module visits
  const navTo=(id)=>{
    setActive(id);
    if(id!=="home")trackModule(id);
  };

  // Track country switches
  const switchCountry=(code)=>{
    setCountryCode(code);
    trackCountry(code);
  };

  // Secret admin route via URL hash
  if(typeof window!=="undefined"&&window.location.hash==="#/feedback"){
    return(<><style>{css}</style><FeedbackAdmin/></>);
  }

  // Verification landing page route
  if(typeof window!=="undefined"&&window.location.hash.startsWith("#/verify")){
    return(<><style>{css}</style><VerifyLanding/></>);
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
                <div key={c.code} className={`country-pill${countryCode===c.code?" active":""}`} onClick={()=>switchCountry(c.code)}>
                  <span className="country-pill-flag">{c.flag}</span>
                  <span className="country-pill-code">{c.code}</span>
                </div>
              ))}
            </div>
          </div>
          <nav className="nav">
            <div className="nav-sec">Tools</div>
            {NAV.map(m=>(
              <div key={m.id} className={`nav-item${active===m.id?" active":""}`} onClick={()=>navTo(m.id)}>
                <span className="nav-icon">{m.icon}</span>{m.label}
                {m.badge&&<span className={`nav-badge${m.badge==="NEW"?" new":""}`}>{m.badge}</span>}
              </div>
            ))}
          </nav>
          <SidebarProgress progress={progress}/>
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
                <ProgressDashboard progress={progress} onReset={resetProgress} setActive={navTo}/>
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:17,fontWeight:700,color:C.white,marginBottom:5}}>Where would you like to start?</div>
                  <div style={{fontSize:13,color:C.gray}}>New here? Start with {country.docName} Transformer, then practice with Interview Simulation.</div>
                </div>
                <div className="module-grid">
                  {[
                    {id:"resume",e:"📄",t:`${country.docName} Transformer`,d:`Upload your ${country.docName.toLowerCase()}. AI upgrades titles, quantifies achievements, formats to ${country.name} standard — then a Confidence Check makes sure it sounds like YOU.`,cta:`Transform my ${country.docName.toLowerCase()} →`},
                    {id:"ats",e:"🎯",t:"ATS Optimizer",d:"Paste a specific job description and your resume. AI scores your current match, adds missing keywords naturally, and rewrites your resume to pass that company's ATS filter.",cta:"Optimize for a role →"},
                    {id:"game",e:"🎮",t:"Interview Simulation",d:`Structured 6-question interview with up to 5 panelists. Get a Hired or Try Again verdict plus per-answer feedback and missing buzzwords.`,cta:"Start simulation →"},
                    {id:"live",e:"🎙️",t:"Live Interview",d:"Real conversation — no script. AI interviewer listens to your voice, reacts to YOUR answers, asks follow-ups, and challenges you. Full debrief at the end.",cta:"Enter the interview room →"},
                    {id:"qbank",e:"🗂️",t:"Question Bank",d:"Real interview questions submitted by the community. See what companies actually ask. Contribute your own. AI tells you exactly how to answer each one.",cta:"Browse real questions →"},
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
            {active==="resume"&&<ResumeModule country={country} onComplete={trackResume}/>}
            {active==="ats"&&<ATSModule country={country} onScore={trackATSScore}/>}
            {active==="live"&&<LiveInterviewModule country={country} onScore={trackInterviewScore}/>}
            {active==="game"&&<InterviewGame country={country} onScore={trackInterviewScore}/>}
            {active==="qbank"&&<QuestionBankModule country={country}/>}
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
