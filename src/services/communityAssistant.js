/**
 * Provider-neutral assistant contract.
 * respond({ history, userContext, gatherings, filters }) => AssistantResponse
 *
 * TODO(OpenAI): replace MockCommunityAssistantService with an implementation that
 * maps model tool calls to safe app actions such as search_gatherings and
 * create_gathering_draft. The model should never receive direct database access.
 */

const lower = (value = '') => value.toLowerCase();

function inferDraft(message) {
  const text = lower(message);
  const isBasketball = text.includes('basketball');
  const isStudy = text.includes('study');
  const isGuitar = text.includes('guitar');
  const timeMatch = message.match(/(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let time = text.includes('afternoon') ? '2:00 PM' : text.includes('evening') ? '6:00 PM' : '';
  if (timeMatch) {
    const hour = timeMatch[1];
    const mins = timeMatch[2] || '00';
    const suffix = (timeMatch[3] || (Number(hour) < 8 ? 'PM' : 'AM')).toUpperCase();
    time = `${hour}:${mins} ${suffix}`;
  }
  return {
    title: isBasketball ? 'Basketball game' : isStudy ? 'Study group' : isGuitar ? 'Casual guitar practice' : 'Community gathering',
    category: isBasketball ? 'Sports & Fitness' : isStudy ? 'Learning' : isGuitar ? 'Music' : 'Community',
    day: text.includes('tomorrow') ? 'Tomorrow' : text.includes('sunday') ? 'Sunday' : 'Date not selected',
    time: time || 'Time not selected',
    capacity: 5,
    instantJoin: true,
    location: '',
    description: '',
  };
}

function search(message, items) {
  const text = lower(message);
  let results = [...items];
  const terms = [
    [['basketball', 'sports', 'game'], (g) => g.category.includes('Sports')],
    [['startup', 'founder', 'side project', 'building', 'build'], (g) => g.category.includes('Tech')],
    [['music', 'musician', 'guitar', 'instrument'], (g) => g.category === 'Music'],
    [['study', 'learn', 'language'], (g) => g.category === 'Learning'],
    [['walk', 'outdoor', 'hike'], (g) => g.category === 'Outdoors'],
  ];
  const matched = terms.find(([words]) => words.some((word) => text.includes(word)));
  if (matched) results = results.filter(matched[1]);
  if (text.includes('tonight') || text.includes('today')) results = results.filter((g) => g.dateKey === 'today');
  if (text.includes('tomorrow')) results = results.filter((g) => g.dateKey === 'tomorrow');
  if (text.includes('weekend') || text.includes('saturday') || text.includes('sunday')) results = results.filter((g) => g.dateKey === 'weekend');
  if (text.includes('morning')) results = results.filter((g) => g.period === 'morning');
  if (text.includes('afternoon') || text.includes('later')) results = results.filter((g) => g.period === 'afternoon' || (text.includes('later') && g.period === 'evening'));
  if (text.includes('evening')) results = results.filter((g) => g.period === 'evening');
  if (text.includes('instant') || text.includes('immediately') || text.includes('no approval')) results = results.filter((g) => g.instantJoin);
  if (text.includes('spot') || text.includes('available')) results = results.filter((g) => g.attendees < g.capacity);
  if (text.includes('newcomer') || text.includes('beginner')) results = results.filter((g) => g.newcomers);
  return results;
}

export class MockCommunityAssistantService {
  async respond({ history, gatherings }) {
    await new Promise((resolve) => setTimeout(resolve, 650));
    const message = history.at(-1)?.content || '';
    const text = lower(message);
    if (text.includes('error demo')) throw new Error('Mock service error');

    const createIntent = /help me (create|organize|start)|organize a|create a/.test(text);
    const noResultIntent = ['guitar', 'pottery', 'chess', 'surfing'].some((word) => text.includes(word));
    if (createIntent) {
      return {
        text: "Sure. Here’s what I have so far.",
        actions: [{ type: 'gathering_draft', draft: inferDraft(message) }],
      };
    }
    if (noResultIntent) {
      return {
        text: "I couldn’t find a small group doing that right now. Want to start one?",
        actions: [{ type: 'create_gathering', draft: inferDraft(message) }],
      };
    }
    let results = search(message, gatherings);
    if (text.includes('later') && !results.length) results = gatherings.filter((g) => g.period === 'evening').slice(0, 1);
    if (!results.length) {
      return { text: "I couldn’t find a small group doing that right now. Want to start one?", actions: [{ type: 'create_gathering', draft: inferDraft(message) }] };
    }
    const instant = text.includes('instant') || text.includes('immediately');
    return {
      text: instant ? "Sure. These don’t require host approval." : results.length === 1 ? 'I found one small group that fits.' : 'I found a couple of small groups you might like.',
      actions: [{ type: 'gathering_recommendations', gatheringIds: results.slice(0, 2).map((g) => g.id) }],
    };
  }
}

export const communityAssistant = new MockCommunityAssistantService();
