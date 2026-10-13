import type { Dispatch, RefObject, SetStateAction } from "react";

import type { Personality, Screen, Tab } from "../../app/types";
import { Icon } from "../../components/ui/Icon";
import { events, type KinliiEvent } from "../../data/kinliiData";

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
  const nearbyHighlight = visibleEvents.find((event) => event.id === 1);

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
      {nearbyHighlight && (
        <section className="nearby-alert">
          <span>
            <Icon name="location" />
          </span>
          <div>
            <small>HAPPENING NEARBY</small>
            <strong>Badminton starts in 2 hours</strong>
            <p>
              0.4 miles away · {nearbyHighlight.spots} spot
              {nearbyHighlight.spots === 1 ? "" : "s"} left
            </p>
          </div>
          <Icon name="chevron" size={18} />
        </section>
      )}
      <div className="section-heading">
        <div>
          <h2>Picked for you</h2>
          <p>Based on your interests and personality</p>
        </div>
        <button>See all</button>
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
  calendarSynced: boolean;
  setCalendarSynced: Dispatch<SetStateAction<boolean>>;
  privateCalendar: boolean;
  setPrivateCalendar: Dispatch<SetStateAction<boolean>>;
  hostedPlans: KinliiEvent[];
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
};

export function CalendarScreen({
  calendarSynced,
  setCalendarSynced,
  privateCalendar,
  setPrivateCalendar,
  hostedPlans,
  setEvent,
}: CalendarScreenProps) {
  return (
    <>
      <section className="calendar-sync-card">
        <div className="google-calendar-mark">
          <Icon name="calendar" size={21} />
        </div>
        <div>
          <strong>{calendarSynced ? "Google Calendar connected" : "Sync Google Calendar"}</strong>
          <p>
            {calendarSynced
              ? "Your Kin plans are syncing privately."
              : "Keep your activities and classes together."}
          </p>
        </div>
        <button
          className={calendarSynced ? "connected" : ""}
          onClick={() => setCalendarSynced(!calendarSynced)}
        >
          {calendarSynced ? <Icon name="check" size={16} /> : "Connect"}
        </button>
      </section>
      <section className="privacy-mask">
        <span>
          <Icon name="check" size={17} />
        </span>
        <div>
          <strong>Privacy mask</strong>
          <p>
            Kin events appear externally as “Busy — personal activity.” Locations, interests, and
            attendees stay hidden.
          </p>
        </div>
        <button
          className={privateCalendar ? "on" : ""}
          onClick={() => setPrivateCalendar(!privateCalendar)}
        >
          <i />
        </button>
      </section>
      <div className="month-heading">
        <button>
          <Icon name="arrow" size={17} />
        </button>
        <h2>October 2026</h2>
        <button>
          <Icon name="chevron" size={17} />
        </button>
      </div>
      <div className="calendar-week">
        {[
          ["MON", "14"],
          ["TUE", "15"],
          ["WED", "16"],
          ["THU", "17"],
          ["FRI", "18"],
          ["SAT", "19"],
          ["SUN", "20"],
        ].map(([day, date]) => (
          <button key={date} className={date === "17" ? "active" : ""}>
            <span>{day}</span>
            <strong>{date}</strong>
            {date === "17" && <i />}
          </button>
        ))}
      </div>
      <div className="agenda-heading">
        <h2>Thursday, October 17</h2>
        <span>2 plans</span>
      </div>
      <div className="agenda-list">
        <button onClick={() => setEvent(events[0])}>
          <time>
            5:30<small>PM</small>
          </time>
          <span className="agenda-line coral" />
          <div>
            <span>
              <Icon name={events[0].activityIcon} size={15} /> {events[0].type}
            </span>
            <strong>{events[0].title}</strong>
            <p>
              {events[0].place} · {events[0].distance}
            </p>
          </div>
          <Icon name="chevron" size={17} />
        </button>
        <button onClick={() => setEvent(events[2])}>
          <time>
            6:00<small>PM</small>
          </time>
          <span className="agenda-line purple" />
          <div>
            <span>
              <Icon name={events[2].activityIcon} size={15} /> {events[2].type}
            </span>
            <strong>{events[2].title}</strong>
            <p>
              {events[2].place} · {events[2].distance}
            </p>
          </div>
          <Icon name="chevron" size={17} />
        </button>
        {hostedPlans.map((plan) => (
          <button key={plan.id} onClick={() => setEvent(plan)}>
            <time>
              {plan.time}
              <small>HOST</small>
            </time>
            <span className="agenda-line green" />
            <div>
              <span>
                <Icon name={plan.activityIcon} size={15} /> {plan.type}
              </span>
              <strong>{plan.title}</strong>
              <p>
                {plan.place} · {plan.spots} spots left
              </p>
            </div>
            <Icon name="chevron" size={17} />
          </button>
        ))}
      </div>
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
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
};

export function AlertsScreen({ alertsEnabled, setAlertsEnabled, setEvent }: AlertsScreenProps) {
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
      <h2 className="timeline-title">Today</h2>
      <div className="alert-list">
        <button onClick={() => setEvent(events[0])}>
          <span className="alert-symbol coral">
            <Icon name="location" />
          </span>
          <div>
            <strong>A 96% match is 0.4 mi away</strong>
            <p>Sunset badminton starts at 5:30 PM. Two spots are still open.</p>
            <small>12 minutes ago</small>
          </div>
        </button>
        <button onClick={() => setEvent(events[1])}>
          <span className="alert-symbol green">
            <Icon name="people" />
          </span>
          <div>
            <strong>Noah joined an event you saved</strong>
            <p>You share 3 interests and have compatible social styles.</p>
            <small>1 hour ago</small>
          </div>
        </button>
        <button>
          <span className="alert-symbol yellow">
            <Icon name="sparkles" />
          </span>
          <div>
            <strong>5 new recommendations this week</strong>
            <p>Your suggestions improved after completing your personality profile.</p>
            <small>3 hours ago</small>
          </div>
        </button>
      </div>
      <div className="quiet-hours">
        <Icon name="clock" />
        <div>
          <strong>Quiet hours</strong>
          <p>No notifications between 10 PM and 8 AM</p>
        </div>
        <Icon name="chevron" />
      </div>
    </>
  );
}

type ProfileScreenProps = {
  accountEmail: string;
  displayName: string;
  universityName: string;
  profileImage: string;
  profileInput: RefObject<HTMLInputElement | null>;
  joinedCount: number;
  hostedCount: number;
  personality: Personality;
  selectedInterests: string[];
  setQuizStep: Dispatch<SetStateAction<number>>;
  setScreen: Dispatch<SetStateAction<Screen>>;
  setAccessibilityOpen: Dispatch<SetStateAction<boolean>>;
  onSignOut: () => Promise<void>;
};

export function ProfileScreen({
  accountEmail,
  displayName,
  universityName,
  profileImage,
  profileInput,
  joinedCount,
  hostedCount,
  personality,
  selectedInterests,
  setQuizStep,
  setScreen,
  setAccessibilityOpen,
  onSignOut,
}: ProfileScreenProps) {
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
        <div>
          <span>
            <strong>{joined.length}</strong>Plans joined
          </span>
          <span>
            <strong>4.9</strong>Community rating
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
      <button className="settings-row">
        <span>
          <Icon name="location" />
        </span>
        <div>
          <strong>Location & distance</strong>
          <small>Tempe campus · Within 3 miles</small>
        </div>
        <Icon name="chevron" />
      </button>
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
    </>
  );
}
