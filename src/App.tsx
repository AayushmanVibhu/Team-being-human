import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./components/ui/Icon";
import { Logo } from "./components/ui/Branding";
import { EventDetailsScreen } from "./screens/events/EventDetailsScreen";
import {
  AlertsScreen,
  CalendarScreen,
  DiscoverScreen,
  ProfileScreen,
} from "./screens/main/MainTabScreens";
import {
  InterestSelectionScreen,
  ForgotPasswordScreen,
  LoginScreen,
  PasswordSetupScreen,
  PersonalityQuizScreen,
  PersonalityResultScreen,
  ProfileSetupScreen,
  VerificationScreen,
} from "./screens/onboarding/OnboardingScreens";
import { questions, type EventId, type KinliiEvent } from "./data/kinliiData";
import { usePersistentState } from "./hooks/usePersistentState";
import { useAuthSession } from "./hooks/useAuthSession";
import {
  sendSignInCode,
  sendPasswordReset,
  setAccountPassword,
  signInWithPassword,
  signOut,
  verifySignInCode,
} from "./repositories/authRepository";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import {
  completeOnboarding,
  getProfileInterests,
  getProfile,
  markPasswordSet,
  uploadProfileAvatar,
  updateProfile,
  updateProfilePreferences,
  type UserProfile,
} from "./repositories/profileRepository";
import { getAdminMetrics, type AdminMetrics } from "./repositories/adminRepository";
import { communityAssistant } from "./services/communityAssistant";
import { findSimilarEvents } from "./services/duplicateEventService";
import {
  createEvent,
  cancelEvent,
  joinEvent as joinDatabaseEvent,
  leaveEvent as leaveDatabaseEvent,
  listAvailableEvents,
  listEventCatalog,
  listMyJoinedEventIds,
  listMySavedEventIds,
  saveEvent,
  unsaveEvent,
  updateEvent,
} from "./repositories/eventRepository";
import {
  resolveEventStart,
  resolveRecurringEventStart,
  toKinliiEvent,
} from "./services/eventAdapter";

import type { Screen, Tab } from "./app/types";

type AssistantAction = {
  type: string;
  gatheringIds?: string[];
  draft?: {
    title?: string;
    category?: string;
    day?: string;
    location?: string;
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    if (message) return message;
  }
  return fallback;
}

