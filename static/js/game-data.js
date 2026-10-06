/* ═══════════════════════════════════════════════════════
   CYBERVAULT FORENSIC ESCAPE — Game Data
   Case definitions, evidence, suspects, puzzles, timeline
   ═══════════════════════════════════════════════════════ */
'use strict';

const GAME_DATA = {

  /* ── CASES ─────────────────────────────────────────── */
  cases: [
    {
      id: 'case001',
      num: '#047',
      title: 'THE SILENT ROOM',
      location: 'Abandoned Investigation Office, Floor 4',
      difficulty: 3,
      maxDifficulty: 5,
      evidenceTotal: 12,
      suspectsTotal: 4,
      puzzlesTotal: 5,
      targetTime: 1200, // seconds
      unlocked: true,

      story: {
        briefing: `A senior forensic investigator, Detective James Cole, was assigned to investigate a missing evidence case involving a classified data breach. Three days ago, Cole failed to report for duty. His office on the fourth floor was found locked from the inside. There are no signs of forced entry. His personal effects remain. The investigation notes are missing.\n\nYou have been assigned to determine what happened.`,
        objectives: [
          'Determine how the room was entered and exited',
          'Identify what evidence Cole was investigating',
          'Discover who had access to the room that night',
          'Reconstruct the timeline of events',
          'Identify who is responsible for Cole\'s disappearance'
        ],
        connectedCase: null
      },

      rooms: [
        { id: 'office',   label: 'Investigation Office', icon: '🏢', unlocked: true,  hasEvidence: true },
        { id: 'archive',  label: 'Archive Room',         icon: '📁', unlocked: false, hasEvidence: true,  unlockPuzzle: 'puzzle_archive_key' },
        { id: 'security', label: 'Security Room',        icon: '🔒', unlocked: false, hasEvidence: true,  unlockPuzzle: 'puzzle_security_code' },
        { id: 'server',   label: 'Server Room',          icon: '💾', unlocked: false, hasEvidence: true,  unlockPuzzle: 'puzzle_server_access' }
      ],

      /* ── EVIDENCE ────────────────────────────────────── */
      evidence: [
        {
          id: 'E001', num: 'E-001', name: 'Desk Drawer Contents',
          category: 'physical', icon: '🗄️',
          room: 'office', objectId: 'obj_drawer',
          observation: 'A torn piece of paper is hidden beneath several documents. Part of what appears to be a phone number and a name fragment "…REED" are visible.',
          description: 'Torn paper fragment with partial phone number (XXX-4721) and partial name. Matches typeface of internal memos.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 90,
          analysisResult: 'Fragment is consistent with internal building memo paper. The number traces to a maintenance extension. The name fragment matches a person of interest.',
          connections: ['E007', 'S003']
        },
        {
          id: 'E002', num: 'E-002', name: 'Wall Clock',
          category: 'physical', icon: '🕐',
          room: 'office', objectId: 'obj_clock',
          observation: 'The clock has stopped at 09:17. The second hand is still engaged, suggesting the clock was manually stopped rather than running out of power.',
          description: 'Analog wall clock. Stopped at 09:17. Battery intact. No mechanical failure detected.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 95,
          analysisResult: 'Clock was deliberately stopped. The position of the second hand is inconsistent with natural stopping. This time is significant.',
          connections: ['E005', 'E009']
        },
        {
          id: 'E003', num: 'E-003', name: 'Photograph Frames',
          category: 'physical', icon: '🖼️',
          room: 'office', objectId: 'obj_photo',
          observation: 'Three framed photographs on the desk. One is face-down. When turned over, it shows Cole with three colleagues. A fourth figure has been cut out from the right side.',
          description: 'Group photograph with one person deliberately removed. Torn edge visible at right.',
          importance: 'relevant',
          analyzed: false, collected: false, reliability: 75,
          analysisResult: 'Image analysis confirms deliberate cropping. The shadow of the removed person is consistent with male, approximately 6ft tall, wearing a suit jacket.',
          connections: ['S002', 'S003']
        },
        {
          id: 'E004', num: 'E-004', name: 'USB Drive',
          category: 'digital', icon: '💾',
          room: 'office', objectId: 'obj_drawer',
          observation: 'A black USB drive is wedged behind the drawer lining. It appears to have been hidden deliberately.',
          description: 'Unmarked USB drive, 32GB. Hidden inside desk drawer lining.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 85,
          analysisResult: 'Drive contains encrypted files dated two weeks ago. Filename pattern matches internal case files: CV-2847-BREACH. One file is partially deleted but recoverable.',
          connections: ['E008', 'S003']
        },
        {
          id: 'E005', num: 'E-005', name: 'Visitor Log',
          category: 'document', icon: '📋',
          room: 'office', objectId: 'obj_documents',
          observation: 'A physical visitor sign-in log on the desk. The last three entries are from 09:00–09:30 on the night of the incident.',
          description: 'Building visitor log. Entries for the night of the incident.',
          importance: 'relevant',
          analyzed: false, collected: false, reliability: 80,
          analysisResult: 'Log shows: 09:03 — A.Morgan (Security Check). 09:11 — D.Reed (System Maintenance). 09:28 — V.Hale (Building Inspection). All signed by same pen. Some entries appear written simultaneously — possible forgery.',
          connections: ['S001', 'S003', 'S004', 'E002']
        },
        {
          id: 'E006', num: 'E-006', name: 'Broken Window Latch',
          category: 'physical', icon: '🪟',
          room: 'office', objectId: 'obj_window',
          observation: 'The window is closed but the internal latch is broken. The break appears recent — no dust accumulation on the fracture. The window can be opened from outside.',
          description: 'Window latch with fresh fracture. No dust. Accessible from outside fire escape.',
          importance: 'supporting',
          analyzed: false, collected: false, reliability: 88,
          analysisResult: 'Fracture consistent with a deliberate force applied from the outside. The fire escape outside this window was accessible without a key card.',
          connections: ['E010', 'S001']
        },
        {
          id: 'E007', num: 'E-007', name: 'Computer Login Log',
          category: 'digital', icon: '💻',
          room: 'office', objectId: 'obj_computer',
          observation: 'The computer shows a login at 09:17 followed by several file accesses, then a forced shutdown at 09:44.',
          description: 'System access log showing login at 09:17, file access, shutdown 09:44.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 92,
          analysisResult: 'Login used credentials: user "d.reed". Files accessed: CV-2847-BREACH, WITNESS-LIST, CHAIN-OF-CUSTODY-LOG. All related to the missing evidence investigation Cole was conducting.',
          connections: ['E004', 'E005', 'S003']
        },
        {
          id: 'E008', num: 'E-008', name: 'Encrypted File Fragment',
          category: 'digital', icon: '🔐',
          room: 'office', objectId: 'obj_computer',
          observation: 'A partially recovered deleted file on the computer. The file was deleted at 09:42 — two minutes before shutdown.',
          description: 'Partially deleted file: CV-2847-BREACH. Last modified 09:42.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 78,
          analysisResult: 'Recovered content mentions: "Subject transferred files to external party. Chain of custody broken. Evidence of tampering at evidence locker 14-B." This is what Cole was investigating.',
          connections: ['E004', 'E007', 'S003']
        },
        {
          id: 'E009', num: 'E-009', name: 'Safe Contents',
          category: 'physical', icon: '🔒',
          room: 'office', objectId: 'obj_safe',
          observation: 'The wall safe is closed. The combination must be discovered from other evidence.',
          description: 'Wall safe. Combination required. Contains critical evidence.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 100,
          analysisResult: 'Safe contained: Access keycard (archive level), handwritten note reading "Check D.Reed — evidence locker 14B — 09:17", and a printed email chain.',
          connections: ['E002', 'E010', 'S003'],
          requiresPuzzle: 'puzzle_safe'
        },
        {
          id: 'E010', num: 'E-010', name: 'Keycard — Archive Access',
          category: 'physical', icon: '🪪',
          room: 'office', objectId: 'obj_safe',
          observation: 'An access keycard for the archive room. Found inside the safe.',
          description: 'Blue keycard. Archive access level. Registered to Cole.',
          importance: 'relevant',
          analyzed: false, collected: false, reliability: 95,
          analysisResult: 'Card was last used to access Archive at 09:05 — before the time Cole allegedly entered the office that night.',
          connections: ['E009', 'E005'],
          requiresEvidence: 'E009'
        },
        {
          id: 'E011', num: 'E-011', name: 'Archive File — CV-2847',
          category: 'document', icon: '📂',
          room: 'archive', objectId: 'obj_archive_files',
          observation: 'A physical case file for CV-2847-BREACH. Several pages have been removed. A handwritten note in the margin reads "See D.Reed access 14B".',
          description: 'Physical case file with missing pages. Margin note implicating D.Reed.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 88,
          analysisResult: 'Missing pages correspond to the dates evidence was transferred. Handwriting matches Cole. This confirms he identified Reed before disappearing.',
          connections: ['E007', 'E008', 'S003']
        },
        {
          id: 'E012', num: 'E-012', name: 'CCTV Footage — Server Room',
          category: 'surveillance', icon: '📹',
          room: 'security', objectId: 'obj_cctv_terminal',
          observation: 'CCTV footage from the corridor outside Cole\'s office. Multiple events recorded between 09:00 and 10:00.',
          description: 'CCTV recording. Multiple access events. One camera disabled at 09:52.',
          importance: 'critical',
          analyzed: false, collected: false, reliability: 90,
          analysisResult: 'Timeline confirmed by CCTV: 09:11 D.Reed enters corridor. 09:16 Reed enters office. 09:44 Reed exits carrying a bag. 09:52 corridor camera disabled remotely. No sign of Cole after 09:17.',
          connections: ['E007', 'E005', 'S003']
        }
      ],

      /* ── SUSPECTS ─────────────────────────────────────── */
      suspects: [
        {
          id: 'S001', name: 'Alex Morgan', role: 'Security Officer',
          emoji: '👮',
          motive: 'Unknown. Possibly covering for someone.',
          alibi: 'Claims to have been on patrol rounds all evening.',
          relationship: 'Was responsible for building security the night of the incident.',
          access: 'Full building access including all floors.',
          credibility: 65,
          guilty: false,
          redHerring: true,
          statements: {
            default: 'I completed my security rounds as scheduled. I checked the fourth floor at 09:03 and everything appeared normal.',
            questioned: 'I signed in at 09:03. That is consistent with my patrol schedule. I saw no one else on that floor at that time.',
            alibi_detail: 'My patrol log shows I was at the east wing at 09:17. I cannot be in two places at once.'
          },
          contradictions: [],
          evidenceLinks: ['E005', 'E006']
        },
        {
          id: 'S002', name: 'Maya Carter', role: 'Research Assistant',
          emoji: '👩‍🔬',
          motive: 'Potentially covering for a colleague. Relationship with Reed unclear.',
          alibi: 'States she left the building at 8:45 PM.',
          relationship: 'Worked in the lab below Cole\'s office. Access to case file system.',
          access: 'Research areas, lab, archive (read-only).',
          credibility: 70,
          guilty: false,
          redHerring: true,
          statements: {
            default: 'I had nothing to do with this. I left early that evening. Check the exit log.',
            questioned: 'I am telling the truth. The exit log will confirm I left at 8:45.',
            alibi_detail: 'I have no reason to be involved in whatever happened up there.'
          },
          contradictions: [],
          evidenceLinks: ['E003']
        },
        {
          id: 'S003', name: 'Daniel Reed', role: 'System Administrator',
          emoji: '👨‍💻',
          motive: 'Reed was the subject of Cole\'s investigation. Cole had evidence that Reed had tampered with evidence in a previous case.',
          alibi: 'Claims he was doing scheduled maintenance in the server room until 11 PM.',
          relationship: 'Had administrative access to all systems. Cole was building a case against him.',
          access: 'All systems including CCTV administration and evidence database.',
          credibility: 40,
          guilty: true,
          redHerring: false,
          statements: {
            default: 'I was in the server room all night running a maintenance cycle. I did not go near Cole\'s office.',
            questioned: 'My maintenance log shows continuous system activity from 8 PM to 11 PM. That is my alibi.',
            alibi_detail: 'I have no idea what you are implying. Those logs are automated. They run without me being present.'
          },
          contradictions: [
            { evidence: 'E007', text: 'Reed claims server room all night, but computer login shows his credentials used in Cole\'s office at 09:17.' },
            { evidence: 'E012', text: 'CCTV shows Reed entering Cole\'s office corridor at 09:11, contradicting his server room alibi.' },
            { evidence: 'E005', text: 'Visitor log confirms Reed signed in to the fourth floor at 09:11.' }
          ],
          evidenceLinks: ['E001', 'E004', 'E007', 'E008', 'E011', 'E012']
        },
        {
          id: 'S004', name: 'Victor Hale', role: 'Building Manager',
          emoji: '🧑‍💼',
          motive: 'Had authority over building access. May have enabled Reed\'s access.',
          alibi: 'Claims he was conducting a late inspection of the ground floor.',
          relationship: 'Controls building access cards and maintenance schedules.',
          access: 'Building management systems, key vault, maintenance access.',
          credibility: 58,
          guilty: false,
          redHerring: true,
          statements: {
            default: 'I authorized a maintenance window for the server room that evening. That is routine.',
            questioned: 'I approved Reed\'s maintenance work. That is my job. I had no reason to know anything criminal was occurring.',
            alibi_detail: 'I signed in for inspection at 09:28 as the log shows. Ground floor only.'
          },
          contradictions: [
            { evidence: 'E005', text: 'Hale signed in at 09:28 but the building\'s exit system shows no one matching his profile left via main entrance until 10:45.' }
          ],
          evidenceLinks: ['E005']
        }
      ],

      /* ── PUZZLES ──────────────────────────────────────── */
      puzzles: [
        {
          id: 'puzzle_safe',
          title: 'WALL SAFE — COMBINATION LOCK',
          type: 'combination',
          objectId: 'obj_safe',
          hint: 'The clock stopped at a significant moment. The photograph contains three numbers. Together they form the combination.',
          clueChain: ['E002 — clock stopped at 09:17', 'E003 — photo removed person, timestamp visible: 09, 17, 44'],
          solution: [0, 9, 1, 7],
          solutionHint: 'Four digits. What time did the clock stop?',
          reward: ['E009', 'E010'],
          rewardMessage: 'SAFE UNLOCKED — Access keycard and handwritten note discovered.',
          solved: false
        },
        {
          id: 'puzzle_computer',
          title: 'COMPUTER TERMINAL — LOGIN',
          type: 'password',
          objectId: 'obj_computer',
          hint: 'The username and password were found in the environment. Look for credentials related to the investigation.',
          clueChain: ['E001 — torn note mentions REED', 'E002 — time 09:17 is significant'],
          solution: 'COLE0917',
          solutionHint: 'Username relates to the investigator. Password relates to the time.',
          reward: ['E007', 'E008'],
          rewardMessage: 'LOGIN SUCCESSFUL — Access logs and deleted file recovered.',
          solved: false
        },
        {
          id: 'puzzle_archive_key',
          title: 'ARCHIVE ROOM — ACCESS REQUIRED',
          type: 'keycard',
          objectId: 'obj_archive_door',
          hint: 'A keycard with archive access was hidden somewhere in the office.',
          clueChain: ['E009 — safe contains keycard', 'E010 — archive level keycard'],
          requiresEvidence: 'E010',
          reward: [],
          rewardMessage: 'ARCHIVE UNLOCKED — New investigation area accessible.',
          unlockRoom: 'archive',
          solved: false
        },
        {
          id: 'puzzle_security_code',
          title: 'SECURITY ROOM — DOOR CODE',
          type: 'pattern',
          objectId: 'obj_security_door',
          hint: 'The security room door uses a symbol sequence. The pattern is hidden in the archive files.',
          clueChain: ['E011 — archive file has margin symbols: ★ △ ○ □'],
          solution: ['★', '△', '○', '□'],
          solutionHint: 'Four symbols found in the archive documents.',
          reward: [],
          rewardMessage: 'SECURITY ROOM UNLOCKED',
          unlockRoom: 'security',
          solved: false
        },
        {
          id: 'puzzle_server_access',
          title: 'SERVER ROOM — AUTHENTICATION',
          type: 'password',
          objectId: 'obj_server_door',
          hint: 'Server access requires the maintenance authorization code from the CCTV logs.',
          clueChain: ['E012 — CCTV log contains maintenance code', 'Find code in security room'],
          solution: 'MAINT2847',
          solutionHint: 'Maintenance code. Found in CCTV records.',
          reward: [],
          rewardMessage: 'SERVER ROOM UNLOCKED',
          unlockRoom: 'server',
          solved: false
        }
      ],

      /* ── TIMELINE ─────────────────────────────────────── */
      timeline: [
        { id: 'TL001', time: '09:03', event: 'Alex Morgan signs security log — 4th floor patrol', correct_order: 0 },
        { id: 'TL002', time: '09:05', event: 'Cole\'s access card used at archive room', correct_order: 1 },
        { id: 'TL003', time: '09:11', event: 'Daniel Reed enters 4th floor corridor', correct_order: 2 },
        { id: 'TL004', time: '09:16', event: 'Reed enters Cole\'s office (window entry)', correct_order: 3 },
        { id: 'TL005', time: '09:17', event: 'Clock stopped. Reed logs into computer using Cole\'s credentials', correct_order: 4 },
        { id: 'TL006', time: '09:28', event: 'Victor Hale signs building inspection log', correct_order: 5 },
        { id: 'TL007', time: '09:42', event: 'Critical file deleted from computer', correct_order: 6 },
        { id: 'TL008', time: '09:44', event: 'Reed exits office with bag (USB drive)', correct_order: 7 },
        { id: 'TL009', time: '09:52', event: 'CCTV corridor camera disabled remotely', correct_order: 8 },
        { id: 'TL010', time: '10:45', event: 'Building exits locked by management system', correct_order: 9 }
      ],

      /* ── SOLUTION ─────────────────────────────────────── */
      solution: {
        culprit: 'S003',
        motive: 'Data theft — Reed tampered with evidence in a previous case and Cole was building a case against him.',
        method: 'Reed entered through broken window, used Cole\'s computer to delete files, stole USB drive containing evidence, then framed Cole\'s disappearance.',
        location: 'Investigation Office (Cole\'s Room)',
        time: '09:11–09:44',
        keyEvidence: ['E004', 'E007', 'E008', 'E012'],
        motiveOptions: [
          'Personal grudge against Cole',
          'Data theft — tampering with evidence chain',
          'Corporate espionage for external party',
          'Protecting a third party suspect'
        ],
        methodOptions: [
          'Poisoning via ventilation system',
          'Unauthorized computer access and evidence theft via window entry',
          'Staged disappearance with Cole\'s cooperation',
          'Remote system manipulation without physical presence'
        ],
        locationOptions: [
          'Archive Room',
          'Server Room',
          'Investigation Office (Cole\'s Room)',
          'Building Basement'
        ],
        timeOptions: [
          '08:45–09:00',
          '09:11–09:44',
          '09:44–10:00',
          '10:00–10:45'
        ]
      },

      /* ── ENDINGS ──────────────────────────────────────── */
      endings: {
        perfect: {
          grade: 'S',
          title: 'PERFECT INVESTIGATION',
          narrative: `Daniel Reed, System Administrator, entered Cole's office at 09:11 through the deliberately broken window latch he had prepared earlier. Using Cole's computer with his own credentials, Reed deleted the file that would have exposed his evidence tampering. He took the USB drive containing the original evidence. The clock was stopped at 09:17 to establish a false timeline. Cole had been lured away earlier using a forged maintenance request. The investigation you conducted has uncovered the complete chain of events. Reed will be charged.`
        },
        solved: {
          grade: 'A',
          title: 'CASE SOLVED',
          narrative: `Your investigation correctly identified Daniel Reed as responsible. Reed used his system access to cover his tracks, but the combination of CCTV footage, computer logs, and the recovered USB drive created an undeniable chain of evidence. Case cleared.`
        },
        partial: {
          grade: 'B',
          title: 'INSUFFICIENT EVIDENCE',
          narrative: `You identified the correct suspect but the evidence presentation was incomplete. Additional analysis of the CCTV footage and computer logs would have strengthened the case significantly.`
        },
        wrong: {
          grade: 'C',
          title: 'WRONG SUSPECT',
          narrative: `The investigation concluded incorrectly. The evidence pointed away from your chosen suspect. Review the CCTV timeline and computer access logs — the truth was there.`
        },
        false: {
          grade: 'D',
          title: 'FALSE CONCLUSION',
          narrative: `Critical evidence was not analyzed. The case remains open. The most important clues were in the computer access logs and the hidden USB drive.`
        }
      }
    },

    /* ── CASE 002 (LOCKED) ───────────────────────────── */
    {
      id: 'case002',
      num: '#048',
      title: 'THE UNDERGROUND NETWORK',
      location: 'Decommissioned Server Facility',
      difficulty: 4,
      maxDifficulty: 5,
      evidenceTotal: 15,
      suspectsTotal: 5,
      puzzlesTotal: 7,
      targetTime: 1500,
      unlocked: false,
      story: {
        briefing: 'A series of data breaches has been traced to a decommissioned server facility. Someone is still using the old network.',
        objectives: ['Identify the network operator', 'Trace the data pipeline', 'Recover stolen data']
      },
      rooms: [], evidence: [], suspects: [], puzzles: [], timeline: [], solution: null, endings: null
    },

    {
      id: 'case003',
      num: '#049',
      title: 'THE ABANDONED LAB',
      location: 'Research Laboratory — Sub-Level 2',
      difficulty: 4,
      maxDifficulty: 5,
      evidenceTotal: 14,
      suspectsTotal: 4,
      puzzlesTotal: 6,
      targetTime: 1400,
      unlocked: false,
      story: {
        briefing: 'A research scientist has gone missing. The lab was found in disarray. Scientific samples are missing.',
        objectives: ['Find the missing scientist', 'Identify the stolen samples', 'Determine who sabotaged the research']
      },
      rooms: [], evidence: [], suspects: [], puzzles: [], timeline: [], solution: null, endings: null
    }
  ],

  /* ── RANKS ─────────────────────────────────────────── */
  ranks: [
    { name: 'TRAINEE',            minXP: 0 },
    { name: 'JUNIOR INVESTIGATOR', minXP: 100 },
    { name: 'FORENSIC ANALYST',   minXP: 300 },
    { name: 'SENIOR INVESTIGATOR',minXP: 600 },
    { name: 'LEAD INVESTIGATOR',  minXP: 1000 },
    { name: 'MASTER INVESTIGATOR',minXP: 1500 }
  ],

  /* ── ACHIEVEMENTS ──────────────────────────────────── */
  achievements: [
    { id: 'ACH001', icon: '🔍', title: 'FIRST CLUE',       desc: 'Discover your first evidence item.',         condition: 'evidence_count_1' },
    { id: 'ACH002', icon: '🧠', title: 'DEDUCTIVE MIND',   desc: 'Solve a case without using hints.',           condition: 'no_hints_case' },
    { id: 'ACH003', icon: '🔗', title: 'CONNECTED',        desc: 'Establish 5 correct evidence connections.',    condition: 'connections_5' },
    { id: 'ACH004', icon: '⏱️', title: 'SPEED INVESTIGATOR', desc: 'Solve a case under the target time.',       condition: 'under_time' },
    { id: 'ACH005', icon: '🕵️', title: 'PERFECT CASE',     desc: 'Find all evidence in a case.',               condition: 'all_evidence' },
    { id: 'ACH006', icon: '📁', title: 'UNLOCKED',         desc: 'Unlock all rooms in a case.',                 condition: 'all_rooms' },
    { id: 'ACH007', icon: '🔬', title: 'FORENSIC MASTER',  desc: 'Analyze all evidence in a case.',             condition: 'all_analyzed' },
    { id: 'ACH008', icon: '🏆', title: 'MASTER INVESTIGATOR', desc: 'Achieve rank Master Investigator.',        condition: 'rank_master' }
  ],

  /* ── ROOM OBJECTS (interactive scene items) ─────────── */
  roomObjects: {
    office: [
      {
        id: 'obj_drawer', label: 'Desk Drawer', icon: '🗄️',
        pos: { left: '35%', bottom: '37%' }, size: { width: '10%', height: '5%' },
        evidenceIds: ['E001', 'E004'],
        observation: 'A heavy wooden drawer. Something is hidden beneath the papers.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_clock', label: 'Wall Clock', icon: '🕐',
        pos: { left: '58%', top: '18%' }, size: { width: '5%', height: '9%' },
        evidenceIds: ['E002'],
        observation: 'The clock has stopped. The second hand is frozen mid-sweep.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_photo', label: 'Photograph Frame', icon: '🖼️',
        pos: { left: '28%', bottom: '52%' }, size: { width: '5%', height: '7%' },
        evidenceIds: ['E003'],
        observation: 'One of the frames is face-down. Unusual.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_computer', label: 'Computer Terminal', icon: '💻',
        pos: { left: '34%', bottom: '36%' }, size: { width: '7%', height: '9%' },
        evidenceIds: ['E007', 'E008'],
        observation: 'The computer is off. A login prompt appears when activated.',
        puzzleId: 'puzzle_computer',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_safe', label: 'Wall Safe', icon: '🔒',
        pos: { right: '18%', bottom: '25%' }, size: { width: '8%', height: '13%' },
        evidenceIds: ['E009', 'E010'],
        observation: 'A concealed wall safe behind a loose panel. Combination locked.',
        puzzleId: 'puzzle_safe',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_documents', label: 'Desk Documents', icon: '📋',
        pos: { left: '40%', bottom: '50%' }, size: { width: '6%', height: '3%' },
        evidenceIds: ['E005'],
        observation: 'A stack of papers. A visitor log is on top.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_window', label: 'Window', icon: '🪟',
        pos: { right: '22%', top: '8%' }, size: { width: '12%', height: '22%' },
        evidenceIds: ['E006'],
        observation: 'The window is closed but something looks wrong with the latch.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_wall_uv', label: 'Wall Surface', icon: '🔦',
        pos: { left: '15%', top: '30%' }, size: { width: '18%', height: '30%' },
        evidenceIds: [],
        observation: 'The wall appears normal under visible light.',
        uvReveal: 'Hidden message: "09:17 — D.REED — EVIDENCE LOCKER 14B"',
        toolRequired: 'uv'
      },
      {
        id: 'obj_bookshelf', label: 'Bookshelf', icon: '📚',
        pos: { left: '2%', bottom: '22%' }, size: { width: '10%', height: '45%' },
        evidenceIds: [],
        observation: 'Rows of case files. Most are routine. One slot appears recently emptied.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_filing', label: 'Filing Cabinet', icon: '🗃️',
        pos: { right: '6%', bottom: '8%' }, size: { width: '7%', height: '25%' },
        evidenceIds: [],
        observation: 'Standard filing cabinet. Locked. The key would be in the safe.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_archive_door', label: 'Archive Door', icon: '🚪',
        pos: { left: '72%', bottom: '8%' }, size: { width: '4%', height: '28%' },
        evidenceIds: [],
        observation: 'Door to the archive room. Requires a keycard.',
        puzzleId: 'puzzle_archive_key',
        uvReveal: null, toolRequired: null
      }
    ],
    archive: [
      {
        id: 'obj_archive_files', label: 'Case Files CV-2847', icon: '📂',
        pos: { left: '30%', bottom: '45%' }, size: { width: '12%', height: '8%' },
        evidenceIds: ['E011'],
        observation: 'A thick file labeled CV-2847-BREACH. Pages are missing.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_security_door', label: 'Security Room Door', icon: '🔐',
        pos: { right: '5%', bottom: '8%' }, size: { width: '4%', height: '28%' },
        evidenceIds: [],
        observation: 'Security room access. Symbol sequence required.',
        puzzleId: 'puzzle_security_code',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_archive_uv', label: 'Archive Wall', icon: '🔦',
        pos: { left: '10%', top: '20%' }, size: { width: '20%', height: '40%' },
        evidenceIds: [],
        observation: 'Old archive wall with yellowed papers.',
        uvReveal: 'Symbol sequence visible: ★ △ ○ □',
        toolRequired: 'uv'
      }
    ],
    security: [
      {
        id: 'obj_cctv_terminal', label: 'CCTV Terminal', icon: '📹',
        pos: { left: '25%', bottom: '35%' }, size: { width: '18%', height: '22%' },
        evidenceIds: ['E012'],
        observation: 'CCTV monitoring terminal. Live and recorded footage available.',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_server_door', label: 'Server Room Door', icon: '🖥️',
        pos: { right: '5%', bottom: '8%' }, size: { width: '4%', height: '28%' },
        evidenceIds: [],
        observation: 'Server room access. Maintenance authentication required.',
        puzzleId: 'puzzle_server_access',
        uvReveal: null, toolRequired: null
      },
      {
        id: 'obj_maintenance_code', label: 'Maintenance Log', icon: '📋',
        pos: { left: '50%', bottom: '45%' }, size: { width: '8%', height: '5%' },
        evidenceIds: [],
        observation: 'Maintenance authorization log. Code MAINT2847 visible in entry from Reed.',
        uvReveal: null, toolRequired: null
      }
    ],
    server: [
      {
        id: 'obj_server_terminal', label: 'Server Terminal', icon: '🖥️',
        pos: { left: '20%', bottom: '30%' }, size: { width: '20%', height: '25%' },
        evidenceIds: [],
        observation: 'Server terminal. Running. Reed\'s last session is cached.',
        uvReveal: null, toolRequired: null
      }
    ]
  }
};

/* Freeze data to prevent mutation */
Object.freeze(GAME_DATA);
