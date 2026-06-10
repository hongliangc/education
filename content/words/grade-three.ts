// Grade Three vocabulary (~300 cumulative target) — space, science, body systems, community
// roles, school subjects and more abstract concept words. Each word ships an example sentence
// (containing the word verbatim) so the sentence-context round can blank it out. Self-contained
// data leaf: the only import is the erased `GradedWord` type, so the Node test runner loads it
// directly.
import type { GradedWord } from "../words";

function w(en: string, zh: string, emoji: string, category: string, example: string): GradedWord {
  return { id: `g3-${en.replace(/\s+/g, "-")}`, grade: "G3", en, zh, emoji, category, example };
}

export const GRADE_THREE_WORDS: GradedWord[] = [
  // space
  w("planet", "行星", "🪐", "space", "Mars is a red planet."),
  w("earth", "地球", "🌍", "space", "We all live on earth."),
  w("space", "太空", "🌌", "space", "Stars shine far in space."),
  w("rocket", "火箭", "🚀", "space", "The rocket flew to the moon."),
  w("alien", "外星人", "👽", "space", "A funny alien waved at us."),
  w("comet", "彗星", "☄️", "space", "A comet has a long tail."),
  w("galaxy", "星系", "🌠", "space", "Our galaxy has many stars."),
  w("telescope", "望远镜", "🔭", "space", "I watch stars with a telescope."),
  // science & nature
  w("volcano", "火山", "🌋", "science", "The volcano spits hot lava."),
  w("desert", "沙漠", "🏜️", "science", "Camels live in the desert."),
  w("forest", "森林", "🌲", "science", "Tall trees fill the forest."),
  w("ocean", "海洋", "🌊", "science", "Whales swim in the ocean."),
  w("jungle", "丛林", "🌴", "science", "Monkeys play in the jungle."),
  w("glacier", "冰川", "🧊", "science", "The glacier is made of ice."),
  w("fossil", "化石", "🦴", "science", "We found a dinosaur fossil."),
  w("magnet", "磁铁", "🧲", "science", "The magnet picks up pins."),
  w("crystal", "水晶", "💎", "science", "The cave hides a shiny crystal."),
  w("dinosaur", "恐龙", "🦕", "science", "The dinosaur was very big."),
  // body systems
  w("heart", "心脏", "❤️", "body", "My heart beats fast when I run."),
  w("brain", "大脑", "🧠", "body", "Your brain helps you think."),
  w("bone", "骨头", "🦴", "body", "A dog likes to chew a bone."),
  w("muscle", "肌肉", "💪", "body", "Lifting boxes builds muscle."),
  w("blood", "血液", "🩸", "body", "Blood is red and warm."),
  w("lung", "肺", "🫁", "body", "We breathe air into each lung."),
  w("skin", "皮肤", "🧴", "body", "The sun warms my skin."),
  w("stomach", "胃", "🤰", "body", "My stomach growls when I am hungry."),
  // community roles
  w("scientist", "科学家", "🧑‍🔬", "community", "The scientist mixes the liquids."),
  w("engineer", "工程师", "🧑‍🔧", "community", "An engineer builds strong bridges."),
  w("dentist", "牙医", "🦷", "community", "The dentist checks my teeth."),
  w("lawyer", "律师", "⚖️", "community", "The lawyer speaks in court."),
  w("sailor", "水手", "⚓", "community", "The sailor steers the big ship."),
  w("soldier", "士兵", "🪖", "community", "The soldier marches in a line."),
  w("judge", "法官", "👨‍⚖️", "community", "The judge wears a black robe."),
  w("writer", "作家", "🖋️", "community", "The writer tells fun stories."),
  // school subjects
  w("math", "数学", "➗", "subjects", "We add numbers in math."),
  w("science", "科学", "🔬", "subjects", "We do experiments in science."),
  w("history", "历史", "📜", "subjects", "We learn about kings in history."),
  w("music", "音乐", "🎼", "subjects", "We sing songs in music."),
  w("art", "美术", "🎨", "subjects", "We paint pictures in art."),
  w("reading", "阅读", "📚", "subjects", "Reading takes me to new worlds."),
  w("spelling", "拼写", "🔤", "subjects", "Spelling helps me write words."),
  // adjectives
  w("brave", "勇敢", "🦸", "adjectives", "The brave girl saved the cat."),
  w("kind", "善良", "🤗", "adjectives", "A kind boy shared his lunch."),
  w("clever", "聪明", "🧠", "adjectives", "The clever fox tricked the dog."),
  w("gentle", "温柔", "🕊️", "adjectives", "Please be gentle with the baby."),
  w("strong", "强壮", "🏋️", "adjectives", "The strong man lifts the rock."),
  w("weak", "虚弱", "🪶", "adjectives", "The sick puppy feels weak."),
  w("heavy", "重", "🏋️", "adjectives", "The box is too heavy to lift."),
  w("light", "轻", "🎈", "adjectives", "A feather is very light."),
  w("clean", "干净", "🧼", "adjectives", "Wash your hands to keep them clean."),
  w("dirty", "脏", "🧹", "adjectives", "His muddy shoes are very dirty."),
  w("quiet", "安静", "🤫", "adjectives", "Please be quiet in the library."),
  w("loud", "吵闹", "📢", "adjectives", "The big drum makes a loud sound."),
  // verbs
  w("build", "建造", "🏗️", "verbs", "We build a tall sandcastle."),
  w("paint", "涂", "🎨", "verbs", "I paint a bright rainbow."),
  w("measure", "测量", "📐", "verbs", "We measure the desk with a ruler."),
  w("invent", "发明", "💡", "verbs", "Engineers invent new machines."),
  w("explore", "探索", "🧭", "verbs", "We explore the dark cave."),
  w("discover", "发现", "🔎", "verbs", "Scientists discover new stars."),
  w("imagine", "想象", "💭", "verbs", "Close your eyes and imagine a dragon."),
  w("create", "创造", "🛠️", "verbs", "Artists create lovely things."),
  w("repair", "修理", "🔧", "verbs", "Dad will repair my broken bike."),
  w("observe", "观察", "👀", "verbs", "We observe ants on the ground."),
  // abstract & feelings
  w("dream", "梦想", "💫", "abstract", "I dream about flying very high."),
  w("idea", "主意", "💡", "abstract", "She had a clever idea."),
  w("hope", "希望", "🌟", "abstract", "We hope for sunny days."),
  w("fear", "恐惧", "😱", "abstract", "Brave kids face their fear."),
  w("joy", "喜悦", "😊", "abstract", "The puppy jumps with joy."),
  w("pride", "骄傲", "🦚", "abstract", "She smiled with great pride."),
  w("peace", "和平", "🕊️", "abstract", "The quiet garden is full of peace."),
  w("courage", "勇气", "🛡️", "abstract", "It takes courage to try again."),
  // geography
  w("country", "国家", "🌐", "geography", "China is a big country."),
  w("city", "城市", "🏙️", "geography", "Many people live in the city."),
  w("village", "村庄", "🏘️", "geography", "Grandma lives in a small village."),
  w("capital", "首都", "🏛️", "geography", "Beijing is the capital of China."),
  w("border", "边界", "🚧", "geography", "A river marks the border."),
  w("valley", "山谷", "🏞️", "geography", "Flowers grow in the green valley."),
  w("harbor", "港口", "⚓", "geography", "Boats rest in the calm harbor."),
  w("bridge", "桥", "🌉", "geography", "We walk across the long bridge."),
  // seasons
  w("spring", "春天", "🌸", "seasons", "Flowers bloom in the spring."),
  w("summer", "夏天", "🏖️", "seasons", "We swim in the hot summer."),
  w("autumn", "秋天", "🍂", "seasons", "Leaves fall in the autumn."),
  w("winter", "冬天", "⛄", "seasons", "We make snowmen in winter."),
  w("season", "季节", "🔄", "seasons", "Spring is my favorite season."),
];
