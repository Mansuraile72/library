// ✅ Emoji Map
const emojiMap = {
  // ✅ सुधार: "एक क्रांतिकारी" को "Category" में बदला गया और इमोजी अपडेट की गई
  Category: "📁", 
  Emotion: "😄", Action: "🏃", Character: "🧑", View: "👁️", Theme: "🎯",
  Objects: "📦", Scene: "🎬", Age: "🎂",
  Happy: "😂", Sad: "😢", Angry: "😠", Crying: "😭", Confused: "😕", Surprised: "😲", Relaxed: "😌", Tired: "😴", Worried: "😟", Laughing: "🤣", Bored: "🥱", Motivated: "💪", Lonely: "😔",
  Sitting: "🪑", Standing: "🧍", Walking: "🚶", Running: "🏃", Sleeping: "🛏️", Talking: "🗣️", Thinking: "🤔", Working: "💼", Fighting: "🥊", Reading: "📖", Playing: "🎮", Dancing: "💃", "Using Phone": "📱", Looking: "👀", Searching: "🔍", Pointing: "☝️", Showing: "👉", Holding: "👐",
  Man: "👨", Woman: "👩", Boy: "👦", Girl: "👧", Baby: "👶", "Old Man": "👴", "Old Woman": "👵", Group: "👨‍👩‍👧‍👦", Family: "🏡", Couple: "💏", Doctor: "🩺", Student: "🎓", Teacher: "🧑‍🏫", Businessman: "👨‍💼", Farmer: "👨‍🌾",
  "Front View": "👁️‍🗨️", "Side View": "↔️", "Back View": "🔙", "Top View": "🔝", "Zoomed View": "🔍",
  Education: "📘", Business: "💼", Medical: "🩺", Office: "🏢", Village: "🏡", City: "🏙️", Jungle: "🌴", Technology: "🖥️", Money: "💰", Travel: "✈️", Success: "🏆", Failure: "❌", Friendship: "🤝", Conflict: "⚔️", Motivation: "🔥", "Problem-Solution": "🛠️", "Career Path": "🧭", "Daily Life": "🕰️",
  Laptop: "💻", Mobile: "📱", Book: "📚", Mic: "🎙️", Table: "🪑", Chair: "🪑", Bed: "🛏️", Bag: "🎒", Chart: "📊", Car: "🚗", Bike: "🏍️", Tree: "🌳", Animal: "🐕", "Light Bulb": "💡", Food: "🍽️", "Money Bag": "💰",
  Indoor: "🏠", Outdoor: "🏞️", "Office Scene": "🏢", Classroom: "🏫", Hospital: "🏥", Battlefield: "⚔️", Market: "🛍️", Road: "🛣️", Park: "🏕️", Jungle: "🌲",
  Infant: "👶", Child: "🧒", Teen: "🧑", Adult: "🧔", "Middle Age": "👨‍🦳", Old: "👴",
  Arrows: "📐", "Concepts and Metaphors": "💡", "People Basic": "🧍", "Speech Bubbles": "💬", "Alphabet and Symbols": "🔤", Animals: "🐶", "Backgrounds and Scenery": "🏞️", "Buildings and Landmarks": "🏛️", Celebration: "🎉", Emojis: "😃", "Food and Drink": "🍔", GIFs: "🎞️", "Hands and Body": "👐", "Healthcare and Medical": "🩺", "History and Culture": "🏺", "Home and Family": "🏠", Icons: "🔔", "Money and Finance": "💰", "Music and Arts": "🎨", "People Emotions": "😊", "People at Work": "👨‍💼", "People in Action": "🏃", Process: "🔁", Science: "🔬", Shapes: "🧩", "Sport and Fitness": "⚽", "Stick Figures": "🕴️", Tools: "🔧", "Toys and Games": "🧸", Transport: "🚗", World: "🌍"
};

// ✅ Categories
const categories = {
  // ✅ सुधार: "एक क्रांतिकारी" को "Category" में बदला गया और सबसे ऊपर ले जाया गया
  Category: ["People in Action", "Business", "Concepts and Metaphors", "Education", "People Basic", "Speech Bubbles", "Alphabet and Symbols", "Animals", "Backgrounds and Scenery", "Buildings and Landmarks", "Celebration", "Chart", "Emojis", "Food and Drink", "GIFs", "Hands and Body", "Healthcare and Medical", "History and Culture", "Home and Family", "Icons", "Money and Finance", "Music and Arts", "People Emotions", "People at Work", "Arrows", "Process", "Science", "Shapes", "Sport and Fitness", "Stick Figures", "Technology", "Tools", "Toys and Games", "Transport", "World"],
  Emotion: ["Happy", "Sad", "Angry", "Crying", "Confused", "Surprised", "Relaxed", "Tired", "Worried", "Laughing", "Bored", "Motivated", "Lonely"],
  Action: ["Sitting", "Standing", "Walking", "Running", "Sleeping", "Talking", "Thinking", "Working", "Fighting", "Reading", "Playing", "Dancing", "Using Phone", "Looking", "Searching", "Pointing", "Showing", "Holding"],
  Character: ["Man", "Woman", "Boy", "Girl", "Baby", "Old Man", "Old Woman", "Group", "Family", "Couple", "Doctor", "Student", "Teacher", "Businessman", "Farmer"],
  View: ["Front View", "Side View", "Back View", "Top View", "Zoomed View"],
  Theme: ["Education", "Business", "Medical", "Office", "Village", "City", "Jungle", "Technology", "Money", "Travel", "Success", "Failure", "Friendship", "Conflict", "Motivation", "Problem-Solution", "Career Path", "Daily Life"],
  Objects: ["Laptop", "Mobile", "Book", "Mic", "Table", "Chair", "Bed", "Bag", "Chart", "Car", "Bike", "Tree", "Animal", "Light Bulb", "Food", "Money Bag"],
  Scene: ["Indoor", "Outdoor", "Office Scene", "Classroom", "Hospital", "Battlefield", "Market", "Road", "Park", "Jungle"],
  Age: ["Infant", "Child", "Teen", "Adult", "Middle Age", "Old"]
};