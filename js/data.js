/* Shine Time — las rutinas que trae de fábrica.
   Inglés británico, frases cortas y una palabra clave por rutina: la niña oye la
   frase entera, y repite sólo la palabra. Los padres pueden cambiarlo todo. */

const DEFAULT_ROUTINES = [
  /* ─────────── mañana ─────────── */
  {
    id: 'wake', period: 'morning', emoji: '☀️', enabled: true,
    name: 'Wake up',
    phrase: "Good morning! It's time to wake up!",
    word: 'wake up',
    done: 'You woke up! Good morning!',
    steps: [
      { text: 'Open your eyes.', emoji: '👀' },
      { text: 'Stretch your arms up high!', emoji: '🙆' },
      { text: 'Out of bed!', emoji: '🛏️' }
    ],
    count: 0
  },
  {
    id: 'toilet', period: 'morning', emoji: '🚽', enabled: true,
    name: 'Go to the toilet',
    phrase: "It's time to go to the toilet!",
    word: 'toilet',
    done: 'You went to the toilet!',
    steps: [
      { text: 'Sit on the toilet.', emoji: '🚽' },
      { text: 'Flush the toilet!', emoji: '💧' }
    ],
    count: 0
  },
  {
    id: 'hands-am', period: 'morning', emoji: '🧼', enabled: true,
    name: 'Wash your hands',
    phrase: "It's time to wash your hands!",
    word: 'soap',
    done: 'You washed your hands!',
    steps: [
      { text: 'Turn on the water.', emoji: '🚰' },
      { text: 'Use the soap.', emoji: '🧼' },
      { text: 'Rub, rub, rub!', emoji: '🙌' },
      { text: 'Rinse and dry your hands.', emoji: '🤲' }
    ],
    count: 10
  },
  {
    id: 'teeth-am', period: 'morning', emoji: '🪥', enabled: true,
    name: 'Brush your teeth',
    phrase: "It's time to brush your teeth!",
    word: 'toothbrush',
    done: 'You brushed your teeth!',
    steps: [
      { text: 'Put toothpaste on your toothbrush.', emoji: '🪥' },
      { text: 'Brush your top teeth.', emoji: '😁' },
      { text: 'Brush your bottom teeth.', emoji: '😬' },
      { text: 'Spit and rinse!', emoji: '💦' }
    ],
    count: 20
  },
  {
    id: 'breakfast', period: 'morning', emoji: '🥣', enabled: true,
    name: 'Have breakfast',
    phrase: "It's time to have breakfast!",
    word: 'breakfast',
    done: 'You had breakfast! Yummy!',
    steps: [
      { text: 'Sit at the table.', emoji: '🪑' },
      { text: 'Drink your milk.', emoji: '🥛' },
      { text: 'Eat it all up!', emoji: '🥣' }
    ],
    count: 0
  },
  {
    id: 'dress', period: 'morning', emoji: '👕', enabled: true,
    name: 'Get dressed',
    phrase: "It's time to get dressed!",
    word: 'trousers',
    done: 'You got dressed! You look great!',
    steps: [
      { text: 'Put on your T-shirt.', emoji: '👕' },
      { text: 'Put on your trousers.', emoji: '👖' },
      { text: 'Put on your socks.', emoji: '🧦' },
      { text: 'Put on your shoes.', emoji: '👟' }
    ],
    count: 0
  },
  {
    id: 'hair', period: 'morning', emoji: '💇', enabled: true,
    name: 'Brush your hair',
    phrase: "It's time to brush your hair!",
    word: 'hair',
    done: 'You brushed your hair! So pretty!',
    steps: [],
    count: 0
  },
  {
    id: 'school', period: 'morning', emoji: '🎒', enabled: true,
    name: 'Off to school',
    phrase: "It's time to go to school! Get your school bag!",
    word: 'school bag',
    done: 'You are ready for school!',
    steps: [
      { text: 'Put on your coat.', emoji: '🧥' },
      { text: 'Take your school bag.', emoji: '🎒' },
      { text: 'Say goodbye!', emoji: '👋' }
    ],
    count: 0
  },

  /* ─────────── tarde ─────────── */
  {
    id: 'hands-pm', period: 'afternoon', emoji: '🧼', enabled: true,
    name: 'Wash your hands',
    phrase: "It's time to wash your hands before lunch!",
    word: 'water',
    done: 'You washed your hands!',
    steps: [
      { text: 'Turn on the water.', emoji: '🚰' },
      { text: 'Use the soap.', emoji: '🧼' },
      { text: 'Rub, rub, rub!', emoji: '🙌' }
    ],
    count: 10
  },
  {
    id: 'lunch', period: 'afternoon', emoji: '🍽️', enabled: true,
    name: 'Have lunch',
    phrase: "It's time to have lunch!",
    word: 'lunch',
    done: 'You had lunch! Well done!',
    steps: [
      { text: 'Sit at the table.', emoji: '🪑' },
      { text: 'Use your fork and spoon.', emoji: '🍴' },
      { text: 'Drink some water.', emoji: '💧' }
    ],
    count: 0
  },
  {
    id: 'tidy', period: 'afternoon', emoji: '🧸', enabled: true,
    name: 'Tidy your toys',
    phrase: "It's time to tidy up your toys!",
    word: 'toys',
    done: 'You tidied up your toys! Amazing!',
    steps: [
      { text: 'Pick up your toys.', emoji: '🧸' },
      { text: 'Put them in the box.', emoji: '📦' }
    ],
    count: 10
  },
  {
    id: 'book', period: 'afternoon', emoji: '📚', enabled: true,
    name: 'Read a book',
    phrase: "It's time to read a book!",
    word: 'book',
    done: 'You read a book! Clever girl!',
    steps: [],
    count: 0
  },
  {
    id: 'play', period: 'afternoon', emoji: '🎵', enabled: true,
    name: 'Dance and sing',
    phrase: "It's time to dance and sing with us!",
    word: 'dance',
    done: 'You danced with the band!',
    steps: [
      { text: 'Clap your hands!', emoji: '👏' },
      { text: 'Stamp your feet!', emoji: '🦶' },
      { text: 'Turn around!', emoji: '🌀' },
      { text: 'Jump up high!', emoji: '⬆️' }
    ],
    count: 0
  },

  /* ─────────── noche ─────────── */
  {
    id: 'dinner', period: 'evening', emoji: '🍝', enabled: true,
    name: 'Have dinner',
    phrase: "It's time to have dinner!",
    word: 'dinner',
    done: 'You had dinner! Great job!',
    steps: [
      { text: 'Sit at the table.', emoji: '🪑' },
      { text: 'Eat your dinner.', emoji: '🍝' }
    ],
    count: 0
  },
  {
    id: 'bath', period: 'evening', emoji: '🛁', enabled: true,
    name: 'Have a bath',
    phrase: "It's time to have a bath!",
    word: 'bath',
    done: 'You had a bath! You smell lovely!',
    steps: [
      { text: 'Take off your clothes.', emoji: '👚' },
      { text: 'Get in the bath.', emoji: '🛁' },
      { text: 'Wash your hair.', emoji: '🧴' },
      { text: 'Dry yourself with the towel.', emoji: '🧻' }
    ],
    count: 0
  },
  {
    id: 'pyjamas', period: 'evening', emoji: '🌙', enabled: true,
    name: 'Put on pyjamas',
    phrase: "It's time to put on your pyjamas!",
    word: 'pyjamas',
    done: 'You put on your pyjamas!',
    steps: [],
    count: 0
  },
  {
    id: 'teeth-pm', period: 'evening', emoji: '🪥', enabled: true,
    name: 'Brush your teeth',
    phrase: "It's time to brush your teeth before bed!",
    word: 'teeth',
    done: 'You brushed your teeth!',
    steps: [
      { text: 'Put toothpaste on your toothbrush.', emoji: '🪥' },
      { text: 'Brush your top teeth.', emoji: '😁' },
      { text: 'Brush your bottom teeth.', emoji: '😬' },
      { text: 'Spit and rinse!', emoji: '💦' }
    ],
    count: 20
  },
  {
    id: 'story', period: 'evening', emoji: '📖', enabled: true,
    name: 'Story time',
    phrase: "It's time for a story!",
    word: 'story',
    done: 'You listened to a story!',
    steps: [],
    count: 0
  },
  {
    id: 'bed', period: 'evening', emoji: '🛏️', enabled: true,
    name: 'Go to bed',
    phrase: "It's time to go to bed. Good night!",
    word: 'bed',
    done: 'You are in bed. Sweet dreams!',
    steps: [
      { text: 'Get into bed.', emoji: '🛏️' },
      { text: 'Close your eyes.', emoji: '😴' },
      { text: 'Good night!', emoji: '🌙' }
    ],
    count: 0
  }
];

/* piropos en inglés — se dicen al celebrar */
const PRAISE = [
  'Great job!', 'Well done!', 'Amazing!', 'Fantastic!',
  "You're a superstar!", 'Brilliant!', 'High five!', 'Wonderful!', 'Yay! You did it!'
];

const PERIOD_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const PERIOD_HELLO = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' };
