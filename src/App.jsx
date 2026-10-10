import { useMemo, useRef, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Compass, MapPin, Menu, MessageCircle, Plus, RotateCcw, Search, Send, Users, X } from 'lucide-react';
import { categories, gatherings as seededGatherings } from './data/gatherings';
import { communityAssistant } from './services/communityAssistant';

const starterPrompts = [
  'Find people building side projects',
  'I want to play basketball tonight',
  'Find something social this weekend',
  'I want to meet other musicians',
  'Help me start a study group',
];

function Logo() {
  return <button className="logo" aria-label="Common Ground home"><span className="logo-mark"><i /><i /><i /></span><span>common<br />ground</span></button>;
}

function Nav({ onCreate }) {
  return <header className="topbar"><Logo /><nav><a className="active" href="#explore">Explore</a><a href="#gatherings">My gatherings</a><a href="#about">How it works</a></nav><div className="nav-actions"><button className="btn btn-dark btn-small" onClick={() => onCreate()}><Plus size={16} /> Host a gathering</button><button className="avatar" aria-label="Profile">AV</button><button className="icon-btn mobile-menu"><Menu size={20} /></button></div></header>;
}

function GatheringCard({ gathering, compact = false, onView, onJoin, joined }) {
  const spots = gathering.capacity - gathering.attendees;
  return <article className={`gathering-card ${compact ? 'compact' : ''}`}>
    <div className={`card-band ${gathering.accent}`}><span>{gathering.category}</span>{gathering.newcomers && <span className="newcomer">Newcomers welcome</span>}</div>
    <div className="card-body">
      <div className="card-title-row"><h3>{gathering.title}</h3>{!compact && <button className="save" aria-label="Save gathering">♡</button>}</div>
      <p className="meta"><CalendarDays size={15} /> {gathering.day} · {gathering.time}</p>
      <p className="meta"><MapPin size={15} /> {gathering.location}</p>
      {!compact && <p className="description">{gathering.description}</p>}
      <div className="people-row"><div className="faces"><span>{gathering.host[0]}</span><span>+</span></div><span>{gathering.attendees} of {gathering.capacity} people · {spots} {spots === 1 ? 'spot' : 'spots'} left</span></div>
      <div className="card-actions"><button className="btn btn-ghost" onClick={() => onView(gathering)}>View gathering</button><button className={`btn ${joined ? 'btn-joined' : 'btn-primary'}`} onClick={() => onJoin(gathering)} disabled={joined}>{joined ? <><Check size={16} /> Joined</> : gathering.instantJoin ? 'Join' : 'Request to join'}</button></div>
    </div>
  </article>;
}

function DetailModal({ gathering, onClose, onJoin, joined }) {
  if (!gathering) return null;
  return <div className="overlay" onMouseDown={onClose}><section className="modal detail-modal" onMouseDown={(e) => e.stopPropagation()}>
    <button className="modal-close" onClick={onClose}><X size={20} /></button>
    <div className={`detail-art ${gathering.accent}`}><div><span>{gathering.category}</span><strong>{gathering.day}</strong></div></div>
    <div className="detail-content"><p className="eyebrow">Hosted by {gathering.host}</p><h2>{gathering.title}</h2><p className="detail-description">{gathering.description}</p>
      <div className="detail-grid"><div><CalendarDays /><span><b>{gathering.day}</b>{gathering.time}</span></div><div><MapPin /><span><b>{gathering.location}</b>{gathering.neighborhood}</span></div><div><Users /><span><b>{gathering.attendees} going</b>{gathering.capacity - gathering.attendees} spots left</span></div></div>
      <button className={`btn full ${joined ? 'btn-joined' : 'btn-primary'}`} onClick={() => onJoin(gathering)} disabled={joined}>{joined ? 'You’re in' : gathering.instantJoin ? 'Join this gathering' : 'Request to join'}</button>
    </div>
  </section></div>;
}

