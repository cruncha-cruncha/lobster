use rand::Rng;

const TITLES: [&str; 16] = [
    "Emperor", "Tsar", "Baron", "Sultan", "Count", "Duke", "Marquess", "Earl", "Viscount", "Baron",
    "Lord", "Yeoman", "Margrave", "Edler", "Jarl", "Fidalgo",
];

const NAMES: [&str; 112] = [
    "Alex",
    "Amber",
    "Agatha",
    "Arthur",
    "Andrew",
    "Abacus",
    "Bilbo",
    "Bart",
    "Bella",
    "Bert",
    "Bartholomew",
    "Cara",
    "Cary",
    "Cassie",
    "Carter",
    "Dirk",
    "Daniel",
    "Daisy",
    "Daphne",
    "Dexter",
    "Diana",
    "Edna",
    "Eddie",
    "Eva",
    "Felix",
    "Fiona",
    "Floyd",
    "Fanny",
    "Gus",
    "Gwen",
    "Gordon",
    "Greta",
    "Hank",
    "Holly",
    "Hank",
    "Hugo",
    "Hazel",
    "Ivan",
    "Ivy",
    "Isaac",
    "Iris",
    "Jack",
    "Jake",
    "Jill",
    "Jude",
    "Jade",
    "Kurt",
    "Kara",
    "Kirk",
    "Kathy",
    "Liam",
    "Lola",
    "Lars",
    "Luna",
    "Llewellyn",
    "Linda",
    "Milo",
    "Mona",
    "Mick",
    "Mara",
    "Mildred",
    "Nico",
    "Nina",
    "Nate",
    "Nora",
    "Owen",
    "Oona",
    "Otto",
    "Opal",
    "Pete",
    "Peggy",
    "Paul",
    "Polly",
    "Quin",
    "Quin",
    "Quinn",
    "Quinn",
    "Rudy",
    "Rita",
    "Rory",
    "Ruth",
    "Seth",
    "Sara",
    "Sean",
    "Sage",
    "Troy",
    "Tina",
    "Toby",
    "Tara",
    "Ulf",
    "Ulla",
    "Uri",
    "Uma",
    "Vic",
    "Vera",
    "Vern",
    "Vita",
    "Will",
    "Wendy",
    "Wade",
    "Wren",
    "Xavi",
    "Xena",
    "Xerxes",
    "Xyla",
    "Yuri",
    "Yara",
    "Yves",
    "Zane",
    "Zara",
    "Zack",
    "Zara",
];

const PREPOSITIONS: [&str; 16] = [
    "Mc", "Von", "Van", "De", "Di", "La", "Le", "Du", "El", "Al", "O'", "Mac", "Fitz", "Ap", "Ben",
    "El",
];

const LOCATIONS: [&str; 48] = [
    "Albania",
    "Antananarivo",
    "Antarctica",
    "Australia",
    "British Columbia",
    "Balboa",
    "Canada",
    "Cuba",
    "Denmark",
    "Dublin",
    "Egypt",
    "Estonia",
    "France",
    "Germany",
    "Greenland",
    "Holland",
    "Hungary",
    "Ireland",
    "Italy",
    "Jamaica",
    "Korea",
    "Lithuania",
    "Lisbon",
    "Mexico",
    "Moldova",
    "Malaysia",
    "Nigeria",
    "Nantucket",
    "Nova Scotia",
    "Oman",
    "Ottawa",
    "Peru",
    "Poland",
    "PEI",
    "Qatar",
    "Qaanaaq",
    "Russia",
    "Rome",
    "Scotland",
    "Scandinavia",
    "Switzerland",
    "Turkey",
    "Toronto",
    "Ukraine",
    "Venezuela",
    "Wales",
    "Yemen",
    "Zambia",
];

pub fn rnd_username() -> String {
    let mut rng = rand::thread_rng();
    let title = TITLES[rng.gen_range(0..TITLES.len())];
    let first = NAMES[rng.gen_range(0..NAMES.len())];
    let pre = PREPOSITIONS[rng.gen_range(0..PREPOSITIONS.len())];
    let last = NAMES[rng.gen_range(0..NAMES.len())];
    let loc = LOCATIONS[rng.gen_range(0..LOCATIONS.len())];

    format!("{} {} {}{} of {}", title, first, pre, last, loc)
}
