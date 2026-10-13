import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { Personality, Screen, Tab } from "../../app/types";
import { Icon } from "../../components/ui/Icon";
import type { KinliiEvent } from "../../data/kinliiData";

type DiscoverScreenProps = {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  visibleEvents: KinliiEvent[];
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
  setTab: Dispatch<SetStateAction<Tab>>;
};

export function DiscoverScreen({
  searchQuery,
  setSearchQuery,
  visibleEvents,
  setEvent,
  setTab,
}: DiscoverScreenProps) {
  return (
    <>
      <label className="search-bar">
        <Icon name="search" size={19} />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search activities or interests"
        />
      </label>
      <div className="section-heading">
        <div>
          <h2>Picked for you</h2>
          <p>Based on your interests and personality</p>
        </div>
      </div>
      <div className="event-scroll">
        {visibleEvents.map((item) => (
          <button className="event-card" key={item.id} onClick={() => setEvent(item)}>
            <div>
              <img src={item.image} alt="" />
              <span>
                <Icon name="sparkles" size={12} /> {item.match}%
              </span>
              <i className="activity-icon">
                <Icon name={item.activityIcon} size={18} />
              </i>
            </div>
            <section>
              <small>{item.type}</small>
              <h3>{item.title}</h3>
              <div className="event-tags">
                {item.tags.slice(0, 2).map((tag) => (
                  <i key={tag}>{tag}</i>
                ))}
              </div>
              <p>
                <Icon name="clock" size={14} /> {item.time}
              </p>
              <p>
                <Icon name="location" size={14} /> {item.place} · {item.distance}
              </p>
              <footer>
                <span>
                  {item.spots} spot{item.spots === 1 ? "" : "s"} left
                </span>
                <i>View</i>
              </footer>
            </section>
          </button>
        ))}
        {!visibleEvents.length && (
          <div className="empty-search">
            <Icon name="search" />
            <strong>No nearby activities found</strong>
            <span>Try another interest or activity.</span>
          </div>
        )}
      </div>
      <section className="calendar-nudge" onClick={() => setTab("calendar")}>
        <span>
          <Icon name="calendar" />
        </span>
        <div>
          <strong>Keep every plan in one place</strong>
          <p>View your schedule and privately sync it with Google Calendar.</p>
        </div>
        <Icon name="chevron" size={17} />
      </section>
    </>
  );
}

type CalendarScreenProps = {
  hostedPlans: KinliiEvent[];
  joinedPlans: KinliiEvent[];
  savedPlans: KinliiEvent[];
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
};

export function CalendarScreen({
  hostedPlans,
  joinedPlans,
  savedPlans,
  setEvent,
}: CalendarScreenProps) {
  return (
    <>
      {[
        ["Joined", joinedPlans],
        ["Hosted", hostedPlans],
        ["Saved", savedPlans],
      ].map(([label, plans]) => (
        <section className="calendar-plan-section" key={label as string}>
          <div className="agenda-heading">
            <h2>{label as string}</h2>
            <span>{(plans as KinliiEvent[]).length} plans</span>
          </div>
          <div className="agenda-list">
            {(plans as KinliiEvent[]).map((plan) => (
              <button key={plan.id} onClick={() => setEvent(plan)}>
                <time>
                  {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
                    new Date(plan.startsAt),
                  )}
                  <small>{label === "Hosted" ? "HOST" : ""}</small>
                </time>
                <span className="agenda-line green" />
                <div>
                  <span>
                    <Icon name={plan.activityIcon} size={15} /> {plan.type}
                  </span>
                  <strong>{plan.title}</strong>
                  <p>
                    {plan.time} · {plan.place}
                  </p>
                </div>
                <Icon name="chevron" size={17} />
              </button>
            ))}
            {!(plans as KinliiEvent[]).length && (
              <div className="empty-search">
                <strong>No {String(label).toLowerCase()} plans</strong>
                <span>
                  Events will appear here when you{" "}
                  {label === "Hosted" ? "create" : label === "Saved" ? "save" : "join"} them.
                </span>
              </div>
            )}
          </div>
        </section>
      ))}
      <section className="calendar-privacy-note">
        <Icon name="check" size={16} />
        <p>
          <strong>Your schedule is yours.</strong> Other students never see your calendar, class
          schedule, or unavailable times.
        </p>
      </section>
    </>
  );
}

type AlertsScreenProps = {
  alertsEnabled: boolean;
  setAlertsEnabled: Dispatch<SetStateAction<boolean>>;
};

export function AlertsScreen({ alertsEnabled, setAlertsEnabled }: AlertsScreenProps) {
  return (
    <>
      <section className="notification-toggle">
        <span>
          <Icon name="bell" />
        </span>
        <div>
          <strong>Nearby alerts</strong>
          <p>Get notified when a great match starts close by.</p>
        </div>
        <button
          className={alertsEnabled ? "on" : ""}
          onClick={() => setAlertsEnabled(!alertsEnabled)}
        >
          <i />
        </button>
      </section>
      <div className="empty-search">
        <Icon name="bell" />
        <strong>No alerts yet</strong>
        <span>Real activity notifications will appear here when they are generated.</span>
      </div>
    </>
  );
}

