/* --- STATIC DATA --- */
var ROOMS = [
    {id:'dorm', name:'DORM', x:800, y:600, w:400, h:300, floor:'#e1b12c', wall:'#fbc531'},
    {id:'vocal', name:'VOCAL', x:200, y:200, w:300, h:300, floor:'#fd79a8', wall:'#e84393'},
    {id:'dance', name:'DANCE', x:1500, y:200, w:300, h:300, floor:'#74b9ff', wall:'#0984e3'},
    {id:'rap', name:'RAP', x:200, y:1000, w:300, h:300, floor:'#ffeaa7', wall:'#fdcb6e'},
    {id:'gym', name:'GYM', x:1500, y:1000, w:300, h:300, floor:'#55efc4', wall:'#00b894'}
];

var PALETTES = {
    skin: ['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642'],
    hair: ['#2f3542', '#a4b0be', '#8b4513', '#eccc68', '#ff6b81', '#1e90ff'],
    shirt: ['#ff6b81', '#1e90ff', '#feca57', '#2ecc71', '#a29bfe', '#ffffff']
};

var DECOR_TYPES = [
    { type: 'tree', color: '#10ac84', w: 30, h: 50 },
    { type: 'plant', color: '#2ecc71', w: 20, h: 25 }
];

if (typeof RelManager === 'undefined') {
    var RelManager = {
        update: (npc, score) => {
            if(!npc.relationship) npc.relationship = 0;
            npc.relationship += score;
        },
        getStatusLabel: (score) => {
            if(score > 50) return "BESTIE";
            if(score > 20) return "FRIEND";
            if(score < -20) return "RIVAL";
            return "ACQUAINTANCE";
        },
        getTeamBonus: (team) => {
            return 0;
        }
    };
}

