import type { Trivia } from '@/services/trivia.service';

// Mock trivia data to use as fallback if Excel loading fails
export const mockTriviaData: Trivia[] = [
  {
    id: 1,
    title: 'Trivia Time!',
    content: 'The smallest active volcano in the world is Taal Volcano in the Philippines at just 311 meters tall!',
    category: 'volcanoes'
  },
  {
    id: 2,
    title: 'Did You Know?',
    content: 'The Philippines has more than 50 potentially active volcanoes.',
    category: 'volcanoes'
  },
  {
    id: 3,
    title: 'Fun Fact!',
    content: 'The Philippines is home to around 300 volcanoes scattered across its islands.',
    category: 'volcanoes'
  },
  {
    id: 4,
    title: 'Keep in Mind!',
    content: 'There are 24 active volcanoes in the Philippines, and they are continuously monitored for safety.',
    category: 'volcanoes'
  },
  {
    id: 5,
    title: 'Trivia Time!',
    content: 'The 1991 eruption of Mount Pinatubo sent an ash cloud 35 km into the sky and caused global temperatures to drop.',
    category: 'volcanoes'
  },
  {
    id: 6,
    title: 'Did You Know?',
    content: 'The Hinatuan Enchanted River in Surigao del Sur is the deepest river in the Philippines.',
    category: 'rivers'
  },
  {
    id: 7,
    title: 'Fun Fact!',
    content: 'The Amazon River is the largest river in the world by discharge and drains through twelve South American countries.',
    category: 'rivers'
  },
  {
    id: 8,
    title: 'Fun Fact!',
    content: 'The Davao River is the 10th longest river in the Philippines and flows through Davao City.',
    category: 'rivers'
  },
  {
    id: 9,
    title: 'Trivia Time!',
    content: 'Lake Lanao, the second-largest lake in the Philippines, is an ancient caldera stretching over 6,650 km.',
    category: 'lakes'
  },
  {
    id: 10,
    title: 'Interesting Fact!',
    content: 'The Congo River in Africa is the deepest river in the world, reaching depths over 220 meters.',
    category: 'rivers'
  },
  {
    id: 11,
    title: 'Interesting Fact!',
    content: 'Granite rock forms from cooling magma beneath Earth\'s surface, creating large crystal structures due to the slow cooling process.',
    category: 'rocks'
  },
  {
    id: 12,
    title: 'Did You Know?',
    content: 'Limestone is primarily composed of calcium carbonate and often contains fossils of marine organisms.',
    category: 'rocks'
  },
  {
    id: 13,
    title: 'Trivia Time!',
    content: 'Obsidian is natural volcanic glass formed when lava cools rapidly with minimal crystal growth.',
    category: 'rocks'
  },
  {
    id: 14,
    title: 'Fun Fact!',
    content: 'Diamonds are formed deep under extreme pressure and heat approximately 90-120 miles below Earth\'s surface.',
    category: 'minerals'
  },
  {
    id: 15,
    title: 'Did You Know?',
    content: 'Quartz is one of the most abundant minerals in the Earth\'s crust and is a major component of many rocks.',
    category: 'minerals'
  },
  {
    id: 16,
    title: 'Trivia Time!',
    content: 'Feldspars make up about 60% of the Earth\'s crust, making them the most common group of minerals on our planet.',
    category: 'minerals'
  },
  {
    id: 17,
    title: 'Interesting Fact!',
    content: 'Geologists use the Mohs scale to measure mineral hardness, with talc at 1 (softest) and diamond at 10 (hardest).',
    category: 'minerals'
  },
  {
    id: 18,
    title: 'Fun Fact!',
    content: 'Petrologists study rocks to understand Earth\'s history, as rocks provide a record of geological processes over time.',
    category: 'fieldwork'
  },
  {
    id: 19,
    title: 'Did You Know?',
    content: 'Field geologists use Brunton compasses to measure the orientation of rock layers in the field.',
    category: 'fieldwork'
  },
  {
    id: 20,
    title: 'Trivia Time!',
    content: 'Geological mapping involves recording rock types, structures, and geographic features to create detailed maps of an area.',
    category: 'fieldwork'
  }
]; 