export default function App() {
  const { session, loading: sessionLoading, passwordRecovery } = useAuthSession();
  const [screen, setScreen] = usePersistentState("kinlii:screen", "login" as Screen);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [tab, setTab] = useState<Tab>("discover");
  const [event, setEvent] = useState<KinliiEvent | null>(null);
  const [joined, setJoined] = useState<EventId[]>([]);
  const [saved, setSaved] = useState<EventId[]>([]);
  const [alertsEnabled, setAlertsEnabled] = usePersistentState("kinlii:nearby-alerts", true);
  const [schoolEmail, setSchoolEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [bio, setBio] = useState("");
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
  const [createOpen, setCreateOpen] = useState(false);
  const [realEvents, setRealEvents] = useState<KinliiEvent[]>([]);
  const [hostedEvents, setHostedEvents] = useState<KinliiEvent[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<KinliiEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<KinliiEvent[]>([]);
  const [eventActionLoading, setEventActionLoading] = useState(false);
  const [eventError, setEventError] = useState("");
  const [publishingEvent, setPublishingEvent] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    location: "",
    spots: "4",
    description: "",
    recurring: false,
    recurrenceDays: [] as number[],
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [pendingProfileImage, setPendingProfileImage] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [profileImageSaving, setProfileImageSaving] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const profileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAuthError("");
  }, [screen]);

  useEffect(() => {
    if (passwordRecovery) setScreen("reset-password");
  }, [passwordRecovery, setScreen]);

  const refreshRealEvents = useCallback(async () => {
    if (!session) return;
    const [feed, catalog, membershipIds, savedIds] = await Promise.all([
      listAvailableEvents(),
      listEventCatalog(),
      listMyJoinedEventIds(),
      listMySavedEventIds(),
    ]);
    setRealEvents(feed.map(toKinliiEvent));
    const mappedCatalog = catalog.map(toKinliiEvent);
    setHostedEvents(mappedCatalog.filter((item) => item.hostId === session.user.id));
    setJoinedEvents(mappedCatalog.filter((item) => membershipIds.includes(item.id)));
    setSavedEvents(mappedCatalog.filter((item) => savedIds.includes(item.id)));
    setJoined(membershipIds);
    setSaved(savedIds);
  }, [session]);

  const refreshAdminMetrics = useCallback(async () => {
    if (!session) return;
    setAdminMetrics(await getAdminMetrics());
  }, [session]);

  useEffect(() => {
    if (!session || !profile?.onboardingCompleted) {
      setAdminMetrics(null);
      return;
    }
    void refreshAdminMetrics().catch(() => setAdminMetrics(null));
  }, [profile?.onboardingCompleted, refreshAdminMetrics, session]);

  useEffect(() => {
    if (!session || !profile?.onboardingCompleted) return;
    void refreshRealEvents().catch((error) =>
      setEventError(error instanceof Error ? error.message : "Events could not be loaded."),
    );

    const client = supabase;
    if (!client) return;
    const channel = client
      .channel("kinlii-event-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        void refreshRealEvents();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_members" }, () => {
        void refreshRealEvents();
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [profile?.onboardingCompleted, refreshRealEvents, session]);

  useEffect(() => {
    if (!session || !profile?.onboardingCompleted) return;
    const preferences = { largeText, highContrast, hearingSupport, visualSupport };
    const timer = window.setTimeout(() => {
      void updateProfilePreferences(session.user.id, preferences).catch((error) =>
        setProfileError(error instanceof Error ? error.message : "Preferences could not be saved."),
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    hearingSupport,
    highContrast,
    largeText,
    profile?.onboardingCompleted,
    session,
    visualSupport,
  ]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setProfile(null);
      if (!["verify", "login"].includes(screen)) setScreen("login");
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError("");

    void Promise.all([getProfile(session.user.id), getProfileInterests(session.user.id)])
      .then(([nextProfile, interestNames]) => {
        if (!active) return;
        setProfile(nextProfile);
        setDisplayName(nextProfile.displayName);
        setUniversityName(nextProfile.universityName);
        setBio(nextProfile.bio);
        setProfileImage(nextProfile.avatarUrl ?? "");
        setSelectedInterests(interestNames);
        setLargeText(Boolean(nextProfile.accessibilityPreferences.largeText));
        setHighContrast(Boolean(nextProfile.accessibilityPreferences.highContrast));
        setHearingSupport(Boolean(nextProfile.accessibilityPreferences.hearingSupport));
        setVisualSupport(Boolean(nextProfile.accessibilityPreferences.visualSupport));
        setScreen(
          passwordRecovery
            ? "reset-password"
            : !nextProfile.passwordSet
              ? "set-password"
              : nextProfile.onboardingCompleted
                ? "app"
                : "profile-setup",
        );
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
  }, [passwordRecovery, session?.user.id, sessionLoading]);

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

  const handlePasswordSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const nextSession = await signInWithPassword(schoolEmail, loginPassword);
      if (!nextSession) throw new Error("Sign-in succeeded, but no session was created.");
      setLoginPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "The email or password could not be verified.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const saveAccountPassword = async () => {
    if (!session || newPassword !== confirmPassword || newPassword.length < 8) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await setAccountPassword(newPassword);
      await markPasswordSet(session.user.id);
      const nextProfile = profile ? { ...profile, passwordSet: true } : profile;
      setProfile(nextProfile);
      setNewPassword("");
      setConfirmPassword("");
      setScreen(nextProfile?.onboardingCompleted ? "app" : "profile-setup");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Your password could not be saved.");
    } finally {
      setAuthLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await sendPasswordReset(schoolEmail);
      setResetEmailSent(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "The reset email could not be sent.");
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

  const saveEditedProfile = async (values: {
    displayName: string;
    universityName: string;
    bio: string;
  }) => {
    if (!session) return;
    setProfileError("");
    try {
      const nextProfile = await updateProfile(session.user.id, values);
      setProfile(nextProfile);
      setDisplayName(nextProfile.displayName);
      setUniversityName(nextProfile.universityName);
      setBio(nextProfile.bio);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Your profile could not be updated.";
      setProfileError(message);
      throw error;
    }
  };

  const finishOnboarding = async () => {
    if (!session) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      await completeOnboarding(session.user.id, selectedInterests, personality);
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
      setLoginPassword("");
      setScreen("login");
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
        gatherings: realEvents.map((item) => ({
          ...item,
          category: item.type,
          day: item.time,
          dateKey: item.time.startsWith("Today")
            ? "today"
            : item.time.startsWith("Tomorrow")
              ? "tomorrow"
              : "weekend",
          period: item.time.includes("AM") ? "morning" : "evening",
          attendees: (item.capacity ?? 0) - item.spots,
          capacity: item.capacity ?? 0,
          newcomers: true,
          instantJoin: true,
        })),
      });
      setChatReply(response.text);
      const action = response.actions?.[0] as AssistantAction | undefined;
      if (action?.type === "calendar_summary") setTab("calendar");
      const recommendedEventId = action?.gatheringIds?.[0];
      if (action?.type === "gathering_recommendations" && recommendedEventId)
        setEvent(realEvents.find((item) => item.id === recommendedEventId) || null);
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
    return (
      findSimilarEvents({
        title: createForm.title,
        category: createForm.category,
        startsAt: createForm.date,
        latitude: 33.424,
        longitude: -111.94,
        radiusMiles: 3,
        existingEvents: realEvents.map((item) => ({
          ...item,
          category: item.type,
          day: item.startsAt,
          startsAt: item.startsAt,
          latitude: 33.424,
          longitude: -111.94,
          attendees: (item.capacity ?? 0) - item.spots,
          capacity: item.capacity ?? 0,
        })),
      }) || null
    );
  }, [createForm, realEvents]);

  const availableEvents = useMemo(() => realEvents.filter((item) => item.spots > 0), [realEvents]);

  const visibleEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableEvents;
    return availableEvents.filter((item) =>
      [item.title, item.type, item.place, ...item.tags].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [availableEvents, searchQuery]);

  const joinEvent = async (eventId: EventId) => {
    if (joined.includes(eventId)) return;
    setEventError("");

    setEventActionLoading(true);
    try {
      const result = await joinDatabaseEvent(eventId);
      setJoined((items) => [...items, eventId]);
      setEvent((current) =>
        current?.id === eventId
          ? { ...current, spots: result.spots_remaining, attendeeCount: result.attendee_count }
          : current,
      );
      await refreshRealEvents();
    } catch (error) {
      setEventError(getErrorMessage(error, "You could not join this event."));
    } finally {
      setEventActionLoading(false);
    }
  };

  const leaveEvent = async (eventId: EventId, reason: string) => {
    if (!joined.includes(eventId) || !reason.trim()) return;
    setEventError("");

    setEventActionLoading(true);
    try {
      const result = await leaveDatabaseEvent(eventId, reason);
      setJoined((items) => items.filter((id) => id !== eventId));
      setEvent((current) =>
        current?.id === eventId
          ? { ...current, spots: result.spots_remaining, attendeeCount: result.attendee_count }
          : current,
      );
      await refreshRealEvents();
    } catch (error) {
      setEventError(getErrorMessage(error, "You could not leave this event."));
      throw error;
    } finally {
      setEventActionLoading(false);
    }
  };

  const toggleSavedEvent = async (eventId: EventId) => {
    setEventActionLoading(true);
    setEventError("");
    try {
      if (saved.includes(eventId)) await unsaveEvent(eventId);
      else await saveEvent(eventId);
      await refreshRealEvents();
    } catch (error) {
      setEventError(getErrorMessage(error, "This event could not be saved."));
    } finally {
      setEventActionLoading(false);
    }
  };

  const uploadProfileImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) {
      setProfileImageError("Choose an image smaller than 10 MB.");
      return;
    }
    setProfileImageError("");
    const reader = new FileReader();
    reader.onload = () => {
      setPendingProfileImage(String(reader.result || ""));
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
    };
    reader.readAsDataURL(file);
  };

  const closePhotoEditor = () => {
    setPendingProfileImage("");
    if (profileInput.current) profileInput.current.value = "";
  };

  const saveCroppedProfileImage = async () => {
    if (!pendingProfileImage) return;

    const image = new Image();
    image.src = pendingProfileImage;
    await image.decode();

    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const scale = coverScale * cropZoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const movableX = Math.max(0, (width - size) / 2);
    const movableY = Math.max(0, (height - size) / 2);
    const x = (size - width) / 2 - (cropX / 100) * movableX;
    const y = (size - height) / 2 - (cropY / 100) * movableY;

    context.drawImage(image, x, y, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob || !session) {
      setProfileImageError("The cropped image could not be saved. Please try again.");
      return;
    }

    setProfileImageError("");
    setProfileImageSaving(true);
    try {
      const avatarUrl = await uploadProfileAvatar(session.user.id, blob);
      setProfileImage(avatarUrl);
      setProfile((current) => (current ? { ...current, avatarUrl } : current));
      closePhotoEditor();
    } catch (error) {
      setProfileImageError(
        error instanceof Error ? error.message : "Your profile photo could not be uploaded.",
      );
    } finally {
      setProfileImageSaving(false);
    }
  };

  const publishEvent = async () => {
    if (
      !createForm.title ||
      !createForm.category ||
      (!createForm.recurring && !createForm.date) ||
      (createForm.recurring && !createForm.recurrenceDays.length) ||
      !createForm.time ||
      !createForm.location
    )
      return;
    if (!session) return;
    setPublishingEvent(true);
    setEventError("");
    try {
      const input = {
        title: createForm.title,
        category: createForm.category,
        startsAt: createForm.recurring
          ? resolveRecurringEventStart(createForm.recurrenceDays, createForm.time)
          : resolveEventStart(createForm.date, createForm.time),
        locationName: createForm.location,
        capacity: Number(createForm.spots),
        description: createForm.description,
        recurrenceDays: createForm.recurring ? createForm.recurrenceDays : [],
      };
      const eventId = editingEventId ?? (await createEvent(input));
      if (editingEventId) await updateEvent(editingEventId, input);
      await refreshRealEvents();
      const createdEvent = (await listAvailableEvents())
        .map(toKinliiEvent)
        .find((item) => item.id === eventId);
      setCreateOpen(false);
      setCreateForm({
        title: "",
        category: "",
        date: "",
        time: "",
        location: "",
        spots: "4",
        description: "",
        recurring: false,
        recurrenceDays: [],
      });
      setEditingEventId(null);
      setTab("discover");
      if (createdEvent) setEvent(createdEvent);
    } catch (error) {
      setEventError(error instanceof Error ? error.message : "The event could not be published.");
    } finally {
      setPublishingEvent(false);
    }
  };

  const beginEditEvent = (item: KinliiEvent) => {
    const starts = new Date(item.startsAt);
    const localDate = new Date(starts.getTime() - starts.getTimezoneOffset() * 60_000);
    setCreateForm({
      title: item.title,
      category: item.type,
      date: localDate.toISOString().slice(0, 10),
      time: localDate.toISOString().slice(11, 16),
      location: item.place,
      spots: String(item.capacity ?? 4),
      description: item.description ?? "",
      recurring: item.recurrenceDays.length > 0,
      recurrenceDays: item.recurrenceDays,
    });
    setEditingEventId(item.id);
    setEvent(null);
    setCreateOpen(true);
  };

  const removeHostedEvent = async (eventId: string) => {
    setEventActionLoading(true);
    try {
      await cancelEvent(eventId);
      setEvent(null);
      await refreshRealEvents();
    } catch (error) {
      setEventError(error instanceof Error ? error.message : "The event could not be cancelled.");
    } finally {
      setEventActionLoading(false);
    }
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

  if (!session && screen === "forgot-password") {
    return (
      <ForgotPasswordScreen
        email={schoolEmail}
        error={authError}
        loading={authLoading}
        sent={resetEmailSent}
        onSend={requestPasswordReset}
        setEmail={setSchoolEmail}
        setScreen={setScreen}
      />
    );
  }

  if (!session && screen !== "verify") {
    return (
      <LoginScreen
        email={schoolEmail}
        error={authError}
        loading={authLoading}
        onSignIn={handlePasswordSignIn}
        password={loginPassword}
        setEmail={setSchoolEmail}
        setPassword={setLoginPassword}
        setScreen={setScreen}
      />
    );
  }

  if (session && screen === "reset-password") {
    return (
      <PasswordSetupScreen
        confirmPassword={confirmPassword}
        error={authError}
        loading={authLoading}
        onSave={saveAccountPassword}
        password={newPassword}
        setConfirmPassword={setConfirmPassword}
        setPassword={setNewPassword}
      />
    );
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

  if (session && screen === "set-password") {
    return (
      <PasswordSetupScreen
        confirmPassword={confirmPassword}
        error={authError}
        loading={authLoading}
        onSave={saveAccountPassword}
        password={newPassword}
        setConfirmPassword={setConfirmPassword}
        setPassword={setNewPassword}
      />
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
    return (
      <EventDetailsScreen
        event={event}
        joined={joined}
        saved={saved}
        largeText={largeText}
        highContrast={highContrast}
        reading={reading}
        readPage={readPage}
        setEvent={setEvent}
        onJoin={joinEvent}
        onLeave={leaveEvent}
        actionError={eventError}
        actionLoading={eventActionLoading}
        onToggleSaved={toggleSavedEvent}
        isHost={event.hostId === session?.user.id}
        onEdit={beginEditEvent}
        onCancel={removeHostedEvent}
      />
    );
  }

  return (
    <div
      className={`phone-shell app-screen ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}
    >
      <header className="app-header">
        <div className="app-header-copy">
          <div className="app-header-brand">
            <Logo />
          </div>
          <div>
            <span className="app-location">
              <i /> {(profile?.universityName || "YOUR CAMPUS").toUpperCase()}{" "}
              <Icon name="chevron" size={13} />
            </span>
            <h1>{pageTitle}</h1>
          </div>
        </div>
        <button
          className={`header-avatar ${profileImage ? "" : "skeleton-avatar"}`}
          onClick={() => profileInput.current?.click()}
          aria-label="Add profile picture"
        >
          {profileImage ? (
            <img src={profileImage} alt={profile?.displayName || "Profile"} />
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

      {profileImageError && (
        <div className="profile-image-toast" role="alert">
          {profileImageError}
        </div>
      )}

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
            hostedPlans={hostedEvents}
            joinedPlans={joinedEvents}
            savedPlans={savedEvents}
            setEvent={setEvent}
          />
        )}
        {tab === "alerts" && (
          <AlertsScreen alertsEnabled={alertsEnabled} setAlertsEnabled={setAlertsEnabled} />
        )}
        {tab === "profile" && (
          <ProfileScreen
            accountEmail={session?.user.email ?? ""}
            displayName={profile?.displayName || displayName}
            universityName={profile?.universityName || universityName}
            bio={profile?.bio || bio}
            profileImage={profileImage}
            profileInput={profileInput}
            joinedCount={joined.length}
            hostedCount={hostedEvents.length}
            savedCount={saved.length}
            personality={personality}
            selectedInterests={selectedInterests}
            setQuizStep={setQuizStep}
            setScreen={setScreen}
            setAccessibilityOpen={setAccessibilityOpen}
            onSignOut={handleSignOut}
            onUpdateProfile={saveEditedProfile}
            adminMetrics={adminMetrics}
            onRefreshAdminMetrics={refreshAdminMetrics}
          />
        )}
      </main>

      {pendingProfileImage && (
        <div className="photo-editor-backdrop" role="dialog" aria-modal="true">
          <section className="photo-editor">
            <header>
              <div>
                <strong>Adjust profile photo</strong>
                <small>Move and zoom until your photo fits the circle.</small>
              </div>
              <button onClick={closePhotoEditor} aria-label="Close photo editor">
                ×
              </button>
            </header>
            <div className="photo-crop-stage">
              <div className="photo-crop-circle">
                <img
                  src={pendingProfileImage}
                  alt="Profile crop preview"
                  style={{
                    objectPosition: `${50 + cropX / 2}% ${50 + cropY / 2}%`,
                    transform: `scale(${cropZoom})`,
                  }}
                />
              </div>
            </div>
            <div className="photo-controls">
              <label>
                Horizontal position
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropX}
                  onChange={(event) => setCropX(Number(event.target.value))}
                />
              </label>
              <label>
                Vertical position
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={cropY}
                  onChange={(event) => setCropY(Number(event.target.value))}
                />
              </label>
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="photo-editor-actions">
              <button className="secondary-button" onClick={closePhotoEditor}>
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={profileImageSaving}
                onClick={() => void saveCroppedProfileImage()}
              >
                {profileImageSaving ? "Uploading…" : "Use photo"}
              </button>
            </div>
          </section>
        </div>
      )}

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
                <strong>{editingEventId ? "Edit activity" : "Host an activity"}</strong>
                <small>Bring a small group together</small>
              </div>
            </div>
            <button
              onClick={() => {
                setCreateOpen(false);
                setEditingEventId(null);
              }}
            >
              Cancel
            </button>
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
                placeholder="e.g. Weekend board games"
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
                <span>Schedule</span>
                <div className="schedule-type-picker">
                  <button
                    type="button"
                    className={!createForm.recurring ? "active" : ""}
                    onClick={() => setCreateForm({ ...createForm, recurring: false })}
                  >
                    One time
                  </button>
                  <button
                    type="button"
                    className={createForm.recurring ? "active" : ""}
                    onClick={() => setCreateForm({ ...createForm, recurring: true })}
                  >
                    Weekly
                  </button>
                </div>
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
            {createForm.recurring ? (
              <fieldset className="recurrence-picker">
                <legend>Repeats every</legend>
                <div>
                  {[
                    [1, "Mon"],
                    [2, "Tue"],
                    [3, "Wed"],
                    [4, "Thu"],
                    [5, "Fri"],
                    [6, "Sat"],
                    [0, "Sun"],
                  ].map(([value, label]) => {
                    const day = Number(value);
                    const selected = createForm.recurrenceDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={selected ? "active" : ""}
                        aria-pressed={selected}
                        onClick={() =>
                          setCreateForm({
                            ...createForm,
                            recurrenceDays: selected
                              ? createForm.recurrenceDays.filter((item) => item !== day)
                              : [...createForm.recurrenceDays, day].sort(),
                          })
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <small>
                  This activity stays discoverable each week until it fills or you cancel it.
                </small>
              </fieldset>
            ) : (
              <label className="create-field">
                <span>Date</span>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(event) => setCreateForm({ ...createForm, date: event.target.value })}
                />
              </label>
            )}
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
            <label className="create-field">
              <span>Description</span>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm({ ...createForm, description: event.target.value })
                }
                placeholder="Tell students what to expect and what to bring"
                rows={4}
              />
            </label>
            {similarEvent && (
              <section className="duplicate-warning">
                <div className="duplicate-title">
                  <span>
                    <Icon name="people" size={18} />
                  </span>
                  <div>
                    <strong>You may also like this nearby event</strong>
                    <p>You can view it or continue publishing your own activity.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreateOpen(false);
                    setEvent(similarEvent);
                  }}
                >
                  <span
                    className={`recommendation-art event-art-${similarEvent.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <Icon name={similarEvent.activityIcon} size={20} />
                  </span>
                  <div>
                    <small>
                      {similarEvent.distance} away · {similarEvent.time}
                    </small>
                    <strong>{similarEvent.title}</strong>
                    <span>{similarEvent.spots} spots still open</span>
                  </div>
                  <Icon name="chevron" size={17} />
                </button>
                <p>This recommendation will not prevent you from creating your event.</p>
              </section>
            )}
            <button
              className="publish-button"
              disabled={
                publishingEvent ||
                !createForm.title ||
                !createForm.category ||
                (!createForm.recurring && !createForm.date) ||
                (createForm.recurring && !createForm.recurrenceDays.length) ||
                !createForm.time ||
                !createForm.location
              }
              onClick={() => void publishEvent()}
            >
              {publishingEvent
                ? "Publishing…"
                : editingEventId
                  ? "Save changes"
                  : "Publish activity"}{" "}
              {!publishingEvent && <Icon name="chevron" size={17} />}
            </button>
            {eventError && (
              <p className="create-error" role="alert">
                {eventError}
              </p>
            )}
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
