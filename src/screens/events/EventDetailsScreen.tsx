import type { Dispatch, SetStateAction } from "react";

import { Icon } from "../../components/ui/Icon";
import type { KinliiEvent } from "../../data/kinliiData";

type EventDetailsScreenProps = {
  event: KinliiEvent;
  joined: number[];
  saved: number[];
  carpoolJoined: number[];
  largeText: boolean;
  highContrast: boolean;
  reading: boolean;
  readPage: () => void;
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
  setJoined: Dispatch<SetStateAction<number[]>>;
  setSaved: Dispatch<SetStateAction<number[]>>;
  setCarpoolJoined: Dispatch<SetStateAction<number[]>>;
};

export function EventDetailsScreen({
  event,
  joined,
  saved,
  carpoolJoined,
  largeText,
  highContrast,
  reading,
  readPage,
  setEvent,
  setJoined,
  setSaved,
  setCarpoolJoined,
}: EventDetailsScreenProps) {
  const isJoined = joined.includes(event.id);
  const hasCarpool = carpoolJoined.includes(event.id);

  const toggleSaved = () => {
    setSaved((items) =>
      items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id],
    );
  };

  const toggleCarpool = () => {
    setCarpoolJoined((items) =>
      items.includes(event.id) ? items.filter((id) => id !== event.id) : [...items, event.id],
    );
  };

  const joinEvent = () => {
    setJoined((items) => (items.includes(event.id) ? items : [...items, event.id]));
  };

  return (
    <div
      className={`phone-shell event-page ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}
    >
      <div className="event-hero">
        <img src={event.image} alt={event.title} />
        <button className="floating-back" onClick={() => setEvent(null)}>
          <Icon name="arrow" />
        </button>
        <button
          className="floating-access"
          onClick={readPage}
          aria-label={reading ? "Stop reading event" : "Read event aloud"}
        >
          <Icon name={reading ? "volume" : "accessibility"} size={18} />
        </button>
        <button
          className={`floating-save ${saved.includes(event.id) ? "saved" : ""}`}
          onClick={toggleSaved}
          aria-label={saved.includes(event.id) ? "Remove saved activity" : "Save activity"}
        >
          <Icon name="heart" filled={saved.includes(event.id)} />
        </button>
        <span className="hero-match">
          <Icon name="sparkles" size={14} /> {event.match}% match
        </span>
      </div>

      <main className="event-content">
        <span className="event-type">
          <i>
            <Icon name={event.activityIcon} size={15} />
          </i>
          {event.type}
        </span>
        <h1>{event.title}</h1>
        <div className="event-facts">
          <div>
            <span>
              <Icon name="calendar" size={19} />
            </span>
            <p>
              <strong>{event.time}</strong>
              <small>Add to calendar</small>
            </p>
          </div>
          <div>
            <span>
              <Icon name="location" size={19} />
            </span>
            <p>
              <strong>
                {event.place} · {event.distance}
              </strong>
              <small>Verified public location</small>
            </p>
          </div>
        </div>
        <section className="why-match">
          <span>
            <Icon name="sparkles" size={17} />
          </span>
          <div>
            <strong>Why this fits you</strong>
            <p>
              You and this group share <b>{event.type}</b>, prefer smaller gatherings, and enjoy
              low-pressure plans.
            </p>
          </div>
        </section>
        <div className="event-detail-tags">
          {event.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <section className="group-preview">
          <div className="section-heading">
            <div>
              <h2>Meet the group</h2>
              <p>2 of 4 verified students joined</p>
            </div>
            <span>{event.spots} spots left</span>
          </div>
          <div className="member-list">
            <div>
              <div className="mini-avatar peach">{event.host[0]}</div>
              <p>
                <strong>{event.host}</strong>
                <small>
                  Host · 4.9 <Icon name="star" size={10} filled />
                </small>
              </p>
              <span>96% match</span>
            </div>
            <div>
              <div className="mini-avatar sage">JT</div>
              <p>
                <strong>Jordan</strong>
                <small>Verified student</small>
              </p>
              <span>89% match</span>
            </div>
          </div>
        </section>
        <section className="safety-card">
          <span>
            <Icon name="check" size={16} />
          </span>
          <div>
            <strong>Safe to meet</strong>
            <p>Public campus venue · Verified students · Community reporting on</p>
          </div>
        </section>
        <section className="carpool-card">
          <div className="carpool-heading">
            <span>
              <Icon name="car" size={21} />
            </span>
            <div>
              <strong>Ride together</strong>
              <p>Save money, lower emissions, and arrive with the group.</p>
            </div>
            <small>2 rides</small>
          </div>
          <div className="carpool-route">
            <i />
            <div>
              <strong>Pickup near Memorial Union</strong>
              <p>0.3 mi from you · Leaves 5:05 PM</p>
            </div>
            <span>2 seats</span>
          </div>
          <div className="carpool-privacy">
            <Icon name="check" size={13} /> Your exact address is never shared. Choose a public
            pickup point.
          </div>
          <button className={hasCarpool ? "joined" : ""} onClick={toggleCarpool}>
            {hasCarpool ? (
              <>
                <Icon name="check" size={16} /> Ride requested
              </>
            ) : (
              <>
                <Icon name="car" size={16} /> Find a carpool
              </>
            )}
          </button>
        </section>
      </main>

      <div className="event-action">
        <div>
          <strong>Free</strong>
          <span>{event.spots} spots available</span>
        </div>
        <button onClick={joinEvent}>
          {isJoined ? (
            <>
              <Icon name="check" size={18} /> You’re going
            </>
          ) : (
            "Join group"
          )}
        </button>
      </div>
    </div>
  );
}