type ProfileScreenProps = {
  accountEmail: string;
  displayName: string;
  universityName: string;
  bio: string;
  profileImage: string;
  profileInput: RefObject<HTMLInputElement | null>;
  joinedCount: number;
  hostedCount: number;
  savedCount: number;
  personality: Personality;
  selectedInterests: string[];
  setQuizStep: Dispatch<SetStateAction<number>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setAccessibilityOpen: Dispatch<SetStateAction<boolean>>;
  onSignOut: () => Promise<void>;
  onUpdateProfile: (values: {
    displayName: string;
    universityName: string;
    bio: string;
  }) => Promise<void>;
};

export function ProfileScreen({
  accountEmail,
  displayName,
  universityName,
  bio,
  profileImage,
  profileInput,
  joinedCount,
  hostedCount,
  savedCount,
  personality,
  selectedInterests,
  setQuizStep,
  setScreen,
  setAccessibilityOpen,
  onSignOut,
  onUpdateProfile,
}: ProfileScreenProps) {
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({ displayName, universityName, bio });
  const [saving, setSaving] = useState(false);
  const joined = { length: joinedCount };
  const hostedPlans = { length: hostedCount };
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "K";
  return (
    <>
      <section className="profile-card">
        <button
          className={`profile-avatar ${profileImage ? "has-image" : "skeleton-avatar"}`}
          onClick={() => profileInput.current?.click()}
          aria-label="Upload profile picture"
        >
          {profileImage ? <img src={profileImage} alt={displayName} /> : initials}
          <span>
            <Icon name="check" size={12} />
          </span>
        </button>
        <h2>{displayName}</h2>
        <p>{universityName} · Verified student</p>
        {bio && <p>{bio}</p>}
        <button
          className="profile-edit-button"
          onClick={() => {
            setEditValues({ displayName, universityName, bio });
            setEditing(true);
          }}
        >
          Edit profile
        </button>
        <div>
          <span>
            <strong>{joined.length}</strong>Plans joined
          </span>
          <span>
            <strong>{savedCount}</strong>Plans saved
          </span>
          <span>
            <strong>{hostedPlans.length}</strong>Plans hosted
          </span>
        </div>
      </section>
      <section className="style-card">
        <span className="step-label">YOUR SOCIAL STYLE</span>
        <h2>{personality.name}</h2>
        <p>You connect best through shared interests in {personality.group}.</p>
        <div className="trait-row">
          {personality.traits.map((trait) => (
            <span key={trait}>{trait}</span>
          ))}
        </div>
        <button
          onClick={() => {
            setQuizStep(0);
            setScreen("quiz");
          }}
        >
          Retake personality check <Icon name="chevron" size={16} />
        </button>
      </section>
      <section className="profile-section">
        <h2>Your interests</h2>
        <div className="profile-tags">
          {selectedInterests.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <button onClick={() => setScreen("interests")}>Edit interests</button>
      </section>
      <button className="settings-row" onClick={() => setAccessibilityOpen(true)}>
        <span>
          <Icon name="accessibility" />
        </span>
        <div>
          <strong>Accessibility & assistance</strong>
          <small>Visual, hearing, and voice preferences</small>
        </div>
        <Icon name="chevron" />
      </button>
      <button className="settings-row sign-out-row" onClick={() => void onSignOut()}>
        <span>
          <Icon name="arrow" />
        </span>
        <div>
          <strong>Sign out</strong>
          <small>{accountEmail}</small>
        </div>
        <Icon name="chevron" />
      </button>
      {editing && (
        <div className="leave-dialog-backdrop" role="presentation">
          <section
            className="leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
          >
            <header>
              <div>
                <h2 id="edit-profile-title">Edit profile</h2>
                <p>Keep your public profile accurate.</p>
              </div>
            </header>
            <label>
              Display name
              <input
                value={editValues.displayName}
                onChange={(event) =>
                  setEditValues({ ...editValues, displayName: event.target.value })
                }
              />
            </label>
            <label>
              University
              <input
                value={editValues.universityName}
                onChange={(event) =>
                  setEditValues({ ...editValues, universityName: event.target.value })
                }
              />
            </label>
            <label>
              Bio
              <textarea
                rows={4}
                value={editValues.bio}
                onChange={(event) => setEditValues({ ...editValues, bio: event.target.value })}
              />
            </label>
            <div className="leave-dialog-actions">
              <button onClick={() => setEditing(false)}>Cancel</button>
              <button
                disabled={
                  saving || !editValues.displayName.trim() || !editValues.universityName.trim()
                }
                onClick={() =>
                  void (async () => {
                    setSaving(true);
                    try {
                      await onUpdateProfile(editValues);
                      setEditing(false);
                    } finally {
                      setSaving(false);
                    }
                  })()
                }
              >
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
