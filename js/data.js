/* Kids Routines — el catálogo de rutinas de fábrica.
   Inglés británico, frases cortas y una palabra clave por rutina: la niña oye la
   frase entera y repite sólo la palabra. Los padres pueden cambiarlo todo desde
   la zona de padres, y activar o desactivar cada una.

   Vienen muchas a propósito: así cada familia enciende las suyas en vez de
   tener que escribirlas. Las marcadas enabled:false existen pero no salen en la
   pantalla hasta que se activan. */

const DEFAULT_ROUTINES = [

  /* ══════════════ MAÑANA ══════════════ */
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
    id: 'make-bed', period: 'morning', emoji: '🛏️', enabled: true,
    name: 'Make your bed',
    phrase: "It's time to make your bed!",
    word: 'bed',
    done: 'You made your bed! It looks lovely!',
    steps: [
      { text: 'Pull up the sheet.', emoji: '🛏️' },
      { text: 'Put the pillow on top.', emoji: '🧸' }
    ],
    count: 0
  },
  {
    id: 'toilet-am', period: 'morning', emoji: '🚽', enabled: true,
    name: 'Go to the toilet',
    phrase: "It's time to go to the toilet!",
    word: 'toilet',
    done: 'You went to the toilet!',
    steps: [
      { text: 'Sit on the toilet.', emoji: '🚽' },
      { text: 'Use the toilet paper.', emoji: '🧻' },
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
    id: 'face', period: 'morning', emoji: '🧴', enabled: true,
    name: 'Wash your face',
    phrase: "It's time to wash your face!",
    word: 'face',
    done: 'You washed your face! So fresh!',
    steps: [
      { text: 'Splash water on your face.', emoji: '💦' },
      { text: 'Dry it with the towel.', emoji: '🧻' }
    ],
    count: 0
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
    id: 'sun-cream', period: 'morning', emoji: '🧴', enabled: false,
    name: 'Sun cream',
    phrase: "It's time to put on sun cream!",
    word: 'sun cream',
    done: 'You put on sun cream! Now you are safe in the sun!',
    steps: [
      { text: 'Cream on your face.', emoji: '😊' },
      { text: 'Cream on your arms.', emoji: '💪' },
      { text: 'Cream on your legs.', emoji: '🦵' }
    ],
    count: 0
  },
  {
    id: 'school-bag', period: 'morning', emoji: '🎒', enabled: true,
    name: 'Pack your school bag',
    phrase: "It's time to pack your school bag!",
    word: 'school bag',
    done: 'Your school bag is ready!',
    steps: [
      { text: 'Put your lunch box in.', emoji: '🍱' },
      { text: 'Put your water bottle in.', emoji: '🧃' },
      { text: 'Put your folder in.', emoji: '📁' }
    ],
    count: 0
  },
  {
    id: 'school', period: 'morning', emoji: '🚗', enabled: true,
    name: 'Off to school',
    phrase: "It's time to go to school!",
    word: 'school',
    done: 'You are ready for school! Have a lovely day!',
    steps: [
      { text: 'Put on your coat.', emoji: '🧥' },
      { text: 'Take your school bag.', emoji: '🎒' },
      { text: 'Say goodbye!', emoji: '👋' }
    ],
    count: 0
  },

  /* ══════════════ TARDE ══════════════ */
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
      { text: 'Drink some water.', emoji: '💧' },
      { text: 'Eat your vegetables too!', emoji: '🥦' }
    ],
    count: 0
  },
  {
    id: 'clear-table', period: 'afternoon', emoji: '🍽️', enabled: true,
    name: 'Clear the table',
    phrase: "It's time to clear the table!",
    word: 'plate',
    done: 'You cleared the table! What a helper!',
    steps: [
      { text: 'Take your plate to the kitchen.', emoji: '🍽️' },
      { text: 'Wipe the table.', emoji: '🧽' }
    ],
    count: 0
  },
  {
    id: 'homework', period: 'afternoon', emoji: '✏️', enabled: true,
    name: 'School work',
    phrase: "It's time to do your school work!",
    word: 'pencil',
    done: 'You did your school work! Clever girl!',
    steps: [
      { text: 'Sit at your desk.', emoji: '🪑' },
      { text: 'Open your book.', emoji: '📖' },
      { text: 'Take your pencil.', emoji: '✏️' },
      { text: 'Finish your work.', emoji: '⭐' }
    ],
    count: 0
  },
  {
    id: 'book', period: 'afternoon', emoji: '📚', enabled: true,
    name: 'Read a book',
    phrase: "It's time to read a book!",
    word: 'book',
    done: 'You read a book! Amazing!',
    steps: [],
    count: 0
  },
  {
    id: 'snack', period: 'afternoon', emoji: '🍎', enabled: true,
    name: 'Snack time',
    phrase: "It's time for a snack!",
    word: 'apple',
    done: 'You had your snack!',
    steps: [
      { text: 'Wash your hands first.', emoji: '🧼' },
      { text: 'Eat your fruit.', emoji: '🍎' }
    ],
    count: 0
  },
  {
    id: 'play-outside', period: 'afternoon', emoji: '🛝', enabled: true,
    name: 'Play outside',
    phrase: "It's time to play outside!",
    word: 'park',
    done: 'You played outside! That was fun!',
    steps: [
      { text: 'Put on your shoes.', emoji: '👟' },
      { text: 'Put on your coat.', emoji: '🧥' },
      { text: 'Run and jump!', emoji: '🏃' }
    ],
    count: 0
  },
  {
    id: 'dance', period: 'afternoon', emoji: '🎵', enabled: true,
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
  {
    id: 'tidy', period: 'afternoon', emoji: '🧸', enabled: true,
    name: 'Tidy your toys',
    phrase: "It's time to tidy up your toys!",
    word: 'toys',
    done: 'You tidied up your toys! Amazing!',
    steps: [
      { text: 'Pick up your toys.', emoji: '🧸' },
      { text: 'Put them in the box.', emoji: '📦' },
      { text: 'Books back on the shelf.', emoji: '📚' }
    ],
    count: 10
  },
  {
    id: 'help', period: 'afternoon', emoji: '🧺', enabled: false,
    name: 'Help at home',
    phrase: "It's time to help at home!",
    word: 'help',
    done: 'You helped at home! Thank you!',
    steps: [
      { text: 'Put your clothes in the basket.', emoji: '🧺' },
      { text: 'Water the plants.', emoji: '🪴' }
    ],
    count: 0
  },
  {
    id: 'pet', period: 'afternoon', emoji: '🐶', enabled: false,
    name: 'Feed the pet',
    phrase: "It's time to feed the pet!",
    word: 'pet',
    done: 'You fed your pet! Good friend!',
    steps: [
      { text: 'Fill the food bowl.', emoji: '🥣' },
      { text: 'Fill the water bowl.', emoji: '💧' }
    ],
    count: 0
  },
  {
    id: 'water', period: 'afternoon', emoji: '💧', enabled: false,
    name: 'Drink water',
    phrase: "It's time to drink some water!",
    word: 'water',
    done: 'You drank your water! Well done!',
    steps: [],
    count: 0
  },
  {
    id: 'screen-off', period: 'afternoon', emoji: '📺', enabled: false,
    name: 'Screen off',
    phrase: "It's time to turn off the telly!",
    word: 'telly',
    done: 'You turned off the telly all by yourself!',
    steps: [],
    count: 5
  },

  /* ══════════════ NOCHE ══════════════ */
  {
    id: 'hands-eve', period: 'evening', emoji: '🧼', enabled: false,
    name: 'Wash your hands',
    phrase: "It's time to wash your hands before dinner!",
    word: 'hands',
    done: 'You washed your hands!',
    steps: [
      { text: 'Use the soap.', emoji: '🧼' },
      { text: 'Rub, rub, rub!', emoji: '🙌' }
    ],
    count: 10
  },
  {
    id: 'dinner', period: 'evening', emoji: '🍝', enabled: true,
    name: 'Have dinner',
    phrase: "It's time to have dinner!",
    word: 'dinner',
    done: 'You had dinner! Great job!',
    steps: [
      { text: 'Sit at the table.', emoji: '🪑' },
      { text: 'Eat your dinner.', emoji: '🍝' },
      { text: 'Say thank you!', emoji: '😊' }
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
      { text: 'Wash your body.', emoji: '🧽' },
      { text: 'Wash your hair.', emoji: '🧴' },
      { text: 'Dry yourself with the towel.', emoji: '🧻' }
    ],
    count: 0
  },
  {
    id: 'shower', period: 'evening', emoji: '🚿', enabled: false,
    name: 'Have a shower',
    phrase: "It's time to have a shower!",
    word: 'shower',
    done: 'You had a shower! All clean!',
    steps: [
      { text: 'Get in the shower.', emoji: '🚿' },
      { text: 'Wash your body with soap.', emoji: '🧼' },
      { text: 'Rinse it all off.', emoji: '💦' }
    ],
    count: 0
  },
  {
    id: 'pyjamas', period: 'evening', emoji: '🌙', enabled: true,
    name: 'Put on pyjamas',
    phrase: "It's time to put on your pyjamas!",
    word: 'pyjamas',
    done: 'You put on your pyjamas!',
    steps: [
      { text: 'Put on your pyjama top.', emoji: '👚' },
      { text: 'Put on your pyjama trousers.', emoji: '👖' }
    ],
    count: 0
  },
  {
    id: 'clothes-away', period: 'evening', emoji: '🧺', enabled: true,
    name: 'Clothes away',
    phrase: "It's time to put your clothes in the basket!",
    word: 'clothes',
    done: 'Your clothes are away! What a helper!',
    steps: [],
    count: 0
  },
  {
    id: 'toilet-pm', period: 'evening', emoji: '🚽', enabled: true,
    name: 'Go to the toilet',
    phrase: "It's time to go to the toilet before bed!",
    word: 'toilet',
    done: 'You went to the toilet!',
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
    id: 'tidy-pm', period: 'evening', emoji: '🧸', enabled: false,
    name: 'Tidy your room',
    phrase: "It's time to tidy your room!",
    word: 'room',
    done: 'Your room is tidy! Wonderful!',
    steps: [
      { text: 'Toys in the box.', emoji: '📦' },
      { text: 'Books on the shelf.', emoji: '📚' }
    ],
    count: 10
  },
  {
    id: 'bag-tomorrow', period: 'evening', emoji: '🎒', enabled: false,
    name: 'Ready for tomorrow',
    phrase: "It's time to get ready for tomorrow!",
    word: 'tomorrow',
    done: 'Everything is ready for tomorrow!',
    steps: [
      { text: 'Choose your clothes.', emoji: '👗' },
      { text: 'Put them on the chair.', emoji: '🪑' },
      { text: 'Your school bag by the door.', emoji: '🎒' }
    ],
    count: 0
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
    id: 'hug', period: 'evening', emoji: '🤗', enabled: false,
    name: 'Goodnight hug',
    phrase: "It's time for a big goodnight hug!",
    word: 'hug',
    done: 'What a lovely hug!',
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

/* Sube este número al añadir rutinas nuevas al catálogo: los móviles que ya
   tengan la app se las encontrarán la próxima vez, sin perder lo que hayan
   editado ni lo que hayan desactivado. */
const CATALOG_VERSION = 2;

/* piropos en inglés — se dicen al celebrar */
const PRAISE = [
  'Great job!', 'Well done!', 'Amazing!', 'Fantastic!',
  "You're a superstar!", 'Brilliant!', 'High five!', 'Wonderful!', 'Yay! You did it!'
];

const PERIOD_LABEL = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const PERIOD_HELLO = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' };