// Placeholder cho DIALOGUE_LIB
const DIALOGUE_LIB = [
    { text: "I'm nervous about tomorrow's elimination...", options: ["No matter what happens, you did your best.", "Yeah... it's scary.", "If you get eliminated, that's on you."] },
    { text: "Do you think my high note was stable?", options: ["It was amazing! You improved so much!", "It was okay.", "It was off-key."] },
    { text: "I stayed up all night practicing the choreography.", options: ["I'm proud of your hard work!", "You should rest too.", "That's your problem."] },
    { text: "The judges barely looked at me today...", options: ["They'll notice you soon, trust me.", "Maybe next round.", "Maybe you're just not interesting."] },
    { text: "I'm scared I'll disappoint the team.", options: ["We win and lose together.", "Just try your best.", "Don't drag us down then."] },
    { text: "Do you want to practice vocals together tonight?", options: ["Of course! Let's improve together.", "Maybe later.", "Practice alone."] },
    { text: "My confidence is really low lately.", options: ["You're more talented than you think.", "Everyone feels that way sometimes.", "Maybe you should quit."] },
    { text: "The center position feels like too much pressure.", options: ["You deserve it. We support you.", "It's definitely tough.", "Then give it to me."] },
    { text: "I messed up during rehearsal...", options: ["It's okay, you can fix it!", "It happens.", "That was embarrassing."] },
    { text: "Do you think the audience likes me?", options: ["They absolutely do!", "Hard to tell.", "Probably not."] },

    { text: "I'm worried about my ranking dropping.", options: ["Rankings don't define your talent.", "It might change.", "Maybe you deserve it."] },
    { text: "My rap part feels too short.", options: ["You still made it shine!", "Yeah, it's short.", "Be grateful you got lines."] },
    { text: "Should I dye my hair for the concept?", options: ["It would look amazing on you!", "If you want.", "That'd look bad."] },
    { text: "I can't hit that dance move cleanly.", options: ["Let's practice it together.", "It's tricky.", "You're too slow."] },
    { text: "The trainers criticized me again.", options: ["That means they see potential in you.", "They can be harsh.", "Maybe you're just not good enough."] },
    { text: "Do you think I suit this cute concept?", options: ["You totally fit it!", "Maybe a little.", "Not at all."] },
    { text: "I miss my family so much.", options: ["They must be so proud of you.", "Yeah... it's hard.", "Focus on the show."] },
    { text: "My stamina is really bad lately.", options: ["Let's work on it together!", "You should train more.", "You're holding us back."] },
    { text: "I'm scared of live stages.", options: ["You'll shine once you're on stage!", "They're intense.", "Then why are you here?"] },
    { text: "Do you think I'm improving?", options: ["So much! I can see it clearly.", "A little.", "Not really."] },

    { text: "The other team looks really strong.", options: ["So are we! Believe in us.", "They are good.", "We're going to lose."] },
    { text: "I feel invisible in this group.", options: ["You matter to us.", "Maybe try standing out more.", "Maybe that's your level."] },
    { text: "Should I volunteer for main vocal?", options: ["Go for it! I support you.", "If you feel ready.", "You'll fail."] },
    { text: "I'm afraid of negative comments online.", options: ["Ignore them. You're amazing.", "That's unavoidable.", "Get used to it."] },
    { text: "My voice cracked during evaluation.", options: ["You'll nail it next time!", "It happens.", "That was bad."] },
    { text: "Do you want to review the choreography again?", options: ["Yes! Practice makes perfect.", "Sure, I guess.", "I'm done already."] },
    { text: "I'm not confident about my visuals.", options: ["You're beautiful just the way you are.", "You're fine.", "You're average."] },
    { text: "The camera never focuses on me.", options: ["Your moment will come.", "It's random.", "Because you're boring."] },
    { text: "I'm exhausted but I want to keep practicing.", options: ["I'll stay with you.", "Don't overdo it.", "Suit yourself."] },
    { text: "Do you think the producers like me?", options: ["I think they see your potential.", "Not sure.", "Probably not."] },

    { text: "I want to try writing lyrics.", options: ["That's amazing! I'll help you.", "That's cool.", "Stick to singing."] },
    { text: "My dance lines feel awkward.", options: ["They're getting better every day.", "A bit stiff.", "They look bad."] },
    { text: "I forgot part of the choreography.", options: ["Let's go over it again.", "You should review it.", "How could you forget?"] },
    { text: "The concept feels too mature for me.", options: ["You can totally pull it off!", "It's challenging.", "You don't fit it."] },
    { text: "I'm scared of being compared to others.", options: ["You're unique in your own way.", "Comparisons happen.", "You're not as good."] },
    { text: "Do you want to form a practice unit?", options: ["Yes! Let's grow together.", "Maybe.", "No thanks."] },
    { text: "My confidence drops when I see stronger trainees.", options: ["Use that as motivation.", "It happens.", "Then step aside."] },
    { text: "I think I gained weight.", options: ["You're healthy and beautiful.", "Maybe a little.", "You should diet harder."] },
    { text: "The stage outfit feels uncomfortable.", options: ["You'll still shine in it!", "Yeah, it's tight.", "Just deal with it."] },
    { text: "I want to become center someday.", options: ["You definitely can!", "Maybe one day.", "Keep dreaming."] },

    { text: "My voice feels tired today.", options: ["Rest and hydrate, I'll cover you.", "Take it easy.", "Don't slack off."] },
    { text: "I'm afraid of forgetting lyrics live.", options: ["You'll remember, trust yourself.", "Just practice more.", "Then don't mess up."] },
    { text: "Should we practice harmonies?", options: ["Yes! It'll sound amazing.", "If there's time.", "Not necessary."] },
    { text: "I feel like I'm slowing everyone down.", options: ["You're not, we're a team.", "A little maybe.", "Yeah, you are."] },
    { text: "The judges said I lack emotion.", options: ["You can show more next time!", "They're strict.", "They're right."] },
    { text: "Do you think I'll debut?", options: ["I believe you will!", "Hard to say.", "Probably not."] },
    { text: "I want more screen time.", options: ["You'll earn it with effort.", "Same here.", "So what?"] },
    { text: "I'm scared of failing on live broadcast.", options: ["You'll shine, I know it.", "It's nerve-wracking.", "Don't mess it up."] },
    { text: "My rap rhythm keeps slipping.", options: ["Let's practice with a metronome.", "Keep trying.", "You're off-beat."] },
    { text: "Should I change my stage name?", options: ["It could be a fresh start!", "If you want.", "No one cares."] },

    { text: "I feel pressured by high expectations.", options: ["That means people believe in you.", "It's stressful.", "Handle it yourself."] },
    { text: "The other team copied our idea.", options: ["We'll still outshine them.", "That's annoying.", "Who cares."] },
    { text: "I'm worried about my facial expressions.", options: ["They've improved a lot!", "They're okay.", "They're awkward."] },
    { text: "Do you think I fit the group image?", options: ["You complete the team.", "Maybe.", "Not really."] },
    { text: "I keep overthinking everything.", options: ["Trust your instincts.", "Try to relax.", "Stop being dramatic."] },
    { text: "My knees hurt from practice.", options: ["Let's stretch and rest.", "Take a break.", "Push through it."] },
    { text: "The main vocal spot scares me.", options: ["You earned it!", "It's tough.", "Then don't take it."] },
    { text: "I feel overshadowed by the center.", options: ["You shine in your own way.", "It happens.", "That's natural."] },
    { text: "Do you want to review the recording?", options: ["Yes, let's improve together.", "Okay.", "Not interested."] },
    { text: "I cried after reading comments.", options: ["I'm here for you.", "Ignore them.", "You're too sensitive."] },

    { text: "I'm afraid of making eye contact with the camera.", options: ["Practice with me!", "Just try.", "It's not that hard."] },
    { text: "The choreography feels too intense.", options: ["We can handle it together.", "It's hard.", "Then keep up."] },
    { text: "I want to lead the team this round.", options: ["You'd be a great leader.", "If you're ready.", "You can't handle it."] },
    { text: "My breathing control is weak.", options: ["Let's train together.", "Practice more.", "That's basic."] },
    { text: "I feel like giving up.", options: ["Don't! You've come so far.", "Take a short break.", "Maybe you should."] },
    { text: "Do you think my smile looks fake?", options: ["It looks genuine and bright.", "It's fine.", "Yeah, kinda."] },
    { text: "I'm scared the audience won't vote for me.", options: ["They'll see your effort.", "Maybe.", "Not my problem."] },
    { text: "My dance feels stiff on camera.", options: ["You're improving every day.", "It's okay.", "It's awkward."] },
    { text: "Should I try ad-libs in the final chorus?", options: ["Yes! That'll impress everyone.", "Maybe.", "Don't risk it."] },
    { text: "I think I disappointed the team.", options: ["We still believe in you.", "It wasn't perfect.", "You did."] },

    { text: "I'm afraid of being edited badly.", options: ["Just be yourself.", "It happens.", "That's showbiz."] },
    { text: "My ranking announcement made my heart race.", options: ["You handled it well!", "It was intense.", "You looked nervous."] },
    { text: "The concept photoshoot was awkward.", options: ["You looked stunning!", "It was okay.", "You looked stiff."] },
    { text: "I want to try center next evaluation.", options: ["Go for it!", "If you want.", "You'll embarrass yourself."] },
    { text: "I'm scared of high notes live.", options: ["You can hit them!", "They're risky.", "You'll crack again."] },
    { text: "Do you want to rehearse one more time?", options: ["Yes! Let's perfect it.", "Alright.", "I'm done."] },
    { text: "I feel pressure from my fans.", options: ["They love and support you.", "That's heavy.", "Ignore them."] },
    { text: "My rap tone sounds weird.", options: ["It sounds unique!", "A bit unusual.", "It sounds bad."] },
    { text: "I think the judges favor someone else.", options: ["Focus on yourself.", "Maybe.", "Obviously."] },
    { text: "I'm scared of the final stage.", options: ["We'll face it together.", "It's nerve-wracking.", "Don't mess up."] },

    { text: "I couldn't sleep thinking about tomorrow's stage.", options: ["Let's review it once more so you feel better.", "Try to rest a little.", "You're overthinking it."] },
    { text: "My voice feels shaky today.", options: ["Warm up with me, you'll be fine.", "Maybe drink some water.", "Then don't mess up."] },
    { text: "Do you think the mentors noticed my effort?", options: ["They definitely did!", "Maybe a little.", "Probably not."] },
    { text: "I'm scared of standing in the front row.", options: ["You deserve that spot.", "It's a lot of pressure.", "Then switch with someone else."] },
    { text: "The choreography change is stressing me out.", options: ["We'll adjust together.", "It's sudden.", "Just deal with it."] },
    { text: "I want to prove myself this round.", options: ["I believe in you!", "Do your best.", "Everyone says that."] },
    { text: "My hands keep shaking before practice.", options: ["Take a deep breath with me.", "Try to calm down.", "That's weak."] },
    { text: "Do you think my expression looked natural?", options: ["It looked great!", "It was okay.", "It looked forced."] },
    { text: "I feel like I'm always second best.", options: ["You're amazing in your own way.", "At least you're good.", "That's because you are."] },
    { text: "The new song key feels too high.", options: ["We can practice until it's comfortable.", "It's a bit high.", "Just hit it properly."] },

    { text: "I'm afraid of forgetting my lines again.", options: ["I'll practice with you.", "Just review more.", "Don't mess it up this time."] },
    { text: "Do you want to grab protein shakes after practice?", options: ["Sure! Let's refuel together.", "Maybe later.", "I'm busy."] },
    { text: "I feel like the cameras avoid me.", options: ["Your moment will come.", "It's random.", "Maybe you're not interesting."] },
    { text: "My stamina dropped halfway through the song.", options: ["We'll build it up together.", "You need more cardio.", "That's embarrassing."] },
    { text: "Should I volunteer for killing part?", options: ["You should! It suits you.", "If you're confident.", "You can't handle it."] },
    { text: "I miss performing in front of a real audience.", options: ["We'll get there soon.", "Yeah, same.", "Focus on practice."] },
    { text: "I think I sang too softly.", options: ["Your tone was beautiful.", "Maybe a little.", "No one could hear you."] },
    { text: "I'm scared of being edited as the villain.", options: ["Just stay true to yourself.", "It depends.", "That'd be funny."] },
    { text: "The outfit makes me feel insecure.", options: ["You look amazing in it.", "It's not bad.", "It doesn't suit you."] },
    { text: "I want to show a new side of me.", options: ["That's exciting!", "It could work.", "Why bother?"] },

    { text: "I feel pressure being the oldest trainee.", options: ["You're a great role model.", "It's tough.", "Then act your age."] },
    { text: "The younger trainees learn so fast.", options: ["You have experience they don't.", "They're quick.", "You're slow."] },
    { text: "Do you think I suit dark concepts?", options: ["You'd look incredible.", "Maybe.", "Not really."] },
    { text: "I'm worried about voice cracks live.", options: ["Trust your training.", "It might happen.", "It probably will."] },
    { text: "Should we run the full performance again?", options: ["Yes, let's perfect it!", "If there's time.", "I'm tired."] },
    { text: "My ranking went up but I still feel anxious.", options: ["It's okay to feel that way.", "At least it improved.", "Why complain?"] },
    { text: "The mentor's stare scares me.", options: ["It means they're serious about you.", "They're intense.", "You should be scared."] },
    { text: "I want to try composing music someday.", options: ["That's inspiring!", "Sounds cool.", "Stick to performing."] },
    { text: "I'm afraid my fandom is too small.", options: ["It will grow.", "Maybe.", "Then try harder."] },
    { text: "My pitch was slightly flat today.", options: ["You'll fix it quickly.", "It happens.", "It was obvious."] },

    { text: "I feel like crying before going on stage.", options: ["I'll hold your hand until it's time.", "Stay strong.", "Don't be dramatic."] },
    { text: "The practice room feels suffocating lately.", options: ["Let's take a short break outside.", "It's intense.", "That's how it is."] },
    { text: "Do you think the public likes my personality?", options: ["You're charming!", "Hard to tell.", "Probably not much."] },
    { text: "My dance teacher looked disappointed.", options: ["You can impress them next time.", "Maybe.", "You deserved it."] },
    { text: "I want to debut with this team.", options: ["Let's make it happen together.", "We'll see.", "Not everyone will."] },
    { text: "My breathing was too loud in the mic.", options: ["We can practice control.", "It happens.", "It was distracting."] },
    { text: "I'm scared of online hate comments.", options: ["Ignore them, focus on love.", "They're unavoidable.", "Get used to it."] },
    { text: "Do you think I improved from the first episode?", options: ["So much!", "A bit.", "Not really."] },
    { text: "I feel overshadowed in group shots.", options: ["You still shine.", "It happens.", "You're in the back for a reason."] },
    { text: "Should I smile more on stage?", options: ["Your smile is powerful.", "Maybe slightly.", "It's awkward."] },

    { text: "I'm scared this might be my last stage.", options: ["Then let's make it unforgettable.", "It might be.", "It probably is."] },
    { text: "Do you think I deserve to debut?", options: ["Absolutely, without doubt.", "Maybe.", "Not yet."] },
    { text: "I feel like giving everything I have tonight.", options: ["That's the spirit!", "Do your best.", "Don't overdo it."] },
    { text: "The spotlight feels blinding.", options: ["You'll get used to it.", "It's bright.", "Deal with it."] },
    { text: "My heart is racing before the announcement.", options: ["No matter what, I'm proud of you.", "It's tense.", "Calm down."] },
    { text: "I want to thank the fans properly.", options: ["They'll feel your sincerity.", "Just say thanks.", "It's just words."] },
    { text: "Do you think this is where I belong?", options: ["Yes, this stage fits you.", "Maybe.", "Not really."] },
    { text: "I'm scared of the final ranking reveal.", options: ["Whatever happens, we tried our best.", "It's scary.", "Just accept it."] },
    { text: "I don't want our team to fall apart.", options: ["We'll stay connected no matter what.", "Things change.", "That's inevitable."] },
    { text: "If I debut, I want us to stay close.", options: ["We definitely will.", "I hope so.", "We'll see."] },

    { text: "If the mentor asks us to change center, would you give it up?", options: ["If it's better for the team, I would.", "I'd think about it.", "No. I earned it."] },
    { text: "They said only one of us will survive this round.", options: ["Then let's both give our best, no regrets.", "That's harsh...", "Then I hope it's me."] },
    { text: "If I rank higher than you, will things change between us?", options: ["Never. We're teammates first.", "Maybe a little.", "Of course they will."] },
    { text: "The producer hinted that I'm more 'marketable' than you.", options: ["That doesn't change how I see you.", "That's awkward...", "Well… that's reality."] },
    { text: "If they cut your lines to give them to me, is that okay?", options: ["If it helps the performance, yes.", "I wouldn't like it.", "That's not fair."] },

    { text: "Would you vote for me if it meant risking your own rank?", options: ["Yes, I believe in you.", "I'm not sure.", "No way."] },
    { text: "If I mess up live, will you cover for me?", options: ["Always.", "I'll try.", "You better not mess up."] },
    { text: "The mentor asked who made the mistake. Should we tell the truth?", options: ["Yes, even if it's hard.", "Maybe we can stay quiet.", "Blame someone else."] },
    { text: "If debuting meant leaving you behind, would you still go?", options: ["I'd go… but I'd never forget you.", "I don't know.", "Obviously yes."] },
    { text: "Do you think friendship matters here?", options: ["It keeps us human.", "Maybe a little.", "This is competition."] },

    { text: "If the public prefers you over me, should I step back?", options: ["No, keep fighting.", "Maybe consider it.", "Maybe you should."] },
    { text: "Would you take the killing part if I secretly wanted it too?", options: ["Let's talk about it honestly.", "If I'm chosen, yes.", "Yes. I won't hesitate."] },
    { text: "If one of us has to be eliminated, who should it be?", options: ["Neither of us deserve that.", "I can't answer that.", "Whoever is weaker."] },
    { text: "Do you think I'm holding you back?", options: ["No, we grow together.", "Sometimes it's tough.", "Yes."] },
    { text: "If the mentor criticizes you unfairly, should I speak up?", options: ["If you believe it's wrong, yes.", "It might cause trouble.", "Stay out of it."] },

    { text: "They asked me to act more competitive on camera.", options: ["Stay true to yourself.", "Play along a little.", "Do whatever it takes."] },
    { text: "If our team loses because of me, will you resent me?", options: ["No, we share the result.", "I'd be upset.", "Probably."] },
    { text: "Should we practice more even if others are resting?", options: ["Let's push a little more.", "Maybe just a bit.", "Let them fall behind."] },
    { text: "If I cry on stage, is that weakness?", options: ["It shows sincerity.", "It depends.", "Yes."] },
    { text: "Would you sacrifice screen time to help the team?", options: ["Yes, if it helps us win.", "That's hard.", "No."] },

    { text: "If they compare us directly, how should we react?", options: ["Support each other publicly.", "Stay neutral.", "Compete harder."] },
    { text: "Do you think talent matters more than popularity?", options: ["Both matter.", "Popularity maybe.", "Popularity wins."] },
    { text: "If I secretly trained extra without telling you, is that betrayal?", options: ["No, that's dedication.", "Maybe a little.", "Yes."] },
    { text: "Would you switch parts if the mentor asked last minute?", options: ["For the team, yes.", "Reluctantly.", "No."] },
    { text: "If the audience booed us, what would you do?", options: ["Smile and finish strong.", "I'd panic.", "I'd be angry."] },

    { text: "If I outperform you tonight, will you still cheer for me?", options: ["Of course.", "I'll try.", "We'll see."] },
    { text: "Do you think the producers are manipulating rankings?", options: ["Focus on what we can control.", "Maybe.", "Definitely."] },
    { text: "If I asked for your main vocal spot, what would you say?", options: ["Let's discuss it honestly.", "I'd hesitate.", "No."] },
    { text: "Would you rather debut alone or fail together?", options: ["Debut but stay connected.", "Fail together.", "Debut alone."] },
    { text: "If the team splits into two, who would you follow?", options: ["Whoever helps the team most.", "My closest friend.", "The stronger side."] },

    { text: "If I told you I'm scared of you improving faster than me?", options: ["Let's grow together, not apart.", "That's natural.", "Then catch up."] },
    { text: "Should we hide our weaknesses from others?", options: ["No, we should improve them.", "Maybe sometimes.", "Yes."] },
    { text: "If I get the center spot unfairly, what should I do?", options: ["Work twice as hard to earn it.", "Just accept it.", "Take advantage of it."] },
    { text: "Would you share your technique if it meant I might surpass you?", options: ["Yes, growth isn't a threat.", "Maybe a little.", "No."] },
    { text: "If the public hates our concept, who takes responsibility?", options: ["We all do.", "The leader maybe.", "Not me."] },

    { text: "If I rank first and you rank last, how would you act?", options: ["Stay humble and supportive.", "Keep distance.", "Celebrate openly."] },
    { text: "Would you expose a teammate's mistake to protect yourself?", options: ["No.", "Only if necessary.", "Yes."] },
    { text: "If debuting means changing who you are, would you?", options: ["Only slightly, not completely.", "Maybe.", "Yes."] },
    { text: "Do you think kindness is weakness here?", options: ["No, it's strength.", "Sometimes.", "Yes."] },
    { text: "If I get eliminated, will you still fight hard?", options: ["For both of us.", "I'll try.", "Of course."] },

    { text: "If the mentor says you're replaceable, how would you react?", options: ["Prove them wrong.", "Stay quiet.", "Get angry."] },
    { text: "Would you fake confidence for the cameras?", options: ["Only to inspire others.", "Maybe.", "Yes, always."] },
    { text: "If I cry and it gets good screen time, is that bad?", options: ["As long as it's real.", "It depends.", "Use it."] },
    { text: "Should we compete even during free practice?", options: ["Encourage each other instead.", "Lightly compete.", "Always compete."] },
    { text: "If I ask you to step back for my solo moment?", options: ["If it benefits the stage.", "Maybe.", "No."] },

    { text: "If the team votes you out, would you forgive us?", options: ["It would hurt, but yes.", "I don't know.", "Never."] },
    { text: "Would you change your personality to gain fans?", options: ["Stay authentic.", "Adjust slightly.", "Completely."] },
    { text: "If I sabotage myself from pressure, is that selfish?", options: ["It's human, but don't give up.", "Maybe.", "Yes."] },
    { text: "Do you believe everyone here is truly your friend?", options: ["Not everyone, but some are.", "Maybe not.", "No."] },
    { text: "If you had to choose between loyalty and victory?", options: ["Balance both.", "Victory.", "Victory."] },

    { text: "If debuting means losing this friendship, is it worth it?", options: ["No dream is worth losing you.", "Maybe.", "Yes."] },
    { text: "If I secretly hope you fail so I can shine, is that wrong?", options: ["Yes, we shouldn't think like that.", "It's honest.", "No."] },
    { text: "Would you comfort me even if I'm your biggest rival?", options: ["Yes.", "Maybe.", "No."] },
    { text: "If only one trainee from this room debuts, what would you do?", options: ["Give my all without regret.", "Hope it's me.", "Make sure it's me."] },
    { text: "If the final lineup doesn't include you, what then?", options: ["I'll keep chasing my dream.", "I'll rest.", "I'll quit."] },

    { text: "You improved a lot lately… should I be worried?", options: ["We push each other to grow.", "Maybe a little.", "Yes, you should."] },
    { text: "If I surpass you, will you still smile at me?", options: ["Of course, your success is yours.", "I’ll try.", "Why would I?"] },
    { text: "Do you ever compare yourself to me at night?", options: ["Comparison isn’t healthy.", "Sometimes.", "Every time."] },
    { text: "If the mentor praises me over you, how do you feel?", options: ["Proud of you.", "It stings a bit.", "I hate it."] },
    { text: "Be honest… do you see me as a threat?", options: ["I see you as motivation.", "Maybe.", "Yes."] },

    { text: "If I take your spotlight, would you forgive me?", options: ["If you earned it, yes.", "It would hurt.", "No."] },
    { text: "Do you practice harder when you see me improving?", options: ["I focus on myself.", "A little.", "Of course."] },
    { text: "If I fail, would that make you feel relieved?", options: ["No, I’d feel sad.", "Maybe subconsciously.", "Yes."] },
    { text: "Sometimes I feel like you’re watching me too closely.", options: ["I admire your growth.", "Just observing.", "Because you’re competition."] },
    { text: "If I asked for your honest weakness, would you tell me?", options: ["Yes, transparency matters.", "Maybe not everything.", "No."] },

    { text: "Do you think we can both debut?", options: ["I believe so.", "It’s uncertain.", "Only one of us will."] },
    { text: "If fans start comparing us, how should we react?", options: ["Stay respectful.", "Ignore it.", "Prove I’m better."] },
    { text: "I feel like you're trying to outshine me subtly.", options: ["Not intentionally.", "Maybe a bit.", "Yes."] },
    { text: "Would you hide your true ability until the final stage?", options: ["No, I’ll stay consistent.", "Maybe strategically.", "Yes."] },
    { text: "If I copied your style, would you be upset?", options: ["We inspire each other.", "A little.", "Very."] },

    { text: "Do you smile at me because you like me or because you have to?", options: ["Because I respect you.", "Both.", "Because I have to."] },
    { text: "If I told you I feel threatened by you, what would you say?", options: ["Let’s grow without fear.", "That’s natural.", "You should be."] },
    { text: "Would you ever downplay your skills to make me comfortable?", options: ["No, I’ll stay honest.", "Maybe slightly.", "No, never."] },
    { text: "If I get main vocal and you don’t, would that change us?", options: ["It shouldn’t.", "Maybe a little.", "Yes."] },
    { text: "Do you think I rely too much on visuals?", options: ["You’re more than visuals.", "Sometimes.", "Yes."] },

    { text: "If I overheard you talking about me, should I confront you?", options: ["Yes, talk openly.", "Depends.", "Ignore it."] },
    { text: "Would you ever pretend to support me publicly but feel differently inside?", options: ["No.", "Maybe.", "Yes."] },
    { text: "If the mentor said I’m more charismatic, would you disagree?", options: ["Everyone shines differently.", "Maybe.", "Yes, I would."] },
    { text: "Do you feel pressure standing next to me?", options: ["Only to improve myself.", "Sometimes.", "Yes."] },
    { text: "If I asked you to rank us honestly, what would you say?", options: ["We’re equal in different ways.", "You’re slightly ahead.", "I’m ahead."] },

    { text: "Would you step back if you sensed I needed the spotlight more?", options: ["If it’s fair, yes.", "Maybe.", "No."] },
    { text: "If I cry and gain sympathy votes, is that manipulation?", options: ["Only if it’s fake.", "Maybe.", "Use it."] },
    { text: "Do you secretly enjoy when I struggle?", options: ["No.", "Sometimes.", "Yes."] },
    { text: "If I asked for advice, would you give your best tips?", options: ["Yes.", "Some of them.", "No."] },
    { text: "Would you expose my weakness if it benefited you?", options: ["Never.", "Only if forced.", "Yes."] },

    { text: "If we were the final two, what would you feel?", options: ["Proud we made it.", "Nervous.", "Determined to win."] },
    { text: "Do you ever rehearse imagining I’m your rival?", options: ["No, I focus on myself.", "Sometimes.", "Yes."] },
    { text: "If the public favors you unfairly, would you admit it?", options: ["Yes.", "Maybe.", "No."] },
    { text: "Would you change your strategy because of me?", options: ["Only to improve.", "Possibly.", "Definitely."] },
    { text: "If I debut and you don’t, will you still support me?", options: ["Yes.", "It would hurt.", "No."] },

    { text: "Do you think ambition ruins friendships here?", options: ["Only if we let it.", "Sometimes.", "Yes."] },
    { text: "If I smile at you after outperforming you, is that cruel?", options: ["Not if it’s sincere.", "Maybe.", "No."] },
    { text: "Would you ever fake a mistake to avoid threatening me?", options: ["No.", "Maybe once.", "Yes."] },
    { text: "If I improve faster than expected, what would you think?", options: ["You worked hard.", "I’d be surprised.", "I’d feel threatened."] },
    { text: "Do you trust me completely?", options: ["As much as I can here.", "Not fully.", "No."] },

    { text: "If I asked you to choose between me and your dream?", options: ["I’d find balance.", "I’d choose my dream.", "Dream first."] },
    { text: "Would you compete even if it breaks us?", options: ["I’d protect both.", "Maybe.", "Yes."] },
    { text: "If I revealed your insecurity, would you forgive me?", options: ["Eventually.", "Not sure.", "Never."] },
    { text: "Do you think rivalry makes us stronger or colder?", options: ["Stronger if handled well.", "Both.", "Colder."] },
    { text: "If I outperform you consistently, what changes?", options: ["Nothing between us.", "Some distance.", "Everything."] },

    { text: "Would you ever pretend to be weaker than you are?", options: ["No.", "Strategically maybe.", "Yes."] },
    { text: "If I win, would you clap sincerely?", options: ["Yes.", "I’d try.", "No."] },
    { text: "Do you calculate your moves around me?", options: ["No.", "Sometimes.", "Always."] },
    { text: "If I told you I envy you, what would you say?", options: ["Let’s inspire each other.", "That’s honest.", "You should."] },
    { text: "Would you rather be feared or loved here?", options: ["Respected.", "Loved.", "Feared."] },

    { text: "If I start pulling away emotionally, would you notice?", options: ["Yes, and I’d ask why.", "Maybe.", "No."] },
    { text: "Do you think we’re pretending not to compete?", options: ["We compete healthily.", "Maybe.", "Yes."] },
    { text: "If I told you I don’t trust you fully, what then?", options: ["Let’s build it.", "That’s fair.", "Then don’t."] },
    { text: "Would you sabotage your sleep to outpractice me?", options: ["No.", "Maybe.", "Yes."] },
    { text: "If the show edits us as rivals, should we lean into it?", options: ["Stay authentic.", "Maybe slightly.", "Yes."] },

    { text: "Do you think one of us is pretending to be nicer?", options: ["I hope not.", "Maybe.", "Yes."] },
    { text: "If I win by one vote, would that hurt you?", options: ["It’s still fair.", "Yes.", "Very."] },
    { text: "Would you hide good news to avoid upsetting me?", options: ["No.", "Maybe.", "Yes."] },
    { text: "If I asked whether I’m better than you, what’s your answer?", options: ["We’re different.", "Maybe slightly.", "No."] },
    { text: "Do you think we’re honest with each other?", options: ["Mostly.", "Not entirely.", "No."] },

    { text: "If I said I want to beat you, what would you feel?", options: ["Motivated.", "Uneasy.", "Angry."] },
    { text: "Would you still help me knowing I might replace you?", options: ["Yes.", "Reluctantly.", "No."] },
    { text: "If I lose confidence, would you step ahead quietly?", options: ["I’d help you up.", "Maybe.", "Yes."] },
    { text: "Do you think rivalry is inevitable here?", options: ["Yes, but controlled.", "Probably.", "Absolutely."] },
    { text: "If I asked you to promise we won’t betray each other?", options: ["I promise.", "I’ll try.", "No promises."] },

    { text: "You’ve been quieter around me lately.", options: ["I didn’t mean to. Let’s talk.", "Just tired.", "Maybe I needed space."] },
    { text: "Did I do something to upset you?", options: ["If something’s wrong, let’s clear it up.", "It’s nothing serious.", "If you have to ask."] },
    { text: "We barely practice together anymore.", options: ["Let’s fix that.", "Schedules changed.", "Maybe that’s better."] },
    { text: "You didn’t look at me during rehearsal.", options: ["I was focused, not avoiding you.", "I didn’t notice.", "I didn’t need to."] },
    { text: "It feels different between us.", options: ["Then let’s talk about it.", "Things change.", "Maybe it should."] },

    { text: "You congratulated me… but it felt distant.", options: ["I meant it sincerely.", "I didn’t know what to say.", "It was just polite."] },
    { text: "Do you still trust me?", options: ["I want to.", "I’m not sure.", "Trust is earned."] },
    { text: "You’ve been practicing alone a lot.", options: ["I didn’t want to bother you.", "Just focusing.", "It’s more efficient."] },
    { text: "Are we avoiding each other?", options: ["If we are, let’s stop.", "Maybe unconsciously.", "Maybe intentionally."] },
    { text: "You didn’t defend me earlier.", options: ["I should have. I’m sorry.", "It wasn’t my place.", "I chose not to."] },

    { text: "Why didn’t you tell me about your solo evaluation?", options: ["I didn’t want tension between us.", "It slipped my mind.", "It wasn’t necessary."] },
    { text: "We used to laugh more.", options: ["I miss that too.", "We’re busy now.", "That was before."] },
    { text: "Are you competing with me?", options: ["Only to improve myself.", "A little.", "Of course."] },
    { text: "You seem colder lately.", options: ["I’ve just been stressed.", "Maybe.", "Maybe I am."] },
    { text: "Do you still see me as a teammate?", options: ["Always.", "For now.", "We’ll see."] },

    { text: "You didn’t wait for me after practice.", options: ["I’m sorry. I didn’t realize.", "I was in a hurry.", "I didn’t think you’d care."] },
    { text: "When did we stop talking honestly?", options: ["Let’s start again.", "I don’t know.", "Maybe we never did."] },
    { text: "You changed after your ranking went up.", options: ["I didn’t mean to.", "Maybe I did a little.", "Success changes people."] },
    { text: "Do you feel awkward standing next to me now?", options: ["A bit, but we can fix that.", "Sometimes.", "Yes."] },
    { text: "You used to share everything with me.", options: ["I still can.", "Not everything.", "Things are different now."] },

    { text: "I noticed you stopped asking for my advice.", options: ["I didn’t want to burden you.", "I’m figuring it out myself.", "I don’t need it anymore."] },
    { text: "Are we pretending everything’s fine?", options: ["Maybe. Let’s stop pretending.", "It’s manageable.", "If it keeps peace."] },
    { text: "You avoided eye contact during the interview.", options: ["I was nervous.", "Did I?", "I didn’t want misinterpretation."] },
    { text: "Do you still celebrate my wins?", options: ["Yes, quietly.", "Of course.", "I acknowledge them."] },
    { text: "You didn’t sit next to me today.", options: ["I didn’t think it mattered.", "There wasn’t space.", "I chose not to."] },

    { text: "It feels like we’re measuring each other.", options: ["Let’s stop doing that.", "Maybe we are.", "That’s natural here."] },
    { text: "Why didn’t you tell me you were struggling?", options: ["I didn’t want pity.", "I handled it alone.", "You were busy."] },
    { text: "You look relieved when I make mistakes.", options: ["That’s not true.", "Maybe I looked that way.", "You’re imagining it."] },
    { text: "Do you still want to debut with me?", options: ["Yes.", "If it works out.", "That’s not up to me."] },
    { text: "You’ve been smiling differently.", options: ["Maybe I’m just tired.", "You’re overthinking.", "People change."] },

    { text: "Are we rivals now?", options: ["We’re still teammates.", "Maybe both.", "Maybe."] },
    { text: "You stopped texting me at night.", options: ["I didn’t want awkwardness.", "I was busy.", "There was nothing to say."] },
    { text: "Did you hesitate to clap for me?", options: ["No. I was proud.", "I was processing.", "Maybe."] },
    { text: "Do you miss how we were?", options: ["Yes. Let’s rebuild it.", "Sometimes.", "That was temporary."] },
    { text: "Why does it feel like we’re keeping score?", options: ["We shouldn’t.", "Maybe subconsciously.", "Because we are."] },

    { text: "You didn’t correct me when I messed up.", options: ["I didn’t want to embarrass you.", "I hesitated.", "It wasn’t my job."] },
    { text: "You seem careful with your words around me.", options: ["I don’t want misunderstandings.", "Maybe.", "That’s intentional."] },
    { text: "Do you think we’re drifting?", options: ["Only if we let it.", "Maybe slowly.", "Probably."] },
    { text: "You never ask how I’m doing anymore.", options: ["I should. How are you?", "I assumed you were fine.", "You seemed fine."] },
    { text: "Is this silence protecting us or hurting us?", options: ["Hurting us.", "Both.", "Protecting."] },

    { text: "If we don’t talk about it, will it fade?", options: ["No, we need honesty.", "Maybe with time.", "It doesn’t matter."] },
    { text: "You seem distant when others praise me.", options: ["I’m adjusting.", "I need time.", "I don’t react much."] },
    { text: "Do you think we’re competing quietly?", options: ["Yes, but respectfully.", "Probably.", "Definitely."] },
    { text: "You didn’t look surprised at my success.", options: ["I knew you’d do well.", "I expected it.", "I wasn’t surprised."] },
    { text: "Are we waiting for the other to speak first?", options: ["I’ll speak now.", "Maybe.", "Silence is easier."] },

    { text: "Do you still feel comfortable around me?", options: ["I want to.", "It’s different.", "Not really."] },
    { text: "Why does it feel like we’re strangers backstage?", options: ["We don’t have to be.", "It just feels that way.", "Maybe we are."] },
    { text: "You didn’t deny the comparison earlier.", options: ["I didn’t think it needed denial.", "I stayed neutral.", "Why would I?"] },
    { text: "Are we protecting pride instead of friendship?", options: ["Maybe. Let’s drop it.", "Possibly.", "Pride matters."] },
    { text: "If we keep this up, what happens?", options: ["We lose each other.", "We adapt.", "Nothing."] }
];

