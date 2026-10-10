import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Flag,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  User,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { categories, currentUser, gatherings as seed } from "./data/gatherings";
import { communityAssistant } from "./services/communityAssistant";
import Onboarding from "./screens/Onboarding";
import KinliiLogo from "./components/KinliiLogo";
import ProfileImageSkeleton from "./components/ProfileImageSkeleton";
import AccessibilityPanel from "./components/AccessibilityPanel";
import { usePersistentState } from "./hooks/usePersistentState";
import { calendarService } from "./services/calendarService";
import { carpoolService } from "./services/carpoolService";
import { findSimilarEvents } from "./services/duplicateEventService";

const starters = [
  "Find people building side projects",
  "I want to play basketball tonight",
  "Find something social this weekend",
  "I want to meet other musicians",
  "Help me start a study group",
];
const cx = (...v) => v.filter(Boolean).join(" ");
const activityIcons = {
  "Sports & Fitness": "◒",
  "Technology & Building": "⌘",
  Music: "♫",
  Learning: "▤",
  "Arts & Creativity": "✎",
  Volunteering: "♡",
  Social: "◎",
};
const enrich = (g, i) => ({
  ...g,
  tags: [
    g.newcomers ? "Newcomers welcome" : "Experienced group",
    g.instantJoin ? "Instant join" : "Host approval",
  ],
  activityIcon: activityIcons[g.category] || "✦",
  image: `activity-${(i % 5) + 1}`,
  startsAt: g.day,
  endsAt: g.time,
  latitude: 33.42 + i * 0.002,
  longitude: -111.94 + i * 0.002,
  publicLocationName: g.location,
  distance: `${(0.3 + (i % 8) * 0.2).toFixed(1)} mi`,
  hostId: `host-${i}`,
  hostName: g.host.name,
  attendeeIds: g.participants.map((_, n) => `student-${i}-${n}`),
  newcomersWelcome: g.newcomers,
  verifiedOnly: true,
  accessibility:
    i % 3 === 0
      ? "Step-free access; quieter edge seating available"
      : "Ask the host about access needs",
  carpoolEnabled: [
    "basketball-tonight",
    "sunset-walk",
    "volunteer-saturday",
  ].includes(g.id),
  createdAt: "2026-10-01",
  relevance: 96 - (i % 6) * 3,
});
function Avatar({ person, size = "md" }) {
  return (
    <span
      className={cx("avatar", size)}
      style={{ background: person.color }}
      aria-label={person.name}
    >
      {person.initials}
    </span>
  );
}
function Logo() {
  return (
    <button className="logo" aria-label="Kinlii home">
      <KinliiLogo />
    </button>
  );
}
function JoinButton({ g, relation, onJoin, onCancel }) {
  const full = g.attendees >= g.capacity;
  const blocked = g.status === "canceled";
  if (g.id === "preview")
    return (
      <button className="button secondary" disabled>
        Preview
      </button>
    );
  if (relation === "joined")
    return (
      <button className="button secondary" onClick={() => onCancel(g)}>
        <Check size={16} /> Going · Cancel
      </button>
    );
  if (relation === "pending")
    return (
      <button className="button pending" disabled>
        Request pending
      </button>
    );
  return (
    <button
      className="button primary"
      disabled={full || blocked}
      onClick={() => onJoin(g)}
    >
      {blocked
        ? "Canceled"
        : full
          ? "Gathering full"
          : g.instantJoin
            ? "Join them"
            : "Request to join"}
    </button>
  );
}
function ParticipantPreview({ g }) {
  return (
    <div className="participants">
      <div className="avatar-stack">
        {g.participants.slice(0, 4).map((p, i) => (
          <Avatar key={i} person={p} size="sm" />
        ))}
      </div>
      <span>
        <b>{g.host.name}</b>
        {g.attendees > 1
          ? ` + ${g.attendees - 1} ${g.attendees === 2 ? "other" : "others"}`
          : ""}
      </span>
    </div>
  );
}
function Status({ g }) {
  const left = g.capacity - g.attendees;
  return (
    <span className={cx("status", left === 0 && "full")}>
      {left === 0 ? "Full" : `${g.attendees} / ${g.capacity} people`}
    </span>
  );
}
function GatheringCard({
  g,
  relation,
  onOpen,
  onJoin,
  onCancel,
  compact = false,
}) {
  return (
    <article
      className={cx(
        "g-card",
        compact && "compact",
        g.status === "canceled" && "muted",
      )}
      onClick={() => onOpen(g)}
    >
      {!compact && (
        <div className={cx("event-art", g.image)}>
          <span>{g.activityIcon || "✦"}</span>
          <b>{g.relevance || 90}% for you</b>
        </div>
      )}
      <div className="g-card-top">
        <span className="category">{g.category}</span>
        <Status g={g} />
      </div>
      <h3>{g.title}</h3>
      <p className="card-copy">{g.description}</p>
      <div className="facts">
        <span>
          <CalendarDays /> {g.day} · {g.time}
        </span>
        <span>
          <MapPin /> {g.location}
        </span>
      </div>
      <div className="card-people">
        <ParticipantPreview g={g} />
        {g.newcomers && (
          <span className="welcome">
            <HeartHandshake /> Newcomers welcome
          </span>
        )}
      </div>
      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <span>
          {g.capacity - g.attendees}{" "}
          {g.capacity - g.attendees === 1 ? "spot" : "spots"} left
        </span>
        <JoinButton
          g={g}
          relation={relation}
          onJoin={onJoin}
          onCancel={onCancel}
        />
      </div>
    </article>
  );
}
function Header({ view, setView, onCreate, onAssistant }) {
  return (
    <>
      <header className="topbar">
        <Logo />
        <nav>
          {[
            ["explore", "Discover"],
            ["calendar", "Calendar"],
            ["alerts", "Alerts"],
            ["profile", "Profile"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="assistant-link" onClick={onAssistant}>
            <MessageCircle /> Need help?
          </button>
          <button
            className="profile-dot"
            aria-label="Profile"
            onClick={() => setView("profile")}
          >
            <ProfileImageSkeleton />
          </button>
        </div>
      </header>
      <nav className="mobile-nav">
        {[
          ["explore", Compass, "Discover"],
          ["calendar", CalendarDays, "Calendar"],
          ["host", Plus, "Host"],
          ["alerts", Bell, "Alerts"],
          ["profile", User, "Profile"],
        ].map(([id, Icon, label]) => (
          <button
            key={id}
            className={cx(view === id && "active", id === "host" && "host-nav")}
            onClick={() => (id === "host" ? onCreate() : setView(id))}
          >
            <span>
              <Icon />
            </span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
function Explore({
  items,
  relations,
  filters,
  setFilters,
  onOpen,
  onJoin,
  onCancel,
  onCreate,
}) {
  const filtered = useMemo(
    () =>
      items.filter((g) => {
        const q = filters.q.toLowerCase();
        return (
          g.status !== "canceled" &&
          (!q ||
            [g.title, g.description, g.location, g.category].some((x) =>
              x.toLowerCase().includes(q),
            )) &&
          (filters.when === "any" || g.dateKey === filters.when) &&
          (filters.category === "All interests" ||
            g.category === filters.category) &&
          (!filters.spots || g.attendees < g.capacity) &&
          (!filters.instant || g.instantJoin) &&
          (!filters.newcomers || g.newcomers)
        );
      }),
    [items, filters],
  );
  return (
    <main className="page explore-page">
      <section className="explore-intro">
        <div>
          <p className="kicker">Near Tempe</p>
          <h1>What do you want to do?</h1>
          <p>Find a few people nearby, make a plan, and go do it.</p>
        </div>
        <button className="button primary create-shortcut" onClick={onCreate}>
          <Plus /> Start something
        </button>
      </section>
      <button
        className="nearby-alert"
        onClick={() => onOpen(items.find((g) => g.id === "board-games"))}
      >
        <span>
          <Bell />
        </span>
        <div>
          <b>Something nearby</b>
          <small>Board games are starting 0.4 mi away tonight</small>
        </div>
        <ChevronRight />
      </button>
      <div className="search">
        <Search />
        <input
          aria-label="Search gatherings"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="Basketball, study group, side projects…"
        />
      </div>
      <div className="quick-filters">
        {[
          ["any", "Any day"],
          ["today", "Today"],
          ["tomorrow", "Tomorrow"],
          ["weekend", "This weekend"],
        ].map(([v, l]) => (
          <button
            className={filters.when === v ? "active" : ""}
            onClick={() => setFilters({ ...filters, when: v })}
            key={v}
          >
            {l}
          </button>
        ))}
        <select
          aria-label="Interest"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          className={filters.spots ? "active" : ""}
          onClick={() => setFilters({ ...filters, spots: !filters.spots })}
        >
          Available spots
        </button>
        <button
          className={filters.instant ? "active" : ""}
          onClick={() => setFilters({ ...filters, instant: !filters.instant })}
        >
          Instant join
        </button>
      </div>
      <div className="feed-heading">
        <div>
          <h2>A few people are making plans</h2>
          <p>{filtered.length} small gatherings nearby</p>
        </div>
      </div>
      {filtered.length ? (
        <div className="feed">
          {filtered.map((g) => (
            <GatheringCard
              key={g.id}
              g={g}
              relation={relations[g.id]}
              onOpen={onOpen}
              onJoin={onJoin}
              onCancel={onCancel}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Compass />
          <h2>Nothing happening around this yet.</h2>
          <p>Try a nearby interest, or start a small group yourself.</p>
          <button className="button primary" onClick={onCreate}>
            Start something
          </button>
        </div>
      )}
    </main>
  );
}
function Detail({
  g,
  relation,
  onBack,
  onJoin,
  onCancel,
  onReport,
  saved,
  onSave,
  rideStatus,
  onRide,
  onRead,
  onCalendar,
}) {
  if (!g) return null;
  const ride = carpoolService.getForEvent(g.id);
  return (
    <main className="page detail">
      <button className="back" onClick={onBack}>
        <ArrowLeft /> Back to Discover
      </button>
      <div className="event-hero-art">
        <span>{g.activityIcon || "✦"}</span>
        <div>
          <b>{g.category}</b>
          <small>{g.tags?.join(" · ") || "Small group activity"}</small>
        </div>
      </div>
      <div className="detail-layout">
        <article>
          <div className="detail-title">
            <span className="fit-score">{g.relevance || 92}% fit for you</span>
            <h1>{g.title}</h1>
            <p>{g.description}</p>
            <div className="detail-actions">
              <button className="button secondary" onClick={() => onSave(g)}>
                {saved ? "Saved" : "Save"}
              </button>
              <button
                className="button secondary"
                onClick={() => onCalendar(g)}
              >
                <CalendarDays /> Add to calendar
              </button>
              <button className="button secondary" onClick={() => onRead(g)}>
                <Volume2 /> Read aloud
              </button>
            </div>
          </div>
          <section className="detail-section">
            <h2>When and where</h2>
            <div className="detail-facts">
              <div>
                <CalendarDays />
                <span>
                  <b>
                    {g.day} · {g.time}
                  </b>
                  {g.duration}
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <b>{g.publicLocationName || g.location}</b>
                  {g.distance || "0.8 mi"} away · Public location
                </span>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <h2>Who you’ll meet</h2>
            <div className="people-list">
              {g.participants.map((p, i) => (
                <div key={i}>
                  <Avatar person={p} />
                  <span>
                    <b>{p.name}</b>
                    {i === 0 ? "Verified host" : "Verified student"}
                  </span>
                </div>
              ))}
            </div>
            <p className="welcome-note">
              <HeartHandshake /> New here? You’re welcome to join.
            </p>
          </section>
          <section className="detail-section">
            <h2>Why this fits you</h2>
            <p>
              Matches your interests in {g.category} and your preference for
              small, low-pressure groups.
            </p>
            <p>
              <ShieldCheck /> Verified students only · Meet at the listed public
              location · Reporting is always available.
            </p>
          </section>
          {ride && (
            <section className="detail-section ride-card">
              <div>
                <h2>Ride together</h2>
                <span>{ride.seats} seats available</span>
              </div>
              <p>
                <MapPin /> Public pickup: {ride.pickup}
              </p>
              <p>
                <Clock /> Leaves {ride.departure} · {ride.walk}
              </p>
              <small>
                No home addresses or contact details are shared until both
                students agree. Sharing a ride saves money and a trip.
              </small>
              <button className="button secondary" onClick={() => onRide(ride)}>
                {rideStatus === "requested"
                  ? "Cancel ride request"
                  : "Request a ride"}
              </button>
            </section>
          )}
          <button
            className="text-action danger"
            onClick={() => onReport("Gathering reported for review")}
          >
            <Flag /> Report this gathering
          </button>
        </article>
        <aside className="join-card">
          <p>{g.day}</p>
          <h3>{g.time}</h3>
          <p>{g.publicLocationName || g.location}</p>
          <div className="capacity">
            <b>{g.attendees} people are going</b>
            <span>
              {g.capacity - g.attendees} spots left · up to {g.capacity}
            </span>
            <div>
              <i style={{ width: `${(g.attendees / g.capacity) * 100}%` }} />
            </div>
          </div>
          <ParticipantPreview g={g} />
          <JoinButton
            g={g}
            relation={relation}
            onJoin={onJoin}
            onCancel={onCancel}
          />
          <small>
            {g.instantJoin
              ? "You’ll join immediately. No application."
              : "The host will review your request."}
          </small>
        </aside>
      </div>
    </main>
  );
}
function CreateFlow({ draft, onClose, onPublish }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    title: "",
    category: "Other",
    description: "",
    day: "",
    time: "",
    endTime: "",
    duration: "90 min",
    location: "",
    tags: [],
    accessibility: "",
    carpool: false,
    capacity: 5,
    instantJoin: true,
    newcomers: true,
    reminders: true,
    questions: [""],
    ...draft,
  });
  const up = (k, v) => setF({ ...f, [k]: v });
  const next = () => {
    if (step === 1 && (!f.title || !f.description))
      return setError("Add a title and a short description.");
    if (step === 2 && (!f.day || !f.time || !f.location))
      return setError("Choose when and where you’ll meet.");
    setError("");
    setStep(Math.min(4, step + 1));
  };
  const preview = {
    ...f,
    id: "preview",
    host: { name: "You", initials: "AV", color: "#355f55" },
    participants: [{ name: "You", initials: "AV", color: "#355f55" }],
    attendees: 1,
    dateKey: "weekend",
    period: "afternoon",
    status: "active",
    expectations: "Details shared by the host.",
  };
  return (
    <div className="overlay">
      <section className="create-flow">
        <header>
          <button
            className="icon"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
          >
            <ArrowLeft />
          </button>
          <div>
            <b>Create a gathering</b>
            <span>Step {step} of 4</span>
          </div>
          <button className="icon" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="progress">
          <i style={{ width: `${step * 25}%` }} />
        </div>
        <div className="form-body">
          {step === 1 && (
            <>
              <p className="kicker">The plan</p>
              <h1>What are you doing?</h1>
              <p className="helper">
                What are you getting people together to do?
              </p>
              <label>
                Title
                <input
                  autoFocus
                  value={f.title}
                  onChange={(e) => up("title", e.target.value)}
                  placeholder="e.g. Sketching at the park"
                />
              </label>
              <label>
                Interest
                <select
                  value={f.category}
                  onChange={(e) => up("category", e.target.value)}
                >
                  {categories.slice(1).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  <option>Other</option>
                </select>
              </label>
              <label>
                Short description
                <textarea
                  value={f.description}
                  onChange={(e) => up("description", e.target.value)}
                  placeholder="Tell people what you have in mind. Keep it casual."
                />
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <p className="kicker">The details</p>
              <h1>When and where?</h1>
              <p className="helper">
                Public, easy-to-find places help everyone feel comfortable.
              </p>
              <div className="two">
                <label>
                  Day
                  <input
                    value={f.day}
                    onChange={(e) => up("day", e.target.value)}
                    placeholder="Saturday"
                  />
                </label>
                <label>
                  Start time
                  <input
                    value={f.time}
                    onChange={(e) => up("time", e.target.value)}
                    placeholder="2:00 PM"
                  />
                </label>
                <label>
                  End time
                  <input
                    value={f.endTime}
                    onChange={(e) => up("endTime", e.target.value)}
                    placeholder="3:30 PM"
                  />
                </label>
              </div>
              <label>
                Estimated duration
                <select
                  value={f.duration}
                  onChange={(e) => up("duration", e.target.value)}
                >
                  <option>1 hour</option>
                  <option>90 min</option>
                  <option>2 hours</option>
                  <option>3 hours</option>
                </select>
              </label>
              <label>
                Meeting location
                <input
                  value={f.location}
                  onChange={(e) => up("location", e.target.value)}
                  placeholder="A library, café, park…"
                />
              </label>
              <p className="guidance">
                <ShieldCheck /> Choose a public, accessible place for first-time
                groups.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="kicker">The group</p>
              <h1>Who’s joining?</h1>
              <p className="helper">
                Small by design. Including you, groups have 3–7 people.
              </p>
              <label>
                Group size
                <select
                  value={f.capacity}
                  onChange={(e) =>
                    up(
                      "capacity",
                      Math.min(7, Math.max(3, Number(e.target.value))),
                    )
                  }
                >
                  {[3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      Up to {n} people
                    </option>
                  ))}
                </select>
              </label>
              <Toggle
                label="Instant join"
                detail="People join immediately while there’s room"
                value={f.instantJoin}
                set={(v) => up("instantJoin", v)}
              />
              <Toggle
                label="Newcomers welcome"
                detail="Make this explicit on your gathering"
                value={f.newcomers}
                set={(v) => up("newcomers", v)}
              />
              <Toggle
                label="Reminders"
                detail="Send a reminder before it starts"
                value={f.reminders}
                set={(v) => up("reminders", v)}
              />
              <Toggle
                label="Ride together"
                detail="Allow rides from verified public pickup points"
                value={f.carpool}
                set={(v) => up("carpool", v)}
              />
              <label>
                Accessibility information
                <input
                  value={f.accessibility}
                  onChange={(e) => up("accessibility", e.target.value)}
                  placeholder="Step-free access, quieter seating…"
                />
              </label>
              {!f.instantJoin && (
                <label>
                  One short question (optional)
                  <input
                    value={f.questions[0]}
                    onChange={(e) => up("questions", [e.target.value])}
                    placeholder="What would you like to work on?"
                  />
                </label>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <p className="kicker">Review</p>
              <h1>Ready to invite a few people?</h1>
              <p className="helper">
                This is how your gathering will appear in Explore.
              </p>
              <GatheringCard
                g={preview}
                relation={null}
                onOpen={() => {}}
                onJoin={() => {}}
                onCancel={() => {}}
              />
            </>
          )}{" "}
          {error && <p className="form-error">{error}</p>}
        </div>
        <footer>
          {step < 4 ? (
            <button className="button primary" onClick={next}>
              Continue <ChevronRight />
            </button>
          ) : (
            <button className="button primary" onClick={() => onPublish(f)}>
              Publish gathering
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
function Toggle({ label, detail, value, set }) {
  return (
    <div className="toggle-row">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <button
        role="switch"
        aria-checked={value}
        className={cx("switch", value && "on")}
        onClick={() => set(!value)}
      >
        <i />
      </button>
    </div>
  );
}
function MyGatherings({
  items,
  relations,
  hosted,
  onOpen,
  onApprove,
  onDecline,
  onCancelHost,
}) {
  const [tab, setTab] = useState("going");
  const list =
    tab === "going"
      ? items.filter(
          (g) => relations[g.id] === "joined" || relations[g.id] === "pending",
        )
      : tab === "hosting"
        ? items.filter((g) => hosted.includes(g.id))
        : [];
  return (
    <main className="page">
      <div className="page-heading">
        <p className="kicker">Your plans</p>
        <h1>My gatherings</h1>
      </div>
      <div className="tabs">
        {["going", "hosting", "past"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "past" ? (
        <div className="past-card">
          <Check />
          <div>
            <h3>Side project work session</h3>
            <p>Completed · September 28</p>
            <button className="button secondary">Share quick feedback</button>
          </div>
        </div>
      ) : list.length ? (
        <div className="manage-list">
          {list.map((g) => (
            <article key={g.id} className="manage-card">
              <div onClick={() => onOpen(g)}>
                <span className="category">{g.category}</span>
                <h2>{g.title}</h2>
                <p>
                  {g.day} · {g.time} · {g.location}
                </p>
                <p>
                  {g.attendees}/{g.capacity} people
                </p>
              </div>
              {tab === "hosting" && (
                <div className="host-tools">
                  {g.pending?.map((name) => (
                    <div className="request" key={name}>
                      <span>
                        <Avatar
                          person={{
                            name,
                            initials: name.slice(0, 2).toUpperCase(),
                            color: "#9a8771",
                          }}
                        />
                        <b>{name}</b> wants to join
                      </span>
                      <button onClick={() => onApprove(g, name)}>
                        Approve
                      </button>
                      <button onClick={() => onDecline(g, name)}>
                        Decline
                      </button>
                    </div>
                  ))}
                  <button
                    className="text-action danger"
                    onClick={() => onCancelHost(g)}
                  >
                    Cancel gathering
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <CalendarDays />
          <h2>No gatherings here yet.</h2>
          <p>When you join or host something, it’ll show up here.</p>
        </div>
      )}
    </main>
  );
}
function CalendarScreen({
  items,
  relations,
  hosted,
  onOpen,
  calendar,
  setCalendar,
}) {
  const plans = items.filter(
    (g) => relations[g.id] === "joined" || hosted.includes(g.id),
  );
  const toggle = async () =>
    setCalendar(
      calendar.connected
        ? calendarService.disconnect()
        : await calendarService.connect(),
    );
  return (
    <main className="page">
      <div className="page-heading">
        <p className="kicker">Your week</p>
        <h1>Calendar</h1>
        <p>Plans you joined and activities you host.</p>
      </div>
      <div className="week-strip">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <button className={i === 4 ? "active" : ""} key={d}>
            <span>{d}</span>
            <b>{12 + i}</b>
          </button>
        ))}
      </div>
      <section className="calendar-sync">
        <CalendarDays />
        <div>
          <h3>
            {calendar.connected
              ? "Calendar connected"
              : "Connect Google Calendar"}
          </h3>
          <p>
            {calendar.connected
              ? "Connection is simulated locally. Privacy masking is on."
              : "Simulated connection for this prototype."}
          </p>
          <label>
            <input
              type="checkbox"
              checked={calendar.mask}
              onChange={(e) =>
                setCalendar({ ...calendar, mask: e.target.checked })
              }
            />{" "}
            Show synced entries as “Busy — personal activity”
          </label>
        </div>
        <button className="button secondary" onClick={toggle}>
          {calendar.connected ? "Disconnect" : "Connect"}
        </button>
      </section>
      <div className="agenda">
        <h2>Upcoming</h2>
        {plans.length ? (
          plans.map((g) => (
            <button key={g.id} onClick={() => onOpen(g)}>
              <span className="agenda-time">{g.time}</span>
              <span className="agenda-icon">{g.activityIcon || "✦"}</span>
              <span>
                <b>{g.title}</b>
                <small>
                  {g.publicLocationName || g.location} ·{" "}
                  {hosted.includes(g.id) ? "Hosting" : "Going"}
                </small>
              </span>
              <ChevronRight />
            </button>
          ))
        ) : (
          <div className="empty">
            <CalendarDays />
            <h2>No plans yet.</h2>
            <p>Join something in Discover and it’ll appear here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
function AlertsScreen({ settings, setSettings }) {
  const alerts = [
    ["Nearby now", "Two students are starting a board-game table 0.4 mi away."],
    ["Starts soon", "Pickup basketball begins in 45 minutes."],
    ["One spot left", "Coffee + early startup ideas has one open spot."],
    ["For you", "A new creative meetup matches your interests."],
  ];
  return (
    <main className="page">
      <div className="page-heading">
        <p className="kicker">Useful, not noisy</p>
        <h1>Alerts</h1>
        <p>Updates that help you show up.</p>
      </div>
      <section className="alert-controls">
        <Toggle
          label="Notifications"
          detail="Event reminders and important changes"
          value={settings.enabled}
          set={(v) => setSettings({ ...settings, enabled: v })}
        />
        <Toggle
          label="Nearby activity alerts"
          detail="Small groups starting close to campus"
          value={settings.nearby}
          set={(v) => setSettings({ ...settings, nearby: v })}
        />
        <Toggle
          label="Visual alerts"
          detail="Flash and on-screen cues for hearing assistance"
          value={settings.visual}
          set={(v) => setSettings({ ...settings, visual: v })}
        />
        <label>
          Quiet hours
          <select
            value={settings.quiet}
            onChange={(e) =>
              setSettings({ ...settings, quiet: e.target.value })
            }
          >
            <option>10 PM – 8 AM</option>
            <option>11 PM – 7 AM</option>
            <option>Off</option>
          </select>
        </label>
      </section>
      <div className="alert-list">
        {alerts.map(([title, copy], i) => (
          <article key={title}>
            <span className={i === 0 ? "live" : ""}>
              <Bell />
            </span>
            <div>
              <b>{title}</b>
              <p>{copy}</p>
            </div>
            <small>{i + 1}h</small>
          </article>
        ))}
      </div>
    </main>
  );
}
function Profile({
  profile,
  onUpload,
  onAccessibility,
  calendar,
  notifications,
}) {
  return (
    <main className="page profile-page">
      <section className="profile-card">
        <div className="profile-head">
          <button className="photo-upload" onClick={onUpload}>
            {profile.photo ? (
              <img src={profile.photo} alt="Profile" />
            ) : (
              <ProfileImageSkeleton large />
            )}
            <span>Add photo</span>
          </button>
          <div>
            <p className="kicker">Verified student</p>
            <h1>{currentUser.name}</h1>
            <span className="reliability">
              <ShieldCheck /> Arizona State University
            </span>
          </div>
        </div>
        <p className="bio">{currentUser.bio}</p>
        <div className="profile-facts">
          <div>
            <b>{profile.personality?.name || "Calm Explorer"}</b>
            <span>Social style</span>
          </div>
          <div>
            <b>4.8</b>
            <span>Community rating</span>
          </div>
          <div>
            <b>5 miles</b>
            <span>Distance radius</span>
          </div>
        </div>
        <h3>Interests</h3>
        <div className="interest-list">
          {(profile.interests || currentUser.interests).map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
        <div className="history">
          <div>
            <b>{currentUser.attended}</b>
            <span>Joined plans</span>
          </div>
          <div>
            <b>{currentUser.hosted}</b>
            <span>Hosted plans</span>
          </div>
        </div>
        <div className="profile-links">
          <button onClick={onAccessibility}>
            <Volume2 />
            <span>
              <b>Accessibility preferences</b>
              <small>Private until you choose to share with a host</small>
            </span>
            <ChevronRight />
          </button>
          <button>
            <Bell />
            <span>
              <b>Notifications</b>
              <small>
                {notifications.enabled ? "Enabled" : "Disabled"} · quiet hours{" "}
                {notifications.quiet}
              </small>
            </span>
            <ChevronRight />
          </button>
          <button>
            <CalendarDays />
            <span>
              <b>Calendar</b>
              <small>
                {calendar.connected
                  ? "Connected · privacy masking on"
                  : "Not connected"}
              </small>
            </span>
            <ChevronRight />
          </button>
        </div>
        <p className="neutral">
          <ShieldCheck /> Reliability describes fulfilled commitments—not
          popularity. New participants start neutral.
        </p>
      </section>
    </main>
  );
}
function DuplicateWarning({ event, onView, onJoin, onClose }) {
  return (
    <div className="overlay">
      <section className="duplicate-warning">
        <span className="warning-symbol">
          <Users />
        </span>
        <p className="kicker">Before you publish</p>
        <h2>A similar event already exists nearby.</h2>
        <p>
          Combining groups helps prevent double booking and half-filled events.
        </p>
        <div className="duplicate-event">
          <b>{event.title}</b>
          <span>
            {event.day} · {event.time}
          </span>
          <span>
            {event.distance || "0.6 mi"} · {event.capacity - event.attendees}{" "}
            open spots
          </span>
        </div>
        <div className="duplicate-actions">
          <button className="button secondary" onClick={() => onView(event)}>
            View event
          </button>
          <button className="button primary" onClick={() => onJoin(event)}>
            Join existing event
          </button>
        </div>
        <small>
          Or change the time, category, or location to make this activity
          distinct.
        </small>
        <button className="back-link" onClick={onClose}>
          Go back and edit
        </button>
      </section>
    </div>
  );
}
function Assistant({
  open,
  onClose,
  items,
  relations,
  onOpen,
  onJoin,
  onCreate,
}) {
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const end = useRef();
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const r = await communityAssistant.respond({
        history: next,
        userContext: currentUser,
        gatherings: items,
        filters: {},
      });
      setMessages([
        ...next,
        { role: "assistant", content: r.text, actions: r.actions },
      ]);
    } catch {
      setError("I couldn’t search right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <button className={cx("scrim", open && "show")} onClick={onClose} />
      <aside className={cx("assistant", open && "open")}>
        <header>
          <div>
            <MessageCircle />
            <span>
              <b>Find something to do</b>
              <small>Help finding a small group</small>
            </span>
          </div>
          <div>
            <button className="icon" onClick={() => setMessages([])}>
              <RotateCcw />
            </button>
            <button className="icon" onClick={onClose}>
              <X />
            </button>
          </div>
        </header>
        <div className="conversation">
          {!messages.length && (
            <div className="assistant-empty">
              <Users />
              <h2>What do you feel like doing?</h2>
              <p>
                Tell me what you’re interested in and I’ll help you find people
                doing it nearby.
              </p>
              {starters.map((s) => (
                <button key={s} onClick={() => send(s)}>
                  {s}
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cx("message-block", m.role)}>
              <p>{m.content}</p>
              {m.actions?.map((a, j) => (
                <div key={j}>
                  {a.type === "gathering_recommendations" &&
                    a.gatheringIds.map((id) => {
                      const g = items.find((x) => x.id === id);
                      return g ? (
                        <GatheringCard
                          compact
                          key={id}
                          g={g}
                          relation={relations[id]}
                          onOpen={onOpen}
                          onJoin={onJoin}
                          onCancel={() => {}}
                        />
                      ) : null;
                    })}
                  {a.type === "create_gathering" && (
                    <button
                      className="button primary"
                      onClick={() => onCreate(a.draft)}
                    >
                      <Plus /> Create a gathering
                    </button>
                  )}
                  {a.type === "gathering_draft" && (
                    <div className="draft">
                      <b>{a.draft.title}</b>
                      <span>
                        {a.draft.day} · {a.draft.time}
                      </span>
                      <span>
                        {a.draft.category} · up to {a.draft.capacity}
                      </span>
                      <span>{a.draft.location || "Location not selected"}</span>
                      <button
                        className="button primary"
                        onClick={() => onCreate(a.draft)}
                      >
                        Continue creating
                      </button>
                    </div>
                  )}
                  {a.type === "calendar_summary" && (
                    <div className="draft"><b>Your next plan</b><span>Pickup basketball · Today at 6:00 PM</span><span>SDFC outdoor courts</span></div>
                  )}
                  {a.type === "carpool_recommendations" && (
                    <div className="draft"><b>Ride together</b><span>University Services Building · 5:35 PM</span><span>2 seats · verified public pickup point</span></div>
                  )}
                  {a.type === "apply_filters" && (
                    <div className="draft"><b>Accessibility filter ready</b><span>Open an activity to review its access notes or ask the host privately.</span></div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {loading && (
            <div className="typing">
              <i />
              <i />
              <i />
            </div>
          )}
          {error && <p className="assistant-error">{error}</p>}
          <div ref={end} />
        </div>
        <div className="composer">
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Try: basketball tonight"
            />
            <button
              aria-label="Send"
              disabled={!input.trim()}
              onClick={() => send()}
            >
              <Send />
            </button>
          </div>
          <small>Built to get you into the world, not keep you chatting.</small>
        </div>
      </aside>
    </>
  );
}
export default function App() {
  const [profile, setProfile] = usePersistentState("profile", null);
  const [view, setView] = useState("explore"),
    [items, setItems] = usePersistentState("events", seed.map(enrich)),
    [relations, setRelations] = usePersistentState("relations", {}),
    [hosted, setHosted] = usePersistentState("hosted", ["side-projects", "frontend-review"]),
    [saved, setSaved] = usePersistentState("saved", []),
    [calendar, setCalendar] = usePersistentState("calendar", {connected:false,provider:null,mask:true}),
    [notifications, setNotifications] = usePersistentState("notifications", {enabled:true,nearby:true,visual:true,quiet:"10 PM – 8 AM"}),
    [accessibility, setAccessibility] = usePersistentState("accessibility", {largeText:false,highContrast:false,visualNotifications:true,captions:false,textUpdates:false,hearingAssistance:false,visualAssistance:false}),
    [rideRequests, setRideRequests] = usePersistentState("rides", {}),
    [selected, setSelected] = useState(null),
    [creating, setCreating] = useState(false),
    [draft, setDraft] = useState({}),
    [assistant, setAssistant] = useState(false),
    [accessOpen, setAccessOpen] = useState(false),
    [reading, setReading] = useState(false),
    [duplicate, setDuplicate] = useState(null),
    [toast, setToast] = useState(""),
    [filters, setFilters] = useState({
      q: "",
      when: "any",
      category: "All interests",
      spots: false,
      instant: false,
      newcomers: false,
    });
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [selected, view]);
  useEffect(()=>{document.documentElement.classList.toggle('large-text',accessibility.largeText);document.documentElement.classList.toggle('high-contrast',accessibility.highContrast)},[accessibility.largeText,accessibility.highContrast]);
  if(!profile)return <Onboarding onComplete={setProfile}/>;
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2600);
  };
  const join = (g) => {
    if (relations[g.id] || g.attendees >= g.capacity || g.status === "canceled")
      return;
    setRelations({
      ...relations,
      [g.id]: g.instantJoin ? "joined" : "pending",
    });
    if (g.instantJoin)
      setItems(
        items.map((x) =>
          x.id === g.id
            ? {
                ...x,
                attendees: x.attendees + 1,
                participants: [
                  ...x.participants,
                  { name: "Aayushman", initials: "AV", color: "#355f55" },
                ],
              }
            : x,
        ),
      );
    flash(
      g.instantJoin
        ? "You’re going. See you there."
        : "Request sent to the host.",
    );
  };
  const cancel = (g) => {
    if (relations[g.id] !== "joined") return;
    const next = { ...relations };
    delete next[g.id];
    setRelations(next);
    setItems(
      items.map((x) =>
        x.id === g.id
          ? {
              ...x,
              attendees: x.attendees - 1,
              participants: x.participants.filter((p) => p.initials !== "AV"),
            }
          : x,
      ),
    );
    flash("Your spot is open again.");
  };
  const openCreate = (d = {}) => {
    setDraft(d);
    setCreating(true);
    setAssistant(false);
  };
  const publish = (f) => {
    const similar=findSimilarEvents({title:f.title,category:f.category,startsAt:f.day,latitude:33.42,longitude:-111.94,radiusMiles:2,existingEvents:items});
    if(similar){setDuplicate(similar);setCreating(false);return}
    const g = {
      ...f,
      id: `created-${Date.now()}`,
      host: { name: "Aayushman", initials: "AV", color: "#355f55" },
      participants: [{ name: "Aayushman", initials: "AV", color: "#355f55" }],
      attendees: 1,
      dateKey: "weekend",
      period: "afternoon",
      status: "active",
      expectations: "Details shared by the host.",
      publicLocationName:f.location,latitude:33.42,longitude:-111.94,distance:'0.6 mi',tags:[f.instantJoin?'Instant join':'Host approval',f.newcomers?'Newcomers welcome':'Small group'],activityIcon:activityIcons[f.category]||'✦',image:'activity-3',hostId:'current-user',hostName:currentUser.name,attendeeIds:['current-user'],newcomersWelcome:f.newcomers,verifiedOnly:true,accessibility:f.accessibility||'Ask the host about access needs',carpoolEnabled:f.carpool||false,createdAt:new Date().toISOString(),relevance:98,
    };
    setItems([g, ...items]);
    setHosted([g.id, ...hosted]);
    setCreating(false);
    setView("calendar");
    flash("Your gathering is live.");
  };
  const approve = (g, name) => {
    if (g.attendees >= g.capacity)
      return flash("This gathering is already full.");
    setItems(
      items.map((x) =>
        x.id === g.id
          ? {
              ...x,
              attendees: x.attendees + 1,
              pending: x.pending.filter((n) => n !== name),
              participants: [
                ...x.participants,
                {
                  name,
                  initials: name.slice(0, 2).toUpperCase(),
                  color: "#9a8771",
                },
              ],
            }
          : x,
      ),
    );
    flash(`${name} is in.`);
  };
  const decline = (g, name) => {
    setItems(
      items.map((x) =>
        x.id === g.id
          ? { ...x, pending: x.pending.filter((n) => n !== name) }
          : x,
      ),
    );
    flash("Request declined privately.");
  };
  const cancelHost = (g) => {
    setItems(
      items.map((x) => (x.id === g.id ? { ...x, status: "canceled" } : x)),
    );
    flash("Gathering canceled. Everyone will be notified.");
  };
  const report = (t) => flash(t);
  const toggleSave=g=>{setSaved(saved.includes(g.id)?saved.filter(id=>id!==g.id):[...saved,g.id]);flash(saved.includes(g.id)?'Removed from saved events.':'Event saved.')};
  const ride=ride=>{const requested=rideRequests[ride.id]==='requested';setRideRequests({...rideRequests,[ride.id]:requested?'available':'requested'});flash(requested?'Ride request canceled.':'Ride requested. Contact details stay private until accepted.')};
  const speak=(g)=>{window.speechSynthesis?.cancel();const text=g?`${g.title}. ${g.day} at ${g.time}. ${g.description}. Meeting at ${g.publicLocationName||g.location}.`:document.querySelector('main')?.innerText;if(!text)return;const u=new SpeechSynthesisUtterance(text);u.onend=()=>setReading(false);window.speechSynthesis.speak(u);setReading(true)};
  const stopReading=()=>{window.speechSynthesis?.cancel();setReading(false)};
  const addCalendar=g=>flash(calendar.connected?`${calendarService.externalTitle(g,calendar.mask)} added to your simulated calendar.`:'Connect a calendar from the Calendar tab first.');
  const uploadPhoto=()=>document.getElementById('kinlii-photo')?.click();
  const content = selected ? (
    <Detail
      g={selected}
      relation={relations[selected.id]}
      onBack={() => setSelected(null)}
      onJoin={join}
      onCancel={cancel}
      onReport={report}
      saved={saved.includes(selected.id)}
      onSave={toggleSave}
      rideStatus={rideRequests[carpoolService.getForEvent(selected.id)?.id]}
      onRide={ride}
      onRead={speak}
      onCalendar={addCalendar}
    />
  ) : view === "explore" ? (
    <Explore
      items={items}
      relations={relations}
      filters={filters}
      setFilters={setFilters}
      onOpen={setSelected}
      onJoin={join}
      onCancel={cancel}
      onCreate={openCreate}
    />
  ) : view === "calendar" ? (
    <CalendarScreen
      items={items}
      relations={relations}
      hosted={hosted}
      onOpen={setSelected}
      calendar={calendar}
      setCalendar={setCalendar}
    />
  ) : view === "alerts" ? (
    <AlertsScreen settings={notifications} setSettings={setNotifications}/>
  ) : (
    <Profile profile={profile} onUpload={uploadPhoto} onAccessibility={()=>setAccessOpen(true)} calendar={calendar} notifications={notifications}/>
  );
  return (
    <div>
      <Header
        view={view}
        setView={(v) => {
          setSelected(null);
          setView(v);
        }}
        onCreate={openCreate}
        onAssistant={() => setAssistant(true)}
      />
      {content}
      <button className="access-fab" aria-label="Accessibility" onClick={()=>setAccessOpen(true)}><Volume2/></button>
      <button className="mobile-assistant" onClick={() => setAssistant(true)}>
        <MessageCircle /> Need help?
      </button>
      <Assistant
        open={assistant}
        onClose={() => setAssistant(false)}
        items={items}
        relations={relations}
        onOpen={(g) => {
          setSelected(g);
          setAssistant(false);
        }}
        onJoin={join}
        onCreate={openCreate}
      />
      {creating && (
        <CreateFlow
          draft={draft}
          onClose={() => setCreating(false)}
          onPublish={publish}
        />
      )}
      {duplicate&&<DuplicateWarning event={duplicate} onView={g=>{setDuplicate(null);setSelected(g)}} onJoin={g=>{setDuplicate(null);join(g)}} onClose={()=>{setDuplicate(null);setCreating(true)}}/>}
      <AccessibilityPanel open={accessOpen} onClose={()=>setAccessOpen(false)} settings={accessibility} setSettings={setAccessibility} onRead={()=>speak()} onStop={stopReading} reading={reading}/>
      <input id="kinlii-photo" className="sr-only" type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)setProfile({...profile,photo:URL.createObjectURL(file)})}}/>
      <div className={cx("toast", toast && "show")} role="status">
        <Check />
        {toast}
      </div>
    </div>
  );
}
