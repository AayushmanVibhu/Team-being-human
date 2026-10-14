import { useState, type Dispatch, type SetStateAction } from "react";

import { Icon } from "../../components/ui/Icon";
import type { EventId, KinliiEvent } from "../../data/kinliiData";

type EventDetailsScreenProps = {
  event: KinliiEvent;
  joined: EventId[];
  saved: EventId[];
  actionError: string;
  actionLoading: boolean;
  largeText: boolean;
  highContrast: boolean;
  reading: boolean;
  readPage: () => void;
  setEvent: Dispatch<SetStateAction<KinliiEvent | null>>;
  onJoin: (eventId: EventId) => Promise<void>;
  onLeave: (eventId: EventId, reason: string) => Promise<void>;
  onToggleSaved: (eventId: EventId) => Promise<void>;
  isHost: boolean;
  onEdit: (event: KinliiEvent) => void;
  onCancel: (eventId: string) => Promise<void>;
};

export function EventDetailsScreen({
  event,
  joined,
  saved,
  actionError,
  actionLoading,
  largeText,
  highContrast,
  reading,
  readPage,
  setEvent,
  onJoin,
  onLeave,
  onToggleSaved,
  isHost,
  onEdit,
  onCancel,
}: EventDetailsScreenProps) {
  const isJoined = joined.includes(event.id);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const submitLeave = async () => {
    if (!leaveReason) return;
    try {
      await onLeave(event.id, leaveReason);
      setLeaveReason("");
      setLeaveDialogOpen(false);
    } catch {
      // The parent surfaces the database error without dismissing the dialog.
    }
  };

  return (
    <div
      className={`phone-shell event-page ${largeText ? "large-text" : ""} ${highContrast ? "high-contrast" : ""}`}
    >
      <div
        className={`event-hero event-art-${event.type.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
      >
        <i className="event-art-orbit one" />
        <i className="event-art-orbit two" />
        <b className="event-hero-symbol">
          <Icon name={event.activityIcon} size={72} />
        </b>
        <strong className="event-hero-category">{event.type}</strong>
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
          onClick={() => void onToggleSaved(event.id)}
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
        {event.description && <p className="event-description">{event.description}</p>}
        <div className="event-facts">
          <div>
            <span>
              <Icon name="calendar" size={19} />
            </span>
            <p>
              <strong>{event.time}</strong>
              <small>Event date and time</small>
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
              <p>
                {event.attendeeCount ?? Math.max(1, (event.capacity ?? 4) - event.spots)} of{" "}
                {event.capacity ?? 4} verified students joined
              </p>
            </div>
            <span>
              {event.spots} spot{event.spots === 1 ? "" : "s"} left
            </span>
          </div>
          <div className="member-list">
            <div>
              <div className="mini-avatar peach">{event.host[0]}</div>
              <p>
                <strong>{event.host}</strong>
                <small>Host · Verified student</small>
              </p>
              <span>Host</span>
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
        {isHost && (
          <section className="host-event-actions">
            <button onClick={() => onEdit(event)}>Edit activity</button>
            <button
              disabled={actionLoading}
              onClick={() => {
                if (window.confirm("Cancel this activity? It will be removed for everyone."))
                  void onCancel(event.id);
              }}
            >
              {actionLoading ? "Cancelling…" : "Cancel activity"}
            </button>
          </section>
        )}
      </main>

      <div className="event-action">
        <div>
          <strong>Free</strong>
          <span>
            {event.spots} spot{event.spots === 1 ? "" : "s"} available
          </span>
        </div>
        {isHost ? (
          <button className="joined-event-button" onClick={() => onEdit(event)}>
            Manage activity
          </button>
        ) : (
          <button
            className={isJoined ? "joined-event-button" : ""}
            disabled={actionLoading || (!isJoined && event.spots <= 0)}
            onClick={() => (isJoined ? setLeaveDialogOpen(true) : void onJoin(event.id))}
          >
            {actionLoading ? (
              "Updating…"
            ) : isJoined ? (
              <>
                <Icon name="check" size={18} /> You’re going · Leave
              </>
            ) : (
              "Join group"
            )}
          </button>
        )}
      </div>

      {actionError && (
        <div className="event-action-error" role="alert">
          {actionError}
        </div>
      )}

      {leaveDialogOpen && (
        <div className="leave-dialog-backdrop" role="presentation">
          <section
            className="leave-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-dialog-title"
          >
            <header>
              <span>
                <Icon name="calendar" size={19} />
              </span>
              <div>
                <h2 id="leave-dialog-title">Leave this activity?</h2>
                <p>Your spot will immediately become available to someone else.</p>
              </div>
            </header>

            <label htmlFor="leave-reason">Why are you leaving?</label>
            <select
              id="leave-reason"
              value={leaveReason}
              onChange={(changeEvent) => setLeaveReason(changeEvent.target.value)}
            >
              <option value="">Choose a reason</option>
              <option value="Schedule conflict">Schedule conflict</option>
              <option value="Transportation issue">Transportation issue</option>
              <option value="No longer interested">No longer interested</option>
              <option value="Personal reason">Personal reason</option>
              <option value="Other">Other</option>
            </select>

            <p className="leave-dialog-note">
              This reason stays private and helps the host understand attendance changes.
            </p>

            <div className="leave-dialog-actions">
              <button type="button" onClick={() => setLeaveDialogOpen(false)}>
                Keep my spot
              </button>
              <button
                type="button"
                disabled={!leaveReason || actionLoading}
                onClick={() => void submitLeave()}
              >
                {actionLoading ? "Leaving…" : "Confirm leave"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
