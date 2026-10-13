import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./components/ui/Icon";
import { EventDetailsScreen } from "./screens/events/EventDetailsScreen";
import {
  AlertsScreen,
  CalendarScreen,
  DiscoverScreen,
  ProfileScreen,
} from "./screens/main/MainTabScreens";
import {
  InterestSelectionScreen,
  PersonalityQuizScreen,
  PersonalityResultScreen,
  ProfileSetupScreen,
  VerificationScreen,
  WelcomeScreen,
} from "./screens/onboarding/OnboardingScreens";
import { events, questions } from "./data/kinliiData";
import { usePersistentState } from "./hooks/usePersistentState";
import { useAuthSession } from "./hooks/useAuthSession";
import { sendSignInCode, signOut, verifySignInCode } from "./repositories/authRepository";
import { hasSupabaseConfig } from "./lib/supabase";
import {
  completeOnboarding,
  getProfile,
  updateProfile,
  type UserProfile,
} from "./repositories/profileRepository";
import { communityAssistant } from "./services/communityAssistant";
import { findSimilarEvents } from "./services/duplicateEventService";

import type { Screen, Tab } from "./app/types";

export type HostedPlan = {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  spots: string;
};

export type LeaveRecord = {
  eventId: number;
  reason: string;
  leftAt: string;
};

type AssistantAction = {
  type: string;
  gatheringIds?: number[];
  draft?: {
    title?: string;
    category?: string;
    day?: string;
    location?: string;
  };
};