function CreateModal({ draft, onClose, onPublish }) {
  const initial = { title: '', category: 'Community', day: '', time: '', location: '', capacity: 5, description: '', instantJoin: true, ...draft };
  const [form, setForm] = useState(initial);
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  return <div className="overlay"><section className="modal create-modal">
    <header><div><p className="eyebrow">Bring people together</p><h2>Create a gathering</h2></div><button className="modal-close inline" onClick={onClose}><X size={20} /></button></header>
    <div className="form-grid"><label className="wide">What are you doing?<input autoFocus value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Casual guitar practice" /></label>
      <label>Category<select value={form.category} onChange={(e) => update('category', e.target.value)}><option>Community</option><option>Sports & Fitness</option><option>Tech & Making</option><option>Music</option><option>Learning</option><option>Outdoors</option></select></label>
      <label>Group size<select value={form.capacity} onChange={(e) => update('capacity', Number(e.target.value))}><option value="4">Up to 4</option><option value="5">Up to 5</option><option value="6">Up to 6</option><option value="8">Up to 8</option></select></label>
      <label>Day<input value={form.day} onChange={(e) => update('day', e.target.value)} placeholder="Saturday" /></label><label>Time<input value={form.time} onChange={(e) => update('time', e.target.value)} placeholder="2:00 PM" /></label>
      <label className="wide">Location<input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Choose a public place" /></label>
      <label className="wide">A short note<textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What should people expect?" /></label></div>
    <div className="join-toggle"><div><b>Instant joining</b><span>People can join without approval</span></div><button className={`switch ${form.instantJoin ? 'on' : ''}`} onClick={() => update('instantJoin', !form.instantJoin)}><i /></button></div>
    <footer><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!form.title || !form.day || !form.time || !form.location} onClick={() => onPublish(form)}>Publish gathering</button></footer>
  </section></div>;
}

function DraftCard({ draft, onContinue }) {
  return <div className="draft-card"><div className="draft-top"><span>Gathering draft</span><b>Editable next</b></div><h3>{draft.title}</h3><p><CalendarDays size={15} /> {draft.day} · {draft.time}</p><p><Users size={15} /> {draft.category} · Up to {draft.capacity} people</p><p><MapPin size={15} /> {draft.location || 'Location not selected'}</p><div className="draft-note">{draft.instantJoin ? 'Instant joining' : 'Host approval'}</div><button className="btn btn-primary full" onClick={() => onContinue(draft)}>{draft.location ? 'Continue creating' : 'Add location & continue'} <ArrowRight size={16} /></button></div>;
}

