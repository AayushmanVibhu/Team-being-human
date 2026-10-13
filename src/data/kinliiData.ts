import type { IconName } from "../components/ui/Icon";

export const interests = [
  ["Outdoors", "Trail walks, picnics", "sun"],
  ["Sports", "Badminton, volleyball", "ball"],
  ["Music", "Concerts, jam sessions", "music"],
  ["Creative", "Dance, photo, art", "brush"],
  ["Games", "Board games, trivia", "dice"],
  ["Books", "Book clubs, writing", "book"],
  ["Food", "Cooking, café hopping", "food"],
  ["Movies", "Film nights, cinema", "film"],
];

export const questions = [
  {
    title: "Your ideal Friday night is...",
    subtitle: "Choose what feels most like you.",
    options: [
      ["A small dinner with a few close friends", "Cozy & connected", 1, 2],
      ["Trying a new activity with new people", "Open & adventurous", 2, 0],
      ["A big event with lots of energy", "Social & spontaneous", 3, 0],
      ["A quiet night to recharge", "Calm & reflective", 0, 3],
    ],
  },
  {
    title: "In a new group, you usually...",
    subtitle: "There are no wrong answers.",
    options: [
      ["Listen first, then join the conversation", "Thoughtful", 0, 2],
      ["Introduce yourself to one person", "Intentional", 1, 2],
      ["Bring everyone into the conversation", "Welcoming", 3, 1],
      ["Suggest something fun to do together", "Playful", 3, 0],
    ],
  },
  {
    title: "What makes a meetup feel good?",
    subtitle: "This helps us find your people.",
    options: [
      ["Knowing what to expect ahead of time", "Prepared", 1, 3],
      ["Having an interest to talk about", "Curious", 2, 1],
      ["A friendly host who breaks the ice", "Supported", 1, 2],
      ["The freedom to leave whenever I want", "Low pressure", 0, 0],
    ],
  },
  {
    title: "What role feels natural in a group?",
    subtitle: "Think about a group where you feel comfortable.",
    options: [
      ["I observe and add something when it matters", "Thoughtful observer", 0, 2],
      ["I make sure everyone feels included", "Supportive connector", 2, 2],
      ["I organize the plan and keep things moving", "Confident planner", 3, 3],
      ["I bring energy and spontaneous ideas", "Creative spark", 3, 0],
    ],
  },
  {
    title: "How do you like plans to happen?",
    subtitle: "This shapes the events we recommend.",
    options: [
      ["Tell me the details well in advance", "Planned & prepared", 1, 3],
      ["Give me a simple plan with some flexibility", "Balanced", 2, 2],
      ["Invite me the day before and I’ll decide", "Go with the flow", 2, 1],
      ["I love a last-minute invitation", "Spontaneous", 3, 0],
    ],
  },
];

export const events = [
  {
    id: 1,
    title: "Sunset badminton",
    type: "Sports",
    image:
      "https://images.unsplash.com/photo-1723074832950-9fb031b0f4ec?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Today · 5:30 PM",
    place: "SDFC courts",
    distance: "0.4 mi",
    match: 96,
    spots: 2,
    host: "Maya",
    activityIcon: "racquet" as IconName,
    tags: ["Badminton", "Beginner friendly", "Low-key"],
  },
  {
    id: 2,
    title: "Papago sunrise walk",
    type: "Outdoors",
    image:
      "https://images.unsplash.com/photo-1726156372736-ce2229e7cf0a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Tomorrow · 7:00 AM",
    place: "Papago Park",
    distance: "2.1 mi",
    match: 92,
    spots: 3,
    host: "Noah",
    activityIcon: "trail" as IconName,
    tags: ["Hiking", "Photography", "Carpool"],
  },
  {
    id: 3,
    title: "K-pop dance cover",
    type: "Creative",
    image:
      "https://images.unsplash.com/photo-1787724691088-76ed8e29dbc8?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=900",
    time: "Friday · 6:00 PM",
    place: "Student Pavilion",
    distance: "0.7 mi",
    match: 87,
    spots: 3,
    host: "Jules",
    activityIcon: "dance" as IconName,
    tags: ["K-pop", "Dance", "Creative"],
  },
];

export type KinliiEvent = (typeof events)[number];