export default function App() {
  const { session, loading: sessionLoading } = useAuthSession();
  const [screen, setScreen] = usePersistentState("kinlii:screen", "welcome" as Screen);
  const [selectedInterests, setSelectedInterests] = usePersistentState("kinlii:interests", [
    "Outdoors",
    "Sports",
  ] as string[]);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = usePersistentState("kinlii:personality-answers", [] as number[]);
  const [tab, setTab] = useState<Tab>("discover");
  const [event, setEvent] = useState<(typeof events)[number] | null>(null);
  const [joined, setJoined] = usePersistentState("kinlii:joined", [] as number[]);
  const [remainingSpots, setRemainingSpots] = usePersistentState(
    "kinlii:remaining-spots",
    Object.fromEntries(events.map((item) => [item.id, item.spots])) as Record<number, number>,
  );
  const [, setLeaveRecords] = usePersistentState("kinlii:leave-records", [] as LeaveRecord[]);
  const [saved, setSaved] = usePersistentState("kinlii:saved", [] as number[]);
  const [alertsEnabled, setAlertsEnabled] = usePersistentState("kinlii:nearby-alerts", true);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [bio, setBio] = useState("");
  const [calendarSynced, setCalendarSynced] = usePersistentState(
    "kinlii:calendar-connected",
    false,
  );
  const [privateCalendar, setPrivateCalendar] = usePersistentState("kinlii:calendar-private", true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState(
    "Hi Alex. Need help finding an activity, planning your week, or staying safe?",
  );
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [largeText, setLargeText] = usePersistentState("kinlii:large-text", false);
  const [highContrast, setHighContrast] = usePersistentState("kinlii:high-contrast", false);
  const [hearingSupport, setHearingSupport] = usePersistentState("kinlii:hearing-support", false);
  const [visualSupport, setVisualSupport] = usePersistentState("kinlii:visual-support", false);
  const [reading, setReading] = useState(false);
  const [carpoolJoined, setCarpoolJoined] = usePersistentState(
    "kinlii:carpool-requests",
    [] as number[],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [hostedPlans, setHostedPlans] = usePersistentState("kinlii:hosted", [] as HostedPlan[]);
  const [createForm, setCreateForm] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    location: "",
    spots: "4",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = usePersistentState("kinlii:profile-image", "");
  const profileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setProfile(null);
      if (!["welcome", "verify"].includes(screen)) setScreen("welcome");
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError("");

    void getProfile(session.user.id)
      .then((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setDisplayName(nextProfile.displayName);
        setUniversityName(nextProfile.universityName);
        setBio(nextProfile.bio);
        setScreen(nextProfile.onboardingCompleted ? "app" : "profile-setup");
      })
      .catch((error) => {
        if (!active) return;
        setProfileError(
          error instanceof Error ? error.message : "Your profile could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
    // Profile routing should run only when the authenticated account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, sessionLoading]);

  const requestSignInCode = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await sendSignInCode(schoolEmail);
      setCodeSent(true);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Could not send the verification code.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const confirmSignInCode = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const nextSession = await verifySignInCode(schoolEmail, verificationCode);
      if (!nextSession) throw new Error("Verification succeeded, but no session was created.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "That code could not be verified.");
    } finally {
      setAuthLoading(false);
    }
  };

  const saveInitialProfile = async () => {
    if (!session) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const nextProfile = await updateProfile(session.user.id, {
        displayName,
        universityName,
        bio,
      });
      setProfile(nextProfile);
      setScreen("interests");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setProfileLoading(false);
    }
  };

  const finishOnboarding = async () => {
    if (!session) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      await completeOnboarding(session.user.id, selectedInterests);
      setProfile((current) => (current ? { ...current, onboardingCompleted: true } : current));
      setScreen("app");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Onboarding could not be completed.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError("");
    try {
      await signOut();
      setCodeSent(false);
      setVerificationCode("");
      setScreen("welcome");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign out.");
    }
  };

  const chooseInterest = (name: string) => {
    setSelectedInterests((items) =>
      items.includes(name) ? items.filter((item) => item !== name) : [...items, name],
    );
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

  const pageTitle = useMemo(
    () =>
      ({
        discover: "Near you",
        calendar: "Your calendar",
        alerts: "Activity alerts",
        profile: "Your profile",
      })[tab],
    [tab],
  );

  const sendChat = async (message = chatMessage) => {
    if (!message.trim()) return;
    setChatMessage("");
    setChatReply("Looking for the best next step…");
    try {
      const response = await communityAssistant.respond({
        history: [{ role: "user", content: message }],
        gatherings: events.map((item) => ({
          ...item,
          category: item.type,
          day: item.time,
          dateKey: item.time.startsWith("Today")
            ? "today"
            : item.time.startsWith("Tomorrow")
              ? "tomorrow"
              : "weekend",
          period: item.time.includes("AM") ? "morning" : "evening",
          attendees: 4 - (remainingSpots[item.id] ?? item.spots),
          capacity: 4,
          newcomers: true,
          instantJoin: true,
        })),
      });
      setChatReply(response.text);
      const action = response.actions?.[0] as AssistantAction | undefined;
      if (action?.type === "calendar_summary") setTab("calendar");
      const recommendedEventId = action?.gatheringIds?.[0];
      if (action?.type === "gathering_recommendations" && recommendedEventId)
        setEvent(events.find((item) => item.id === recommendedEventId) || null);
      if (
        (action?.type === "gathering_draft" || action?.type === "create_gathering") &&
        action.draft
      ) {
        const draft = action.draft;
        setCreateForm((form) => ({
          ...form,
          title: draft.title || "",
          category: draft.category?.includes("Sports") ? "Sports" : draft.category || "",
          date: draft.day === "Date not selected" ? "" : draft.day || "",
          time: "",
          location: draft.location || "",
        }));
        setCreateOpen(true);
      }
    } catch {
      setChatReply(
        "I couldn’t complete that request just now. Try asking for an activity, your schedule, safety help, or a ride.",
      );
    }
  };

  const readPage = () => {
    if (!("speechSynthesis" in window)) return;
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const text =
      document.querySelector(".phone-shell main")?.textContent || "Kinlii accessibility reader";
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
    if (energetic && organized)
      return {
        name: "Warm Organizer",
        description:
          "You enjoy bringing people together and feel best when everyone knows the plan and feels included.",
        traits: ["Welcoming", "Dependable", "Community-minded"],
        group: "friendly, well-planned groups of 4–6",
      };
    if (energetic)
      return {
        name: "Social Adventurer",
        description:
          "You gain energy from people and new experiences, especially when plans leave room for spontaneity.",
        traits: ["Outgoing", "Playful", "Open-minded"],
        group: "energetic, flexible groups of 4–6",
      };
    if (organized)
      return {
        name: "Thoughtful Planner",
        description:
          "You build strong connections when plans feel clear, comfortable, and centered on meaningful conversation.",
        traits: ["Intentional", "Prepared", "Supportive"],
        group: "calm, organized groups of 3–5",
      };
    return {
      name: "Calm Explorer",
      description:
        "You’re curious and open to new experiences, but connect best in relaxed groups with little social pressure.",
      traits: ["Curious", "Reflective", "Low-pressure"],
      group: "relaxed, interest-led groups of 3–5",
    };
  }, [answers]);

  const similarEvent = useMemo(() => {
    if (!createForm.category || !createForm.date || !createForm.time || !createForm.location)
      return null;
    const schedules: Record<number, string> = { 1: "Today", 2: "Tomorrow", 3: "Friday" };
    return (
      findSimilarEvents({
        title: createForm.title,
        category: createForm.category,
        startsAt: createForm.date,
        latitude: 33.424,
        longitude: -111.94,
        radiusMiles: 3,
        existingEvents: events.map((item) => ({
          ...item,
          category: item.type,
          day: schedules[item.id],
          startsAt: schedules[item.id],
          latitude: 33.424,
          longitude: -111.94,
          attendees: 4 - item.spots,
          capacity: 4,
        })),
      }) || null
    );
  }, [createForm]);

  const availableEvents = useMemo(
    () =>
      events
        .map((item) => ({
          ...item,
          spots: remainingSpots[item.id] ?? item.spots,
        }))
        .filter((item) => item.spots > 0),
    [remainingSpots],
  );

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableEvents;
    return availableEvents.filter((item) =>
      [item.title, item.type, item.place, ...item.tags].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [availableEvents, searchQuery]);

  const joinEvent = (eventId: number) => {
    if (joined.includes(eventId)) return;
    const sourceEvent = events.find((item) => item.id === eventId);
    const spots = remainingSpots[eventId] ?? sourceEvent?.spots ?? 0;
    if (spots <= 0) return;

    setJoined((items) => [...items, eventId]);
    setRemainingSpots((current) => ({
      ...current,
      [eventId]: Math.max(0, spots - 1),
    }));
  };

  const leaveEvent = (eventId: number, reason: string) => {
    if (!joined.includes(eventId) || !reason.trim()) return;
    const sourceEvent = events.find((item) => item.id === eventId);
    const initialSpots = sourceEvent?.spots ?? 0;

    setJoined((items) => items.filter((id) => id !== eventId));
    setRemainingSpots((current) => ({
      ...current,
      [eventId]: Math.min(initialSpots, (current[eventId] ?? initialSpots) + 1),
    }));
    setLeaveRecords((records) => [
      ...records,
      { eventId, reason: reason.trim(), leftAt: new Date().toISOString() },
    ]);
  };

  const uploadProfileImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const publishEvent = () => {
    if (
      !createForm.title ||
      !createForm.category ||
      !createForm.date ||
      !createForm.time ||
      !createForm.location ||
      similarEvent
    )
      return;
    setHostedPlans((plans) => [...plans, createForm]);
    setCreateOpen(false);
    setCreateForm({ title: "", category: "", date: "", time: "", location: "", spots: "4" });
    setTab("calendar");
  };

  if (sessionLoading || (session && profileLoading && !profile)) {
    return <div className="phone-shell auth-loading-screen" aria-label="Loading Kinlii" />;
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="phone-shell auth-configuration-error">
        <h1>Kinlii needs configuration</h1>
        <p>The Supabase environment variables are missing from this deployment.</p>
      </div>
    );
  }

  if (!session && screen !== "verify") {
    return <WelcomeScreen setScreen={setScreen} />;
  }

  if (!session && screen === "verify") {
    return (
      <VerificationScreen
        authError={authError}
        authLoading={authLoading}
        codeSent={codeSent}
        onSendCode={requestSignInCode}
        onVerifyCode={confirmSignInCode}
        schoolEmail={schoolEmail}
        setCodeSent={setCodeSent}
        setSchoolEmail={setSchoolEmail}
        setScreen={setScreen}
        setVerificationCode={setVerificationCode}
        verificationCode={verificationCode}
      />
    );
  }

  if (session && profileError && !profile) {
    return (
      <div className="phone-shell auth-configuration-error">
        <h1>We couldn’t load your profile</h1>
        <p>{profileError}</p>
        <button className="primary-button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (screen === "profile-setup") {
    return (
      <ProfileSetupScreen
        bio={bio}
        displayName={displayName}
        error={profileError}
        loading={profileLoading}
        onContinue={saveInitialProfile}
        setBio={setBio}
        setDisplayName={setDisplayName}
        setUniversityName={setUniversityName}
        universityName={universityName}
      />
    );
  }

  if (screen === "interests") {
    return (
      <InterestSelectionScreen
        chooseInterest={chooseInterest}
        selectedInterests={selectedInterests}
        setScreen={setScreen}
      />
    );
  }

  if (screen === "quiz") {
    return (
      <PersonalityQuizScreen
        answers={answers}
        chooseAnswer={chooseAnswer}
        finishQuestion={finishQuestion}
        quizStep={quizStep}
        setQuizStep={setQuizStep}
        setScreen={setScreen}
      />
    );
  }

  if (screen === "result") {
    return (
      <PersonalityResultScreen
        personality={personality}
        completing={profileLoading}
        completionError={profileError}
        onComplete={finishOnboarding}
      />
    );
  }

  if (event) {
    const selectedEvent = {
      ...event,
      spots: remainingSpots[event.id] ?? event.spots,
    };
    return (
      <EventDetailsScreen
        event={selectedEvent}
        joined={joined}
        saved={saved}
        carpoolJoined={carpoolJoined}
        largeText={largeText}
        highContrast={highContrast}
        reading={reading}
        readPage={readPage}
        setEvent={setEvent}
        onJoin={joinEvent}
        onLeave={leaveEvent}
        setSaved={setSaved}
        setCarpoolJoined={setCarpoolJoined}
      />
    );
  }

  return (
    <div
      className={`phone-shell app-screen ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}
    >
      <header className="app-header">
        <div>
          <span className="app-location">
            <i /> TEMPE CAMPUS <Icon name="chevron" size={13} />
          </span>
          <h1>{pageTitle}</h1>
        </div>
        <button
          className={`header-avatar ${profileImage ? "" : "skeleton-avatar"}`}
          onClick={() => profileInput.current?.click()}
          aria-label="Add profile picture"
        >
          {profileImage ? (
            <img src={profileImage} alt="Alex Shah" />
          ) : (
            <>
              <Icon name="user" size={19} />
              <span />
            </>
          )}
        </button>
        <input
          ref={profileInput}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(event) => uploadProfileImage(event.target.files?.[0])}
        />
      </header>

      <main className="app-content">
        {tab === "discover" && (
          <DiscoverScreen
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            visibleEvents={visibleEvents}
            setEvent={setEvent}
            setTab={setTab}
          />
        )}
        {tab === "calendar" && (
          <CalendarScreen
            calendarSynced={calendarSynced}
            setCalendarSynced={setCalendarSynced}
            privateCalendar={privateCalendar}
            setPrivateCalendar={setPrivateCalendar}
            hostedPlans={hostedPlans}
            setEvent={setEvent}
          />
        )}
        {tab === "alerts" && (
          <AlertsScreen
            alertsEnabled={alertsEnabled}
            setAlertsEnabled={setAlertsEnabled}
            setEvent={setEvent}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            accountEmail={session?.user.email ?? ""}
            displayName={profile?.displayName || displayName}
            universityName={profile?.universityName || universityName}
            profileImage={profileImage}
            profileInput={profileInput}
            joinedCount={joined.length}
            hostedCount={hostedPlans.length}
            personality={personality}
            selectedInterests={selectedInterests}
            setQuizStep={setQuizStep}
            setScreen={setScreen}
            setAccessibilityOpen={setAccessibilityOpen}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      <button
        className="accessibility-fab"
        onClick={() => setAccessibilityOpen(true)}
        aria-label="Open accessibility options"
      >
        <Icon name="accessibility" size={21} />
      </button>
      <button
        className="chat-fab"
        onClick={() => setChatOpen(true)}
        aria-label="Open help assistant"
      >
        <span>
          <Icon name="chat" size={23} />
        </span>
        <small>Need help?</small>
      </button>
      {accessibilityOpen && (
        <div className="accessibility-sheet">
          <header>
            <div>
              <span>
                <Icon name="accessibility" size={20} />
              </span>
              <div>
                <strong>Accessibility</strong>
                <small>Make Kinlii work for you</small>
              </div>
            </div>
            <button onClick={() => setAccessibilityOpen(false)}>Done</button>
          </header>
          <div className="accessibility-body">
            <button className={`read-page ${reading ? "active" : ""}`} onClick={readPage}>
              <span>
                <Icon name="volume" size={21} />
              </span>
              <div>
                <strong>{reading ? "Stop reading" : "Read this page aloud"}</strong>
                <p>Listen to all visible text and activity details.</p>
              </div>
              <Icon name="chevron" size={17} />
            </button>
            <div className="accessibility-option">
              <span>
                <Icon name="eye" size={20} />
              </span>
              <div>
                <strong>Visual assistance</strong>
                <p>Larger text, stronger contrast, and spoken content.</p>
              </div>
              <button
                className={visualSupport ? "on" : ""}
                onClick={() => {
                  setVisualSupport(!visualSupport);
                  setLargeText(!visualSupport);
                  setHighContrast(!visualSupport);
                }}
              >
                <i />
              </button>
            </div>
            <div className="accessibility-option">
              <span>
                <Icon name="ear" size={20} />
              </span>
              <div>
                <strong>Hearing assistance</strong>
                <p>Visual alerts, captions, and text-only host updates.</p>
              </div>
              <button
                className={hearingSupport ? "on" : ""}
                onClick={() => setHearingSupport(!hearingSupport)}
              >
                <i />
              </button>
            </div>
            <div className="accessibility-option">
              <span>
                <Icon name="volume" size={20} />
              </span>
              <div>
                <strong>Large text</strong>
                <p>Increase important text throughout the app.</p>
              </div>
              <button className={largeText ? "on" : ""} onClick={() => setLargeText(!largeText)}>
                <i />
              </button>
            </div>
            <section className="voice-assistant-card">
              <span>
                <Icon name="sparkles" size={19} />
              </span>
              <div>
                <strong>Use with a voice assistant</strong>
                <p>
                  Say “Open Kinlii” with Siri, Google Assistant, or Voice Control. Then ask Kinlii
                  to find an event or read your schedule.
                </p>
                <button
                  onClick={() => {
                    setAccessibilityOpen(false);
                    setChatOpen(true);
                    setChatReply(
                      "Voice mode is ready. Try asking me to read your schedule or find an accessible activity.",
                    );
                  }}
                >
                  Open voice help
                </button>
              </div>
            </section>
            <p className="preference-privacy">
              <Icon name="check" size={13} /> Accessibility preferences stay private. If you join an
              activity, you choose whether to share relevant needs with the host.
            </p>
          </div>
        </div>
      )}
      {chatOpen && (
        <div className="chat-sheet">
          <header>
            <div>
              <span>
                <Icon name="sparkles" size={18} />
              </span>
              <div>
                <strong>Kin guide</strong>
                <small>Here to help</small>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)}>Close</button>
          </header>
          <div className="chat-body">
            <div className="assistant-bubble">{chatReply}</div>
            <div className="chat-prompts">
              <button onClick={() => sendChat("Find an activity")}>Find an activity</button>
              <button onClick={() => sendChat("Help with my calendar")}>Plan my calendar</button>
              <button onClick={() => sendChat("How do I stay safe?")}>Safety help</button>
            </div>
          </div>
          <div className="chat-composer">
            <input
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendChat()}
              placeholder="Ask Kin anything..."
            />
            <button onClick={() => sendChat()}>
              <Icon name="chevron" />
            </button>
          </div>
        </div>
      )}
      {createOpen && (
        <div className="create-sheet">
          <header>
            <div>
              <span>
                <Icon name="calendar" size={20} />
              </span>
              <div>
                <strong>Host an activity</strong>
                <small>Bring a small group together</small>
              </div>
            </div>
            <button onClick={() => setCreateOpen(false)}>Cancel</button>
          </header>
          <div className="create-body">
            <div className="create-intro">
              <span>
                <Icon name="sparkles" size={17} />
              </span>
              <p>
                We check for similar nearby plans as you type, so students find one strong group
                instead of several half-full ones.
              </p>
            </div>
            <label className="create-field">
              <span>What do you want to do?</span>
              <input
                value={createForm.title}
                onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })}
                placeholder="e.g. Sunset badminton"
              />
            </label>
            <div className="create-grid">
              <label className="create-field">
                <span>Activity</span>
                <select
                  value={createForm.category}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, category: event.target.value })
                  }
                >
                  <option value="">Choose one</option>
                  <option>Sports</option>
                  <option>Outdoors</option>
                  <option>Creative</option>
                  <option>Games</option>
                  <option>Music</option>
                  <option>Study</option>
                </select>
              </label>
              <label className="create-field">
                <span>Group size</span>
                <select
                  value={createForm.spots}
                  onChange={(event) => setCreateForm({ ...createForm, spots: event.target.value })}
                >
                  <option value="4">Up to 4</option>
                  <option value="5">Up to 5</option>
                  <option value="6">Up to 6</option>
                </select>
              </label>
              <label className="create-field">
                <span>Day</span>
                <select
                  value={createForm.date}
                  onChange={(event) => setCreateForm({ ...createForm, date: event.target.value })}
                >
                  <option value="">Select day</option>
                  <option>Today</option>
                  <option>Tomorrow</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </label>
              <label className="create-field">
                <span>Time</span>
                <input
                  type="time"
                  value={createForm.time}
                  onChange={(event) => setCreateForm({ ...createForm, time: event.target.value })}
                />
              </label>
            </div>
            <label className="create-field">
              <span>Public meeting place</span>
              <div className="location-input">
                <Icon name="location" size={17} />
                <input
                  value={createForm.location}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, location: event.target.value })
                  }
                  placeholder="Campus building or public venue"
                />
              </div>
            </label>
            {similarEvent && (
              <section className="duplicate-warning">
                <div className="duplicate-title">
                  <span>
                    <Icon name="people" size={18} />
                  </span>
                  <div>
                    <strong>A similar event already exists nearby</strong>
                    <p>Joining forces helps the group fill and prevents double booking.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreateOpen(false);
                    setEvent(similarEvent);
                  }}
                >
                  <img src={similarEvent.image} alt="" />
                  <div>
                    <small>
                      {similarEvent.distance} away · {similarEvent.time}
                    </small>
                    <strong>{similarEvent.title}</strong>
                    <span>{similarEvent.spots} spots still open</span>
                  </div>
                  <Icon name="chevron" size={17} />
                </button>
                <p>Try a different time or activity to create a new event.</p>
              </section>
            )}
            <button
              className="publish-button"
              disabled={
                !createForm.title ||
                !createForm.category ||
                !createForm.date ||
                !createForm.time ||
                !createForm.location ||
                !!similarEvent
              }
              onClick={publishEvent}
            >
              {similarEvent ? "Similar activity found" : "Publish activity"}{" "}
              <Icon name="chevron" size={17} />
            </button>
            <p className="host-safety">
              <Icon name="check" size={13} /> Events must use public venues and follow Kinlii’s
              student safety guidelines.
            </p>
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}>
          <span>
            <Icon name="home" size={21} />
          </span>
          Discover
        </button>
        <button className={tab === "calendar" ? "active" : ""} onClick={() => setTab("calendar")}>
          <span>
            <Icon name="calendar" size={21} />
          </span>
          Calendar
        </button>
        <button
          className="create-nav"
          onClick={() => setCreateOpen(true)}
          aria-label="Create an activity"
        >
          <span>
            <b>+</b>
          </span>
          Host
        </button>
        <button className={tab === "alerts" ? "active" : ""} onClick={() => setTab("alerts")}>
          <span>
            <Icon name="bell" size={21} />
            <i />
          </span>
          Alerts
        </button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
          <span>
            <Icon name="user" size={21} />
          </span>
          Profile
        </button>
      </nav>
    </div>
  );
}
