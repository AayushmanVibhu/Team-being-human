import { useMemo, useRef, useState } from "react";
import { usePersistentState } from "./hooks/usePersistentState";
import { communityAssistant } from "./services/communityAssistant";
import { findSimilarEvents } from "./services/duplicateEventService";

type IconName =
  | "arrow"
  | "accessibility"
  | "bell"
  | "calendar"
  | "car"
  | "chat"
  | "check"
  | "chevron"
  | "clock"
  | "compass"
  | "heart"
  | "eye"
  | "ear"
  | "home"
  | "location"
  | "people"
  | "racquet"
  | "search"
  | "sparkles"
  | "star"
  | "trail"
  | "dance"
  | "volume"
  | "user";

function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const paths: Record<IconName, React.ReactNode> = {
    accessibility: <><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 6v6m0 0-4 9m4-9 4 9M8 12h8" /></>,
    arrow: <path d="m15 18-6-6 6-6" />,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    car: <><path d="m5 17-2-2v-4l2-5h14l2 5v4l-2 2H5Z" /><path d="M5 17v3M19 17v3M3 12h18" /><circle cx="7" cy="14" r="1" /><circle cx="17" cy="14" r="1" /></>,
    chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    ear: <><path d="M6 10a6 6 0 0 1 12 0c0 5-4 5-4 9a2 2 0 0 1-4 0" /><path d="M10 10a2 2 0 1 1 3 1.7c-1 .6-1 1.3-1 2.3" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    racquet: <><ellipse cx="9" cy="8" rx="5" ry="6" transform="rotate(-35 9 8)" /><path d="m12 13 7 8M5.5 5l7 6M4.5 9l6.5-6" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    sparkles: <><path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z" /><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14Z" /></>,
    star: <path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z" />,
    trail: <><path d="m3 20 6-10 4 6 3-5 5 9H3Z" /><path d="M12 20c0-3 2-3 2-6" /><circle cx="18" cy="5" r="2" /></>,
    dance: <><circle cx="13" cy="4" r="2" /><path d="m9 21 2-7-3-3 3-4 4 2 3-1M11 14l4 3 1 4" /></>,
    volume: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const interests = [
  ["Outdoors", "Trail walks, picnics", "sun"],
  ["Sports", "Badminton, volleyball", "ball"],
  ["Music", "Concerts, jam sessions", "music"],
  ["Creative", "Dance, photo, art", "brush"],
  ["Games", "Board games, trivia", "dice"],
  ["Books", "Book clubs, writing", "book"],
  ["Food", "Cooking, café hopping", "food"],
  ["Movies", "Film nights, cinema", "film"],
];

const questions = [
  {
    title: "Your ideal Friday night is...",
    subtitle: "Choose what feels most like you.",
    options: [
      ["A small dinner with a few close friends", "Cozy & connected", 1, 2],
      ["Trying a new activity with new people", "Open & adventurous", 2, 0],
      ["A big event with lots of energy", "Social & spontaneous", 3, 0],
      ["A quiet night to recharge", "Calm & reflective", 0, 3],
    ],
  },
  {
    title: "In a new group, you usually...",
    subtitle: "There are no wrong answers.",
    options: [
      ["Listen first, then join the conversation", "Thoughtful", 0, 2],
      ["Introduce yourself to one person", "Intentional", 1, 2],
      ["Bring everyone into the conversation", "Welcoming", 3, 1],
      ["Suggest something fun to do together", "Playful", 3, 0],
    ],
  },
  {
    title: "What makes a meetup feel good?",
    subtitle: "This helps us find your people.",
    options: [
      ["Knowing what to expect ahead of time", "Prepared", 1, 3],
      ["Having an interest to talk about", "Curious", 2, 1],
      ["A friendly host who breaks the ice", "Supported", 1, 2],
      ["The freedom to leave whenever I want", "Low pressure", 0, 0],
    ],
  },
  {
    title: "What role feels natural in a group?",
    subtitle: "Think about a group where you feel comfortable.",
    options: [
      ["I observe and add something when it matters", "Thoughtful observer", 0, 2],
      ["I make sure everyone feels included", "Supportive connector", 2, 2],
      ["I organize the plan and keep things moving", "Confident planner", 3, 3],
      ["I bring energy and spontaneous ideas", "Creative spark", 3, 0],
    ],
  },
  {
    title: "How do you like plans to happen?",
    subtitle: "This shapes the events we recommend.",
    options: [
      ["Tell me the details well in advance", "Planned & prepared", 1, 3],
      ["Give me a simple plan with some flexibility", "Balanced", 2, 2],
      ["Invite me the day before and I’ll decide", "Go with the flow", 2, 1],
      ["I love a last-minute invitation", "Spontaneous", 3, 0],
    ],
  },
];

const events = [
  {
    id: 1,
    title: "Sunset badminton",
    type: "Sports",
    image: "https://images.unsplash.com/photo-1723074832950-9fb031b0f4ec?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Today · 5:30 PM",
    place: "SDFC courts",
    distance: "0.4 mi",
    match: 96,
    spots: 2,
    host: "Maya",
    activityIcon: "racquet" as IconName,
    tags: ["Badminton", "Beginner friendly", "Low-key"],
  },
  {
    id: 2,
    title: "Papago sunrise walk",
    type: "Outdoors",
    image: "https://images.unsplash.com/photo-1726156372736-ce2229e7cf0a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Tomorrow · 7:00 AM",
    place: "Papago Park",
    distance: "2.1 mi",
    match: 92,
    spots: 3,
    host: "Noah",
    activityIcon: "trail" as IconName,
    tags: ["Hiking", "Photography", "Carpool"],
  },
  {
    id: 3,
    title: "K-pop dance cover",
    type: "Creative",
    image: "https://images.unsplash.com/photo-1787724691088-76ed8e29dbc8?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Friday · 6:00 PM",
    place: "Student Pavilion",
    distance: "0.7 mi",
    match: 87,
    spots: 3,
    host: "Jules",
    activityIcon: "dance" as IconName,
    tags: ["K-pop", "Dance", "Creative"],
  },
];

type Screen = "welcome" | "verify" | "interests" | "quiz" | "result" | "app";
type Tab = "discover" | "calendar" | "alerts" | "profile";

function Progress({ step, total }: { step: number; total: number }) {
  return <div className="progress" aria-label={`Step ${step} of ${total}`}><span style={{ width: `${(step / total) * 100}%` }} /></div>;
}

function KinliiSymbol() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="11" cy="11" r="4" /><circle cx="25" cy="11" r="4" />
      <path d="M5 27c1-6 4-9 8-9 2 0 3.8 1 5 2.6C19.2 19 21 18 23 18c4 0 7 3 8 9" />
      <path d="M13.5 24c2.8 2.6 6.2 2.6 9 0" />
    </svg>
  );
}

