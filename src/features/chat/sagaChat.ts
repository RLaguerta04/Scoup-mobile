// Mock "Saga" chat logic — the newsletter AI assistant. The web streams a real LLM with
// tool calls + memory; mobile scripts contextual answers so the UX (ask → grounded answer)
// is identical. Pure: no side effects, no RNG.

export type SagaView = 'feed' | 'dashboard' | 'report' | 'map' | 'settings';

export const SAGA_DESCRIPTION =
  'Ask questions to understand the content better. I can summarize, analyze, and extract insights.';

export const SAGA_VIEW: Record<SagaView, { title: string; starters: string[] }> = {
  feed: {
    title: 'Ask about this daily feed',
    starters: [
      'What’s driving the top story?',
      'Summarise this week’s coverage',
      'Which stories are gaining fastest?',
    ],
  },
  dashboard: {
    title: 'Ask about this story map',
    starters: [
      'Where did most stories happen?',
      'What’s the sentiment split?',
      'Which outlet leads coverage?',
    ],
  },
  report: {
    title: 'Ask about this edition',
    starters: [
      'What needs a response this week?',
      'Summarise the crises open',
      'What should I act on first?',
    ],
  },
  map: {
    title: 'Ask about this local map',
    starters: [
      'What’s the mood in Taguig?',
      'Which pages are most active?',
      'What are the top posts?',
    ],
  },
  settings: {
    title: 'Ask about this newsletter',
    starters: ['What does this newsletter track?', 'How are the buckets set up?'],
  },
};

// A reply plus the agentic flourish shown above it ("3 steps · 5.6s · 1 memory").
export interface SagaTurn {
  reply: string;
  steps: number;
  seconds: string;
  memory: number;
}

const turn = (reply: string, steps = 3, seconds = '5.6s', memory = 0): SagaTurn => ({
  reply,
  steps,
  seconds,
  memory,
});

// Rule-based, grounded in the sample feed. First match wins.
export function respondToSaga(text: string, _view: SagaView): SagaTurn {
  const q = text.toLowerCase();

  if (/(favou?rite|favorite).*(food|eat)|what.*(eat|food)/.test(q)) {
    return turn(
      'I don’t know — nothing in this chat or your account’s stored preferences says what you like to eat, and your favorite food isn’t something Scoup’s data would hold.\n\nThis chat is built around your Scoup coverage and the feed you have open; where it’s genuinely useful is what’s in that feed this week — which clips are drawing the most pickup and what’s behind them.',
      3,
      '5.6s',
      1,
    );
  }
  if (/(summar|overview|recap|this week|what.?s new)/.test(q)) {
    return turn(
      'This week’s feed is led by “Consumer prices ease for third straight month” (14 articles, 289 posts, +89.5K weighted engagement), with “Tourism arrivals rebound to pre-pandemic levels” close behind on social (526 posts). Online outlets drove the early pickup; broadcast built through the week and social chatter rose each evening. Overall volume is up on the prior period, and tone skews positive.',
      4,
      '6.1s',
    );
  }
  if (/(top|driving|lead|biggest|number one|#1|most)/.test(q)) {
    return turn(
      'The top story is “Consumer prices ease for third straight month” — 14 articles across MediaWatch plus 289 posts and 3,757 comments. It’s led by online business desks framing it as good news on inflation, and the pickup is widening rather than fading. If you want to amplify, that’s the clip with the most room to run.',
      3,
      '4.8s',
    );
  }
  if (/(sentiment|mood|tone|felt|positive|negative)/.test(q)) {
    return turn(
      'Tone across these stories is net positive. On the loudest places the split runs roughly Positive 36% · Neutral 35% · Negative 29%, with “Curiosity” the most common emotion. The negative share clusters around regulatory and service-quality angles, not the inflation story itself.',
      3,
      '5.2s',
    );
  }
  if (/(crisis|crises|act|respond|response|watch|decide|priority)/.test(q)) {
    return turn(
      'One issue needs a response this week: “Senate probes dropped-call complaints against carriers” — rising fast with tone turning against the carriers (priority 94/100). Two trackers are open (DPWH flood-control is escalating; the Senate probe is stable but climbing). Everything else is steady, friendly coverage you can amplify rather than correct.',
      4,
      '6.4s',
    );
  }
  if (/(where|place|location|city|map|geograph)/.test(q)) {
    return turn(
      '94 stories landed in 17 places, concentrated in Metro Manila — most in Quezon City (10), then Makati (8) and Mandaluyong (8). Seven stories weren’t placed in a city. Taguig is the liveliest locally right now at 76 posts over the last 7 days.',
      3,
      '5.0s',
    );
  }

  return turn(
    'I can summarise what’s here, pull out which stories are gaining fastest, break down sentiment, or dig into any single story. Ask me about the coverage — for example, “what’s driving the top story?” or “what needs a response this week?”',
    2,
    '3.4s',
  );
}
