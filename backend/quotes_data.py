"""
quotes_data.py — 100+ curated motivational quotes from famous people.

These are seeded into the SQLite quotes table on first run.
Categories: discipline, success, health, growth, perseverance, leadership, vision
"""

QUOTES = [
    # ─── Napoleon Hill ──────────────────────────────────────────────────────────
    ("Whatever the mind can conceive and believe, it can achieve.", "Napoleon Hill", "success"),
    ("Strength and growth come only through continuous effort and struggle.", "Napoleon Hill", "growth"),
    ("Don't wait. The time will never be just right.", "Napoleon Hill", "discipline"),
    ("Set your mind on a definite goal and observe how quickly the world stands aside to let you pass.", "Napoleon Hill", "vision"),
    ("Every adversity, every failure, every heartache carries with it the seed of an equal or greater benefit.", "Napoleon Hill", "perseverance"),
    ("Action is the real measure of intelligence.", "Napoleon Hill", "discipline"),
    ("If you cannot do great things, do small things in a great way.", "Napoleon Hill", "growth"),
    ("Patience, persistence and perspiration make an unbeatable combination for success.", "Napoleon Hill", "perseverance"),

    # ─── Kobe Bryant ────────────────────────────────────────────────────────────
    ("The moment you give up is the moment you let someone else win.", "Kobe Bryant", "perseverance"),
    ("I can't relate to lazy people. We don't speak the same language.", "Kobe Bryant", "discipline"),
    ("Everything negative — pressure, challenges — is all an opportunity for me to rise.", "Kobe Bryant", "growth"),
    ("The most important thing is to try and inspire people so that they can be great in whatever they want to do.", "Kobe Bryant", "leadership"),
    ("I have self-doubt. I have insecurity. But I also have the ability to walk through fear.", "Kobe Bryant", "perseverance"),
    ("Rest at the end, not in the middle.", "Kobe Bryant", "discipline"),
    ("I don't want to be the next Michael Jordan, I only want to be Kobe Bryant.", "Kobe Bryant", "vision"),
    ("Great things come from hard work and perseverance. No excuses.", "Kobe Bryant", "discipline"),

    # ─── Elon Musk ──────────────────────────────────────────────────────────────
    ("When something is important enough, you do it even if the odds are not in your favor.", "Elon Musk", "perseverance"),
    ("I think it's very important to have a feedback loop, where you're constantly thinking about what you've done and how you could be doing it better.", "Elon Musk", "growth"),
    ("Persistence is very important. You should not give up unless you are forced to give up.", "Elon Musk", "perseverance"),
    ("If you get up in the morning and think the future is going to be better, it is a bright day.", "Elon Musk", "vision"),
    ("Some people don't like change, but you need to embrace change if the alternative is disaster.", "Elon Musk", "growth"),
    ("Work like hell. Put in 80 to 100 hour weeks every week. This improves the odds of success.", "Elon Musk", "discipline"),
    ("I could either watch it happen or be a part of it.", "Elon Musk", "leadership"),
    ("Failure is an option here. If things are not failing, you are not innovating enough.", "Elon Musk", "growth"),

    # ─── Steve Jobs ─────────────────────────────────────────────────────────────
    ("Stay hungry, stay foolish.", "Steve Jobs", "growth"),
    ("Your time is limited, don't waste it living someone else's life.", "Steve Jobs", "vision"),
    ("Innovation distinguishes between a leader and a follower.", "Steve Jobs", "leadership"),
    ("The people who are crazy enough to think they can change the world are the ones who do.", "Steve Jobs", "vision"),
    ("Quality is more important than quantity. One home run is much better than two doubles.", "Steve Jobs", "discipline"),
    ("Have the courage to follow your heart and intuition. They somehow already know what you truly want to become.", "Steve Jobs", "vision"),
    ("I'm convinced that about half of what separates the successful entrepreneurs from the non-successful ones is pure perseverance.", "Steve Jobs", "perseverance"),
    ("Details matter, it's worth waiting to get it right.", "Steve Jobs", "discipline"),

    # ─── Bill Gates ─────────────────────────────────────────────────────────────
    ("It's fine to celebrate success, but it is more important to heed the lessons of failure.", "Bill Gates", "growth"),
    ("Don't compare yourself with anyone in this world. If you do so, you are insulting yourself.", "Bill Gates", "growth"),
    ("I choose a lazy person to do a hard job. Because a lazy person will find an easy way to do it.", "Bill Gates", "vision"),
    ("Success is a lousy teacher. It seduces smart people into thinking they can't lose.", "Bill Gates", "growth"),
    ("If you are born poor it's not your mistake, but if you die poor it's your mistake.", "Bill Gates", "success"),
    ("Your most unhappy customers are your greatest source of learning.", "Bill Gates", "growth"),
    ("Patience is a key element of success.", "Bill Gates", "discipline"),
    ("Life is not fair — get used to it.", "Bill Gates", "perseverance"),

    # ─── Mark Zuckerberg ────────────────────────────────────────────────────────
    ("The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.", "Mark Zuckerberg", "vision"),
    ("Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.", "Mark Zuckerberg", "growth"),
    ("People don't care about what you say, they care about what you build.", "Mark Zuckerberg", "discipline"),
    ("The question isn't 'What do we want to know about people?', it's 'What do people want to tell about themselves?'", "Mark Zuckerberg", "vision"),
    ("Done is better than perfect.", "Mark Zuckerberg", "discipline"),
    ("Ideas don't come out fully formed. They only become clear as you work on them.", "Mark Zuckerberg", "growth"),
    ("By giving people the power to share, we're making the world more transparent.", "Mark Zuckerberg", "leadership"),

    # ─── Jeff Bezos ─────────────────────────────────────────────────────────────
    ("I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying.", "Jeff Bezos", "perseverance"),
    ("We are stubborn on vision. We are flexible on details.", "Jeff Bezos", "vision"),
    ("Your brand is what other people say about you when you're not in the room.", "Jeff Bezos", "leadership"),
    ("If you double the number of experiments you do per year you're going to double your inventiveness.", "Jeff Bezos", "growth"),
    ("Work hard, have fun, make history.", "Jeff Bezos", "success"),
    ("What's dangerous is not to evolve.", "Jeff Bezos", "growth"),

    # ─── Warren Buffett ─────────────────────────────────────────────────────────
    ("The most important investment you can make is in yourself.", "Warren Buffett", "growth"),
    ("Someone is sitting in the shade today because someone planted a tree a long time ago.", "Warren Buffett", "vision"),
    ("It takes 20 years to build a reputation and five minutes to ruin it.", "Warren Buffett", "discipline"),
    ("Risk comes from not knowing what you are doing.", "Warren Buffett", "growth"),
    ("The difference between successful people and really successful people is that really successful people say no to almost everything.", "Warren Buffett", "discipline"),
    ("Chains of habit are too light to be felt until they are too heavy to be broken.", "Warren Buffett", "discipline"),

    # ─── Oprah Winfrey ──────────────────────────────────────────────────────────
    ("The biggest adventure you can take is to live the life of your dreams.", "Oprah Winfrey", "vision"),
    ("Turn your wounds into wisdom.", "Oprah Winfrey", "growth"),
    ("You become what you believe.", "Oprah Winfrey", "success"),
    ("Doing the best at this moment puts you in the best place for the next moment.", "Oprah Winfrey", "discipline"),
    ("Surround yourself with only people who are going to lift you higher.", "Oprah Winfrey", "growth"),

    # ─── Muhammad Ali ───────────────────────────────────────────────────────────
    ("Don't count the days, make the days count.", "Muhammad Ali", "discipline"),
    ("I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", "Muhammad Ali", "perseverance"),
    ("Impossible is just a big word thrown around by small men.", "Muhammad Ali", "vision"),
    ("He who is not courageous enough to take risks will accomplish nothing in life.", "Muhammad Ali", "perseverance"),
    ("It isn't the mountains ahead to climb that wear you out; it's the pebble in your shoe.", "Muhammad Ali", "discipline"),

    # ─── Albert Einstein ────────────────────────────────────────────────────────
    ("In the middle of difficulty lies opportunity.", "Albert Einstein", "perseverance"),
    ("Life is like riding a bicycle. To keep your balance, you must keep moving.", "Albert Einstein", "growth"),
    ("Imagination is more important than knowledge.", "Albert Einstein", "vision"),
    ("Strive not to be a success, but rather to be of value.", "Albert Einstein", "growth"),
    ("The only source of knowledge is experience.", "Albert Einstein", "growth"),

    # ─── Nelson Mandela ─────────────────────────────────────────────────────────
    ("It always seems impossible until it's done.", "Nelson Mandela", "perseverance"),
    ("Education is the most powerful weapon which you can use to change the world.", "Nelson Mandela", "growth"),
    ("I never lose. I either win or learn.", "Nelson Mandela", "growth"),
    ("Do not judge me by my successes, judge me by how many times I fell down and got back up again.", "Nelson Mandela", "perseverance"),

    # ─── Michael Jordan ─────────────────────────────────────────────────────────
    ("I've failed over and over and over again in my life. And that is why I succeed.", "Michael Jordan", "perseverance"),
    ("Some people want it to happen, some wish it would happen, others make it happen.", "Michael Jordan", "discipline"),
    ("Obstacles don't have to stop you. If you run into a wall, don't turn around. Figure out how to climb it.", "Michael Jordan", "perseverance"),
    ("I can accept failure, everyone fails at something. But I can't accept not trying.", "Michael Jordan", "discipline"),

    # ─── Tony Robbins ───────────────────────────────────────────────────────────
    ("Setting goals is the first step in turning the invisible into the visible.", "Tony Robbins", "vision"),
    ("The only impossible journey is the one you never begin.", "Tony Robbins", "perseverance"),
    ("It's not what we do once in a while that shapes our lives, but what we do consistently.", "Tony Robbins", "discipline"),
    ("Your past does not equal your future.", "Tony Robbins", "growth"),

    # ─── Arnold Schwarzenegger ──────────────────────────────────────────────────
    ("Strength does not come from winning. Your struggles develop your strengths.", "Arnold Schwarzenegger", "perseverance"),
    ("The mind is the limit. As long as the mind can envision the fact that you can do something, you can do it.", "Arnold Schwarzenegger", "vision"),
    ("The worst thing I can be is the same as everybody else. I hate that.", "Arnold Schwarzenegger", "growth"),
    ("You can't climb the ladder of success with your hands in your pockets.", "Arnold Schwarzenegger", "discipline"),

    # ─── Walt Disney ────────────────────────────────────────────────────────────
    ("All our dreams can come true if we have the courage to pursue them.", "Walt Disney", "vision"),
    ("The way to get started is to quit talking and begin doing.", "Walt Disney", "discipline"),
    ("It's kind of fun to do the impossible.", "Walt Disney", "growth"),

    # ─── Marcus Aurelius ────────────────────────────────────────────────────────
    ("The happiness of your life depends upon the quality of your thoughts.", "Marcus Aurelius", "discipline"),
    ("You have power over your mind — not outside events. Realize this, and you will find strength.", "Marcus Aurelius", "discipline"),
    ("Waste no more time arguing about what a good man should be. Be one.", "Marcus Aurelius", "discipline"),
    ("When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", "Marcus Aurelius", "health"),

    # ─── Health & Wellness ──────────────────────────────────────────────────────
    ("Take care of your body. It's the only place you have to live.", "Jim Rohn", "health"),
    ("Health is the greatest gift, contentment the greatest wealth.", "Buddha", "health"),
    ("Early to bed and early to rise makes a man healthy, wealthy and wise.", "Benjamin Franklin", "health"),
    ("The groundwork of all happiness is health.", "Leigh Hunt", "health"),
    ("A healthy outside starts from the inside.", "Robert Urich", "health"),
    ("An ounce of prevention is worth a pound of cure.", "Benjamin Franklin", "health"),
    ("Sleep is the best meditation.", "Dalai Lama", "health"),
    ("Water is the driving force of all nature.", "Leonardo da Vinci", "health"),
    ("Physical fitness is the first requisite of happiness.", "Joseph Pilates", "health"),
    ("To keep the body in good health is a duty, otherwise we shall not be able to keep our mind strong and clear.", "Buddha", "health"),
]