function Logo() {
  return <div className="logo"><span className="kinlii-mark"><KinliiSymbol /></span><span className="logo-copy"><b>kinlii</b><small>Less Screen. More Seen.</small></span></div>;
}

export default function App() {
  const [screen, setScreen] = usePersistentState("kinlii:screen", "welcome" as Screen);
  const [selectedInterests, setSelectedInterests] = usePersistentState("kinlii:interests", ["Outdoors", "Sports"] as string[]);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = usePersistentState("kinlii:personality-answers", [] as number[]);
  const [tab, setTab] = useState<Tab>("discover");
  const [event, setEvent] = useState<(typeof events)[number] | null>(null);
  const [joined, setJoined] = usePersistentState("kinlii:joined", [] as number[]);
  const [saved, setSaved] = usePersistentState("kinlii:saved", [] as number[]);
  const [alertsEnabled, setAlertsEnabled] = usePersistentState("kinlii:nearby-alerts", true);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [calendarSynced, setCalendarSynced] = usePersistentState("kinlii:calendar-connected", false);
  const [privateCalendar, setPrivateCalendar] = usePersistentState("kinlii:calendar-private", true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("Hi Alex. Need help finding an activity, planning your week, or staying safe?");
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [largeText, setLargeText] = usePersistentState("kinlii:large-text", false);
  const [highContrast, setHighContrast] = usePersistentState("kinlii:high-contrast", false);
  const [hearingSupport, setHearingSupport] = usePersistentState("kinlii:hearing-support", false);
  const [visualSupport, setVisualSupport] = usePersistentState("kinlii:visual-support", false);
  const [reading, setReading] = useState(false);
  const [carpoolJoined, setCarpoolJoined] = usePersistentState("kinlii:carpool-requests", [] as number[]);
  const [createOpen, setCreateOpen] = useState(false);
  const [hostedPlans, setHostedPlans] = usePersistentState("kinlii:hosted", [] as Array<{ title: string; category: string; date: string; time: string; location: string; spots: string }>);
  const [createForm, setCreateForm] = useState({ title: "", category: "", date: "", time: "", location: "", spots: "4" });
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = usePersistentState("kinlii:profile-image", "");
  const profileInput = useRef<HTMLInputElement>(null);

  const chooseInterest = (name: string) => {
    setSelectedInterests((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  };

  const chooseAnswer = (index: number) => {
    const next = [...answers];
    next[quizStep] = index;
    setAnswers(next);
  };

  const finishQuestion = () => {
    if (quizStep < questions.length - 1) setQuizStep(quizStep + 1);
    else setScreen("result");
  };

  const pageTitle = useMemo(() => ({
    discover: "Near you",
    calendar: "Your calendar",
    alerts: "Activity alerts",
    profile: "Your profile",
  }[tab]), [tab]);

  const sendChat = async (message = chatMessage) => {
    if (!message.trim()) return;
    setChatMessage("");
    setChatReply("Looking for the best next step…");
    try {
      const response = await communityAssistant.respond({
        history: [{ role: "user", content: message }],
        gatherings: events.map((item) => ({ ...item, category: item.type, day: item.time, dateKey: item.time.startsWith("Today") ? "today" : item.time.startsWith("Tomorrow") ? "tomorrow" : "weekend", period: item.time.includes("AM") ? "morning" : "evening", attendees: 4 - item.spots, capacity: 4, newcomers: true, instantJoin: true })),
      });
      setChatReply(response.text);
      const action = response.actions?.[0];
      if (action?.type === "calendar_summary") setTab("calendar");
      if (action?.type === "gathering_recommendations" && action.gatheringIds?.[0]) setEvent(events.find((item) => item.id === action.gatheringIds[0]) || null);
      if ((action?.type === "gathering_draft" || action?.type === "create_gathering") && action.draft) {
        setCreateForm((form) => ({ ...form, title: action.draft.title || "", category: action.draft.category?.includes("Sports") ? "Sports" : action.draft.category || "", date: action.draft.day === "Date not selected" ? "" : action.draft.day || "", time: "", location: action.draft.location || "" }));
        setCreateOpen(true);
      }
    } catch {
      setChatReply("I couldn’t complete that request just now. Try asking for an activity, your schedule, safety help, or a ride.");
    }
  };

  const readPage = () => {
    if (!("speechSynthesis" in window)) return;
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const text = document.querySelector(".phone-shell main")?.textContent || "Kinlii accessibility reader";
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = 0.92;
    speech.onend = () => setReading(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setReading(true);
  };

  const personality = useMemo(() => {
    let energy = 0;
    let structure = 0;
    answers.forEach((answer, questionIndex) => {
      const option = questions[questionIndex]?.options[answer];
      energy += Number(option?.[2] ?? 0);
      structure += Number(option?.[3] ?? 0);
    });
    const energetic = energy >= 9;
    const organized = structure >= 8;
    if (energetic && organized) return {
      name: "Warm Organizer",
      description: "You enjoy bringing people together and feel best when everyone knows the plan and feels included.",
      traits: ["Welcoming", "Dependable", "Community-minded"],
      group: "friendly, well-planned groups of 4–6",
    };
    if (energetic) return {
      name: "Social Adventurer",
      description: "You gain energy from people and new experiences, especially when plans leave room for spontaneity.",
      traits: ["Outgoing", "Playful", "Open-minded"],
      group: "energetic, flexible groups of 4–6",
    };
    if (organized) return {
      name: "Thoughtful Planner",
      description: "You build strong connections when plans feel clear, comfortable, and centered on meaningful conversation.",
      traits: ["Intentional", "Prepared", "Supportive"],
      group: "calm, organized groups of 3–5",
    };
    return {
      name: "Calm Explorer",
      description: "You’re curious and open to new experiences, but connect best in relaxed groups with little social pressure.",
      traits: ["Curious", "Reflective", "Low-pressure"],
      group: "relaxed, interest-led groups of 3–5",
    };
  }, [answers]);

  const similarEvent = useMemo(() => {
    if (!createForm.category || !createForm.date || !createForm.time || !createForm.location) return null;
    const schedules: Record<number, string> = { 1: "Today", 2: "Tomorrow", 3: "Friday" };
    return findSimilarEvents({
      title: createForm.title,
      category: createForm.category,
      startsAt: createForm.date,
      latitude: 33.424,
      longitude: -111.94,
      radiusMiles: 3,
      existingEvents: events.map((item) => ({ ...item, category: item.type, day: schedules[item.id], startsAt: schedules[item.id], latitude: 33.424, longitude: -111.94, attendees: 4 - item.spots, capacity: 4 })),
    }) || null;
  }, [createForm]);

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return events;
    return events.filter((item) => [item.title, item.type, item.place, ...item.tags].some((value) => value.toLowerCase().includes(query)));
  }, [searchQuery]);

  const uploadProfileImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const publishEvent = () => {
    if (!createForm.title || !createForm.category || !createForm.date || !createForm.time || !createForm.location || similarEvent) return;
    setHostedPlans((plans) => [...plans, createForm]);
    setCreateOpen(false);
    setCreateForm({ title: "", category: "", date: "", time: "", location: "", spots: "4" });
    setTab("calendar");
  };

  if (screen === "welcome") {
    return (
      <div className="phone-shell onboarding welcome-screen">
        <header className="simple-header"><Logo /><button onClick={() => setScreen("app")}>Skip</button></header>
        <div className="hero-visual">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="person-bubble person-a"><Icon name="racquet" size={22} /></div><div className="person-bubble person-b"><Icon name="trail" size={22} /></div><div className="person-bubble person-c"><Icon name="dance" size={22} /></div>
          <div className="center-mark"><KinliiSymbol /></div>
          <span className="interest-chip chip-one">Badminton</span><span className="interest-chip chip-two">Hiking</span><span className="interest-chip chip-three">Film</span>
        </div>
        <div className="welcome-copy">
          <span className="kicker">LESS SCREEN. MORE SEEN.</span>
          <h1>Meet people who just <em>get you.</em></h1>
          <p>Kin connects you with small, verified groups nearby based on your interests and personality.</p>
        </div>
        <div className="bottom-action">
          <button className="primary-button" onClick={() => setScreen("verify")}>Find my people <Icon name="chevron" /></button>
          <p>Made for students · Safe by design</p>
        </div>
      </div>
    );
  }

  if (screen === "verify") {
    const validEmail = /^[^\s@]+@[^\s@]+\.edu$/i.test(schoolEmail);
    return (
      <div className="phone-shell onboarding verify-screen">
        <header className="flow-header"><button onClick={() => codeSent ? setCodeSent(false) : setScreen("welcome")}><Icon name="arrow" /></button><Progress step={1} total={4} /><span>Verify</span></header>
        <main className="verification-content">
          <div className="verification-mark"><Icon name="check" size={31} /><span className="school-dot one" /><span className="school-dot two" /></div>
          <span className="step-label">STUDENTS ONLY</span>
          <h1>{codeSent ? "Check your inbox" : "Verify your student status"}</h1>
          <p>{codeSent ? `We sent a six-digit verification code to ${schoolEmail}.` : "Kin is a trusted student community. Use your university email to keep every group verified and accountable."}</p>
          {!codeSent ? (
            <>
              <label className="edu-input"><span>University email</span><div><Icon name="user" size={18} /><input type="email" value={schoolEmail} onChange={(event) => setSchoolEmail(event.target.value)} placeholder="name@university.edu" /></div></label>
              {schoolEmail && !validEmail && <p className="field-error">Please enter a valid email ending in .edu</p>}
              <section className="verification-benefits">
                <div><span><Icon name="check" size={14} /></span><p><strong>Verified community</strong><small>Only active students can join or host.</small></p></div>
                <div><span><Icon name="check" size={14} /></span><p><strong>Your email stays private</strong><small>Other members only see your first name and school.</small></p></div>
                <div><span><Icon name="check" size={14} /></span><p><strong>Safer meetups</strong><small>Every account is tied to a university identity.</small></p></div>
              </section>
            </>
          ) : (
            <label className="edu-input code-input"><span>Verification code</span><div><input inputMode="numeric" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" /></div><small>For this prototype, enter any six digits.</small></label>
          )}
        </main>
        <div className="bottom-action">
          <button className="primary-button" disabled={codeSent ? verificationCode.length !== 6 : !validEmail} onClick={() => codeSent ? setScreen("interests") : setCodeSent(true)}>
            {codeSent ? "Verify and continue" : "Send verification code"} <Icon name="chevron" />
          </button>
          <p>{codeSent ? "Didn't receive it? Resend code" : "By continuing, you agree to our community guidelines."}</p>
        </div>
      </div>
    );
  }

  if (screen === "interests") {
    return (
      <div className="phone-shell onboarding">
        <header className="flow-header"><button onClick={() => setScreen("welcome")}><Icon name="arrow" /></button><Progress step={1} total={3} /><span>1 of 3</span></header>
        <main className="flow-content">
          <span className="step-label">LET’S START WITH YOU</span>
          <h1>What are you into?</h1>
          <p>Pick at least 3. We’ll use these to find activities and people you’ll genuinely enjoy.</p>
          <div className="interest-grid">
            {interests.map(([name, description, symbol]) => (
              <button key={name} className={selectedInterests.includes(name) ? "selected" : ""} onClick={() => chooseInterest(name)}>
                <span className={`interest-symbol ${symbol}`}><Icon name={name === "Sports" ? "star" : name === "Outdoors" ? "compass" : name === "Books" ? "calendar" : name === "Food" ? "heart" : "sparkles"} size={21} /></span>
                <strong>{name}</strong><small>{description}</small>
                <span className="selection-check"><Icon name="check" size={13} /></span>
              </button>
            ))}
          </div>
        </main>
        <div className="bottom-action sticky">
          <div className="selection-count"><strong>{selectedInterests.length}</strong> selected <span>{selectedInterests.length < 3 ? `Pick ${3 - selectedInterests.length} more` : "Looks good"}</span></div>
          <button className="primary-button" disabled={selectedInterests.length < 3} onClick={() => setScreen("quiz")}>Continue <Icon name="chevron" /></button>
        </div>
      </div>
    );
  }

  if (screen === "quiz") {
    const question = questions[quizStep];
    return (
      <div className="phone-shell onboarding">
        <header className="flow-header"><button onClick={() => quizStep ? setQuizStep(quizStep - 1) : setScreen("interests")}><Icon name="arrow" /></button><Progress step={quizStep + 1} total={questions.length} /><span>{quizStep + 1} of {questions.length}</span></header>
        <main className="flow-content quiz-content">
          <span className="step-label"><Icon name="sparkles" size={14} /> YOUR SOCIAL STYLE</span>
          <h1>{question.title}</h1>
          <p>{question.subtitle}</p>
          <div className="answer-list">
            {question.options.map(([title, trait], index) => (
              <button key={title} className={answers[quizStep] === index ? "selected" : ""} onClick={() => chooseAnswer(index)}>
                <span className="radio"><i /></span><span><strong>{title}</strong><small>{trait}</small></span>
              </button>
            ))}
          </div>
          <div className="quiz-note"><Icon name="heart" size={16} /><span>Your answers stay private. We only use them to improve your recommendations.</span></div>
        </main>
        <div className="bottom-action sticky">
          <button className="primary-button" disabled={answers[quizStep] === undefined} onClick={finishQuestion}>{quizStep === questions.length - 1 ? "See my results" : "Next question"} <Icon name="chevron" /></button>
        </div>
      </div>
    );
  }

  if (screen === "result") {
    return (
      <div className="phone-shell onboarding result-screen">
        <header className="simple-header"><Logo /><span>All done</span></header>
        <main className="result-content">
          <div className="result-badge"><Icon name="sparkles" size={34} /><span className="mini-orbit one" /><span className="mini-orbit two" /></div>
          <span className="step-label">YOUR SOCIAL STYLE</span>
          <h1>{personality.name.split(" ")[0]}<br /><em>{personality.name.split(" ").slice(1).join(" ")}</em></h1>
          <p>{personality.description}</p>
          <div className="trait-row">{personality.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          <section className="match-formula">
            <span><Icon name="heart" size={18} /></span>
            <div><strong>How we’ll match you</strong><p>Shared interests + compatible energy + nearby plans</p></div>
          </section>
          <section className="nearby-community">
            <div><div className="mini-avatar peach"><Icon name="racquet" size={17} /></div><div className="mini-avatar sage"><Icon name="trail" size={17} /></div><div className="mini-avatar lilac"><Icon name="dance" size={17} /></div></div>
            <p><strong>18 compatible students</strong><br />are active near Tempe campus</p>
          </section>
        </main>
        <div className="bottom-action">
          <button className="primary-button" onClick={() => setScreen("app")}>Let’s touch grass <Icon name="chevron" /></button>
        </div>
      </div>
    );
  }

  if (event) {
    const isJoined = joined.includes(event.id);
    const hasCarpool = carpoolJoined.includes(event.id);
    return (
      <div className={`phone-shell event-page ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}>
        <div className="event-hero">
          <img src={event.image} alt={event.title} />
          <button className="floating-back" onClick={() => setEvent(null)}><Icon name="arrow" /></button>
          <button className="floating-access" onClick={readPage} aria-label={reading ? "Stop reading event" : "Read event aloud"}><Icon name={reading ? "volume" : "accessibility"} size={18} /></button>
          <button className={`floating-save ${saved.includes(event.id) ? "saved" : ""}`} onClick={() => setSaved((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id])} aria-label={saved.includes(event.id) ? "Remove saved activity" : "Save activity"}><Icon name="heart" filled={saved.includes(event.id)} /></button>
          <span className="hero-match"><Icon name="sparkles" size={14} /> {event.match}% match</span>
        </div>
        <main className="event-content">
          <span className="event-type"><i><Icon name={event.activityIcon} size={15} /></i>{event.type}</span>
          <h1>{event.title}</h1>
          <div className="event-facts">
            <div><span><Icon name="calendar" size={19} /></span><p><strong>{event.time}</strong><small>Add to calendar</small></p></div>
            <div><span><Icon name="location" size={19} /></span><p><strong>{event.place} · {event.distance}</strong><small>Verified public location</small></p></div>
          </div>
          <section className="why-match"><span><Icon name="sparkles" size={17} /></span><div><strong>Why this fits you</strong><p>You and this group share <b>{event.type}</b>, prefer smaller gatherings, and enjoy low-pressure plans.</p></div></section>
          <div className="event-detail-tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <section className="group-preview">
            <div className="section-heading"><div><h2>Meet the group</h2><p>2 of 4 verified students joined</p></div><span>{event.spots} spots left</span></div>
            <div className="member-list">
              <div><div className="mini-avatar peach">{event.host[0]}</div><p><strong>{event.host}</strong><small>Host · 4.9 <Icon name="star" size={10} filled /></small></p><span>96% match</span></div>
              <div><div className="mini-avatar sage">JT</div><p><strong>Jordan</strong><small>Verified student</small></p><span>89% match</span></div>
            </div>
          </section>
          <section className="safety-card"><span><Icon name="check" size={16} /></span><div><strong>Safe to meet</strong><p>Public campus venue · Verified students · Community reporting on</p></div></section>
          <section className="carpool-card">
            <div className="carpool-heading"><span><Icon name="car" size={21} /></span><div><strong>Ride together</strong><p>Save money, lower emissions, and arrive with the group.</p></div><small>2 rides</small></div>
            <div className="carpool-route"><i /><div><strong>Pickup near Memorial Union</strong><p>0.3 mi from you · Leaves 5:05 PM</p></div><span>2 seats</span></div>
            <div className="carpool-privacy"><Icon name="check" size={13} /> Your exact address is never shared. Choose a public pickup point.</div>
            <button className={hasCarpool ? "joined" : ""} onClick={() => setCarpoolJoined((items) => items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id])}>{hasCarpool ? <><Icon name="check" size={16} /> Ride requested</> : <><Icon name="car" size={16} /> Find a carpool</>}</button>
          </section>
        </main>
        <div className="event-action"><div><strong>Free</strong><span>{event.spots} spots available</span></div><button onClick={() => setJoined((items) => items.includes(event.id) ? items : [...items, event.id])}>{isJoined ? <><Icon name="check" size={18} /> You’re going</> : "Join group"}</button></div>
      </div>
    );
  }

  return (
    <div className={`phone-shell app-screen ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}>
      <header className="app-header">
        <div><span className="app-location"><i /> TEMPE CAMPUS <Icon name="chevron" size={13} /></span><h1>{pageTitle}</h1></div>
        <button className={`header-avatar ${profileImage ? "" : "skeleton-avatar"}`} onClick={() => profileInput.current?.click()} aria-label="Add profile picture">{profileImage ? <img src={profileImage} alt="Alex Shah" /> : <><Icon name="user" size={19} /><span /></>}</button>
        <input ref={profileInput} className="visually-hidden" type="file" accept="image/*" onChange={(event) => uploadProfileImage(event.target.files?.[0])} />
      </header>

      <main className="app-content">
        {tab === "discover" && (
          <>
            <label className="search-bar"><Icon name="search" size={19} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search activities or interests" /></label>
            <section className="nearby-alert">
              <span><Icon name="location" /></span><div><small>HAPPENING NEARBY</small><strong>Badminton starts in 2 hours</strong><p>0.4 miles away · 2 spots left</p></div><Icon name="chevron" size={18} />
            </section>
            <div className="section-heading"><div><h2>Picked for you</h2><p>Based on your interests and personality</p></div><button>See all</button></div>
            <div className="event-scroll">
              {visibleEvents.map((item) => (
                <button className="event-card" key={item.id} onClick={() => setEvent(item)}>
                  <div><img src={item.image} alt="" /><span><Icon name="sparkles" size={12} /> {item.match}%</span><i className="activity-icon"><Icon name={item.activityIcon} size={18} /></i></div>
                  <section><small>{item.type}</small><h3>{item.title}</h3><div className="event-tags">{item.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</div><p><Icon name="clock" size={14} /> {item.time}</p><p><Icon name="location" size={14} /> {item.place} · {item.distance}</p><footer><span>{item.spots} spots left</span><i>View</i></footer></section>
                </button>
              ))}
              {!visibleEvents.length && <div className="empty-search"><Icon name="search" /><strong>No nearby activities found</strong><span>Try another interest or activity.</span></div>}
            </div>
            <section className="calendar-nudge" onClick={() => setTab("calendar")}>
              <span><Icon name="calendar" /></span><div><strong>Keep every plan in one place</strong><p>View your schedule and privately sync it with Google Calendar.</p></div><Icon name="chevron" size={17} />
            </section>
          </>
        )}

        {tab === "calendar" && (
          <>
            <section className="calendar-sync-card">
              <div className="google-calendar-mark"><Icon name="calendar" size={21} /></div>
              <div><strong>{calendarSynced ? "Google Calendar connected" : "Sync Google Calendar"}</strong><p>{calendarSynced ? "Your Kin plans are syncing privately." : "Keep your activities and classes together."}</p></div>
              <button className={calendarSynced ? "connected" : ""} onClick={() => setCalendarSynced(!calendarSynced)}>{calendarSynced ? <Icon name="check" size={16} /> : "Connect"}</button>
            </section>
            <section className="privacy-mask">
              <span><Icon name="check" size={17} /></span>
              <div><strong>Privacy mask</strong><p>Kin events appear externally as “Busy — personal activity.” Locations, interests, and attendees stay hidden.</p></div>
              <button className={privateCalendar ? "on" : ""} onClick={() => setPrivateCalendar(!privateCalendar)}><i /></button>
            </section>
            <div className="month-heading"><button><Icon name="arrow" size={17} /></button><h2>October 2026</h2><button><Icon name="chevron" size={17} /></button></div>
            <div className="calendar-week">
              {[["MON","14"],["TUE","15"],["WED","16"],["THU","17"],["FRI","18"],["SAT","19"],["SUN","20"]].map(([day, date]) => <button key={date} className={date === "17" ? "active" : ""}><span>{day}</span><strong>{date}</strong>{date === "17" && <i />}</button>)}
            </div>
            <div className="agenda-heading"><h2>Thursday, October 17</h2><span>2 plans</span></div>
            <div className="agenda-list">
              <button onClick={() => setEvent(events[0])}><time>5:30<small>PM</small></time><span className="agenda-line coral" /><div><span><Icon name={events[0].activityIcon} size={15} /> {events[0].type}</span><strong>{events[0].title}</strong><p>{events[0].place} · {events[0].distance}</p></div><Icon name="chevron" size={17} /></button>
              <button onClick={() => setEvent(events[2])}><time>6:00<small>PM</small></time><span className="agenda-line purple" /><div><span><Icon name={events[2].activityIcon} size={15} /> {events[2].type}</span><strong>{events[2].title}</strong><p>{events[2].place} · {events[2].distance}</p></div><Icon name="chevron" size={17} /></button>
              {hostedPlans.map((plan, index) => <button key={`${plan.title}-${index}`}><time>{plan.time}<small>HOST</small></time><span className="agenda-line green" /><div><span><Icon name="sparkles" size={15} /> {plan.category}</span><strong>{plan.title}</strong><p>{plan.location} · Up to {plan.spots} people</p></div><Icon name="chevron" size={17} /></button>)}
            </div>
            <section className="calendar-privacy-note"><Icon name="check" size={16} /><p><strong>Your schedule is yours.</strong> Other students never see your calendar, class schedule, or unavailable times.</p></section>
          </>
        )}

        {tab === "alerts" && (
          <>
            <section className="notification-toggle">
              <span><Icon name="bell" /></span><div><strong>Nearby alerts</strong><p>Get notified when a great match starts close by.</p></div><button className={alertsEnabled ? "on" : ""} onClick={() => setAlertsEnabled(!alertsEnabled)}><i /></button>
            </section>
            <h2 className="timeline-title">Today</h2>
            <div className="alert-list">
              <button onClick={() => setEvent(events[0])}><span className="alert-symbol coral"><Icon name="location" /></span><div><strong>A 96% match is 0.4 mi away</strong><p>Sunset badminton starts at 5:30 PM. Two spots are still open.</p><small>12 minutes ago</small></div></button>
              <button onClick={() => setEvent(events[1])}><span className="alert-symbol green"><Icon name="people" /></span><div><strong>Noah joined an event you saved</strong><p>You share 3 interests and have compatible social styles.</p><small>1 hour ago</small></div></button>
              <button><span className="alert-symbol yellow"><Icon name="sparkles" /></span><div><strong>5 new recommendations this week</strong><p>Your suggestions improved after completing your personality profile.</p><small>3 hours ago</small></div></button>
            </div>
            <div className="quiet-hours"><Icon name="clock" /><div><strong>Quiet hours</strong><p>No notifications between 10 PM and 8 AM</p></div><Icon name="chevron" /></div>
          </>
        )}

        {tab === "profile" && (
          <>
            <section className="profile-card">
              <button className={`profile-avatar ${profileImage ? "has-image" : "skeleton-avatar"}`} onClick={() => profileInput.current?.click()} aria-label="Upload profile picture">{profileImage ? <img src={profileImage} alt="Alex Shah" /> : "AS"}<span><Icon name="check" size={12} /></span></button><h2>Alex Shah</h2><p>ASU · Verified student</p>
              <div><span><strong>{joined.length}</strong>Plans joined</span><span><strong>4.9</strong>Community rating</span><span><strong>{hostedPlans.length}</strong>Plans hosted</span></div>
            </section>
            <section className="style-card"><span className="step-label">YOUR SOCIAL STYLE</span><h2>{personality.name}</h2><p>You connect best through shared interests in {personality.group}.</p><div className="trait-row">{personality.traits.map((trait) => <span key={trait}>{trait}</span>)}</div><button onClick={() => { setQuizStep(0); setScreen("quiz"); }}>Retake personality check <Icon name="chevron" size={16} /></button></section>
            <section className="profile-section"><h2>Your interests</h2><div className="profile-tags">{selectedInterests.map((item) => <span key={item}>{item}</span>)}</div><button onClick={() => setScreen("interests")}>Edit interests</button></section>
            <button className="settings-row"><span><Icon name="location" /></span><div><strong>Location & distance</strong><small>Tempe campus · Within 3 miles</small></div><Icon name="chevron" /></button>
            <button className="settings-row" onClick={() => setAccessibilityOpen(true)}><span><Icon name="accessibility" /></span><div><strong>Accessibility & assistance</strong><small>Visual, hearing, and voice preferences</small></div><Icon name="chevron" /></button>
          </>
        )}
      </main>

      <button className="accessibility-fab" onClick={() => setAccessibilityOpen(true)} aria-label="Open accessibility options"><Icon name="accessibility" size={21} /></button>
      <button className="chat-fab" onClick={() => setChatOpen(true)} aria-label="Open help assistant"><span><Icon name="chat" size={23} /></span><small>Need help?</small></button>
      {accessibilityOpen && <div className="accessibility-sheet">
        <header><div><span><Icon name="accessibility" size={20} /></span><div><strong>Accessibility</strong><small>Make Kinlii work for you</small></div></div><button onClick={() => setAccessibilityOpen(false)}>Done</button></header>
        <div className="accessibility-body">
          <button className={`read-page ${reading ? "active" : ""}`} onClick={readPage}><span><Icon name="volume" size={21} /></span><div><strong>{reading ? "Stop reading" : "Read this page aloud"}</strong><p>Listen to all visible text and activity details.</p></div><Icon name="chevron" size={17} /></button>
          <div className="accessibility-option"><span><Icon name="eye" size={20} /></span><div><strong>Visual assistance</strong><p>Larger text, stronger contrast, and spoken content.</p></div><button className={visualSupport ? "on" : ""} onClick={() => { setVisualSupport(!visualSupport); setLargeText(!visualSupport); setHighContrast(!visualSupport); }}><i /></button></div>
          <div className="accessibility-option"><span><Icon name="ear" size={20} /></span><div><strong>Hearing assistance</strong><p>Visual alerts, captions, and text-only host updates.</p></div><button className={hearingSupport ? "on" : ""} onClick={() => setHearingSupport(!hearingSupport)}><i /></button></div>
          <div className="accessibility-option"><span><Icon name="volume" size={20} /></span><div><strong>Large text</strong><p>Increase important text throughout the app.</p></div><button className={largeText ? "on" : ""} onClick={() => setLargeText(!largeText)}><i /></button></div>
          <section className="voice-assistant-card"><span><Icon name="sparkles" size={19} /></span><div><strong>Use with a voice assistant</strong><p>Say “Open Kinlii” with Siri, Google Assistant, or Voice Control. Then ask Kinlii to find an event or read your schedule.</p><button onClick={() => { setAccessibilityOpen(false); setChatOpen(true); setChatReply("Voice mode is ready. Try asking me to read your schedule or find an accessible activity."); }}>Open voice help</button></div></section>
          <p className="preference-privacy"><Icon name="check" size={13} /> Accessibility preferences stay private. If you join an activity, you choose whether to share relevant needs with the host.</p>
        </div>
      </div>}
      {chatOpen && <div className="chat-sheet">
        <header><div><span><Icon name="sparkles" size={18} /></span><div><strong>Kin guide</strong><small>Here to help</small></div></div><button onClick={() => setChatOpen(false)}>Close</button></header>
        <div className="chat-body"><div className="assistant-bubble">{chatReply}</div><div className="chat-prompts"><button onClick={() => sendChat("Find an activity")}>Find an activity</button><button onClick={() => sendChat("Help with my calendar")}>Plan my calendar</button><button onClick={() => sendChat("How do I stay safe?")}>Safety help</button></div></div>
        <div className="chat-composer"><input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendChat()} placeholder="Ask Kin anything..." /><button onClick={() => sendChat()}><Icon name="chevron" /></button></div>
      </div>}
      {createOpen && <div className="create-sheet">
        <header><div><span><Icon name="calendar" size={20} /></span><div><strong>Host an activity</strong><small>Bring a small group together</small></div></div><button onClick={() => setCreateOpen(false)}>Cancel</button></header>
        <div className="create-body">
          <div className="create-intro"><span><Icon name="sparkles" size={17} /></span><p>We check for similar nearby plans as you type, so students find one strong group instead of several half-full ones.</p></div>
          <label className="create-field"><span>What do you want to do?</span><input value={createForm.title} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} placeholder="e.g. Sunset badminton" /></label>
          <div className="create-grid">
            <label className="create-field"><span>Activity</span><select value={createForm.category} onChange={(event) => setCreateForm({ ...createForm, category: event.target.value })}><option value="">Choose one</option><option>Sports</option><option>Outdoors</option><option>Creative</option><option>Games</option><option>Music</option><option>Study</option></select></label>
            <label className="create-field"><span>Group size</span><select value={createForm.spots} onChange={(event) => setCreateForm({ ...createForm, spots: event.target.value })}><option value="4">Up to 4</option><option value="5">Up to 5</option><option value="6">Up to 6</option></select></label>
            <label className="create-field"><span>Day</span><select value={createForm.date} onChange={(event) => setCreateForm({ ...createForm, date: event.target.value })}><option value="">Select day</option><option>Today</option><option>Tomorrow</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></label>
            <label className="create-field"><span>Time</span><input type="time" value={createForm.time} onChange={(event) => setCreateForm({ ...createForm, time: event.target.value })} /></label>
          </div>
          <label className="create-field"><span>Public meeting place</span><div className="location-input"><Icon name="location" size={17} /><input value={createForm.location} onChange={(event) => setCreateForm({ ...createForm, location: event.target.value })} placeholder="Campus building or public venue" /></div></label>
          {similarEvent && <section className="duplicate-warning">
            <div className="duplicate-title"><span><Icon name="people" size={18} /></span><div><strong>A similar event already exists nearby</strong><p>Joining forces helps the group fill and prevents double booking.</p></div></div>
            <button onClick={() => { setCreateOpen(false); setEvent(similarEvent); }}><img src={similarEvent.image} alt="" /><div><small>{similarEvent.distance} away · {similarEvent.time}</small><strong>{similarEvent.title}</strong><span>{similarEvent.spots} spots still open</span></div><Icon name="chevron" size={17} /></button>
            <p>Try a different time or activity to create a new event.</p>
          </section>}
          <button className="publish-button" disabled={!createForm.title || !createForm.category || !createForm.date || !createForm.time || !createForm.location || !!similarEvent} onClick={publishEvent}>{similarEvent ? "Similar activity found" : "Publish activity"} <Icon name="chevron" size={17} /></button>
          <p className="host-safety"><Icon name="check" size={13} /> Events must use public venues and follow Kinlii’s student safety guidelines.</p>
        </div>
      </div>}

      <nav className="bottom-nav">
        <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}><span><Icon name="home" size={21} /></span>Discover</button>
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}><span><Icon name="calendar" size={21} /></span>Calendar</button>
        <button className="create-nav" onClick={() => setCreateOpen(true)} aria-label="Create an activity"><span><b>+</b></span>Host</button>
        <button className={tab === "alerts" ? "active" : ""} onClick={() => setTab("alerts")}><span><Icon name="bell" size={21} /><i /></span>Alerts</button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><span><Icon name="user" size={21} /></span>Profile</button>
      </nav>
    </div>
  );
}