function AssistantPanel({ open, onClose, gatherings, onView, onJoin, joined, onCreate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  const send = async (text = input) => {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next); setInput(''); setLoading(true); setError('');
    try {
      const response = await communityAssistant.respond({ history: next, userContext: { neighborhood: 'Tempe' }, gatherings, filters: {} });
      setMessages([...next, { role: 'assistant', content: response.text, actions: response.actions }]);
    } catch { setError('Something went wrong. Try that again.'); }
    finally { setLoading(false); }
  };
  const reset = () => { setMessages([]); setError(''); setInput(''); };
  return <><button className={`scrim ${open ? 'visible' : ''}`} onClick={onClose} aria-label="Close assistant" /><aside className={`assistant ${open ? 'open' : ''}`} aria-hidden={!open}>
    <header className="assistant-header"><div><span className="assistant-icon"><MessageCircle size={19} /></span><div><h2>Find something to do</h2><p>Common Ground guide</p></div></div><div><button className="icon-btn" onClick={reset} title="New conversation"><RotateCcw size={18} /></button><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div></header>
    <div className="conversation">
      {!messages.length && <div className="empty-assistant"><div className="empty-symbol"><span /><span /><span /></div><h3>What would you like to do?</h3><p>Tell me what you’re interested in and I’ll help you find people doing it nearby.</p><div className="prompt-list">{starterPrompts.map((prompt) => <button key={prompt} onClick={() => send(prompt)}>{prompt}<ChevronRight size={16} /></button>)}</div><div className="human-note"><Users size={17} /><span>Built to get you out into the world—not keep you chatting.</span></div></div>}
      {messages.map((message, index) => <div className={`message-wrap ${message.role === 'assistant' ? 'assistant-msg' : 'user'}`} key={`${message.role}-${index}`}><div className="message">{message.content}</div>{message.actions?.map((action, i) => <div className="action-block" key={i}>
        {action.type === 'gathering_recommendations' && action.gatheringIds.map((id) => { const gathering = gatherings.find((g) => g.id === id); return gathering ? <GatheringCard key={id} gathering={gathering} compact onView={onView} onJoin={onJoin} joined={joined.has(id)} /> : null; })}
        {action.type === 'create_gathering' && <button className="btn btn-primary create-action" onClick={() => onCreate(action.draft)}><Plus size={17} /> Create a gathering</button>}
        {action.type === 'gathering_draft' && <DraftCard draft={action.draft} onContinue={onCreate} />}
      </div>)}</div>)}
      {loading && <div className="message-wrap assistant-msg"><div className="typing"><i /><i /><i /></div></div>}
      {error && <div className="error-box">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
      <div ref={endRef} />
    </div>
    <div className="composer"><div><textarea rows="1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="What do you feel like doing?" /><button onClick={() => send()} disabled={!input.trim() || loading} aria-label="Send"><Send size={18} /></button></div><p>Suggestions use real gatherings from Common Ground.</p></div>
  </aside></>;
}

export default function App() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [createDraft, setCreateDraft] = useState(null);
  const [creating, setCreating] = useState(false);
  const [joined, setJoined] = useState(new Set());
  const [toast, setToast] = useState('');
  const [allGatherings, setAllGatherings] = useState(seededGatherings);
  const filtered = useMemo(() => allGatherings.filter((g) => {
    const q = query.toLowerCase();
    const queryMatch = !q || [g.title, g.category, g.location, g.description].some((v) => v.toLowerCase().includes(q));
    const categoryMatch = activeCategory === 'All' || (activeCategory === 'Today' && g.dateKey === 'today') || (activeCategory === 'This weekend' && g.dateKey === 'weekend') || g.category.toLowerCase().includes(activeCategory.toLowerCase());
    return queryMatch && categoryMatch;
  }), [query, activeCategory, allGatherings]);
  const flash = (text) => { setToast(text); setTimeout(() => setToast(''), 2600); };
  const handleJoin = (g) => { setJoined((prev) => new Set([...prev, g.id])); flash(`You joined “${g.title}”`); };
  const openCreate = (draft = {}) => { setCreateDraft(draft); setCreating(true); setAssistantOpen(false); };
  const publish = (form) => {
    const item = { ...form, id: `created-${Date.now()}`, day: form.day, dateKey: form.day.toLowerCase().includes('tomorrow') ? 'tomorrow' : 'weekend', period: form.time.toLowerCase().includes('am') ? 'morning' : 'evening', attendees: 1, neighborhood: 'Tempe', host: 'You', newcomers: true, accent: 'blue' };
    setAllGatherings((prev) => [item, ...prev]); setCreating(false); flash('Your gathering is live'); setActiveCategory('All');
  };
  return <div className="app-shell"><Nav onCreate={openCreate} />
    <main id="explore"><section className="hero"><div className="hero-copy"><p className="eyebrow">Around Tempe · This week</p><h1>Small gatherings.<br /><em>Real connection.</em></h1><p>Find a few people doing something you’re into. Join in, show up, and see what happens.</p><div className="hero-actions"><button className="btn btn-dark" onClick={() => document.getElementById('gatherings')?.scrollIntoView({ behavior: 'smooth' })}>Explore gatherings <ArrowRight size={17} /></button><button className="btn assistant-trigger" onClick={() => setAssistantOpen(true)}><MessageCircle size={18} /> Help me find something</button></div></div><div className="hero-art" aria-hidden="true"><div className="sun" /><div className="hill hill-one" /><div className="hill hill-two" /><div className="people-art"><i /><i /><i /><i /></div><span className="art-note">People nearby are<br />making plans</span></div></section>
      <section className="explore-section" id="gatherings"><div className="section-heading"><div><p className="eyebrow">Make a plan</p><h2>What’s happening nearby</h2></div><p>Small groups, shared interests, and a reason to get out the door.</p></div>
        <div className="search-row"><label className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search gatherings, interests, places" /></label><div className="category-scroller">{categories.map((cat) => <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>{cat}</button>)}</div></div>
        {filtered.length ? <div className="gathering-grid">{filtered.map((g) => <GatheringCard key={g.id} gathering={g} onView={setSelected} onJoin={handleJoin} joined={joined.has(g.id)} />)}</div> : <div className="no-results"><Compass size={28} /><h3>Nothing here yet</h3><p>Try a different filter, or make the first plan.</p><button className="btn btn-primary" onClick={() => openCreate({})}>Create a gathering</button></div>}
      </section>
      <section className="principle" id="about"><span className="quote-mark">“</span><p>Technology should help us find each other—<em>then get out of the way.</em></p><div><span /><span /><span /></div></section>
    </main>
    <footer className="site-footer"><Logo /><p>Made for showing up.</p><span>© 2026 Common Ground</span></footer>
    <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} gatherings={allGatherings} onView={setSelected} onJoin={handleJoin} joined={joined} onCreate={openCreate} />
    <DetailModal gathering={selected} onClose={() => setSelected(null)} onJoin={handleJoin} joined={selected ? joined.has(selected.id) : false} />
    {creating && <CreateModal key={JSON.stringify(createDraft)} draft={createDraft} onClose={() => setCreating(false)} onPublish={publish} />}
    {toast && <div className="toast"><Check size={17} /> {toast}</div>}
  </div>;
}
