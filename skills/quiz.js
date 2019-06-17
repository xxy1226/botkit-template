//
// Example of a muti-threaded conversation with timeout
//
ANSWER_ACCEPT = 2; // How many time a client can try on a question.
var questions = 1; // How many questions a client want to answer.
var wrong_times = 0;

module.exports = function (controller) {

    controller.hears([/^quiz$/], 'direct_message,direct_mention', function (bot, message) {

        bot.startConversation(message, function (err, convo) {

            // End this conversation after waited for a certain time
            convo.setTimeout(WAITING_TIME);
            convo.onTimeout(function (convo) {
                convo.gotoThread("no_reply_timeout");
            });
            convo.addMessage({
                text: "Sorry, I cannot hear from you. \nWish you a good time!",
                action: "stop",
            }, "no_reply_timeout");

            // Default thread
            convo.ask("Ready for a challenge (yes/no/cancel)", [
                {
                    pattern: regyes,
                    callback: function (response, convo) {

                        // Apply elaps time (in milliseconds) to next askQuestion
                        convo.setTimeout(15000);
                        convo.onTimeout(function (convo) {
                            convo.gotoThread("missed");
                        });

                        convo.gotoThread('quiz_start');
                    },
                }
                , {
                    pattern: regno,
                    callback: function (response, convo) {
                        convo.say("Too bad, looking forward to play with you later...");
                        convo.next();
                    },
                }
                , {
                    pattern: regcancel,
                    callback: function (response, convo) {
                        convo.gotoThread('cancel');
                    },
                }
                , {
                    default: true,
                    callback: function (response, convo) {
                        convo.gotoThread("bad_response");
                    }
                }
            ]);

            convo.addMessage({
                text: "Sorry, I did not understand.",
                action: 'default',
            }, 'bad_response');

            // Cancel thread
            convo.addMessage({
                text: "Got it, cancelling...",
                action: 'stop', // this marks the converation as unsuccessful
            }, 'cancel');

            // Quiz thread
            convo.addMessage({text:"Let's start",action:"quiz",}, "quiz_start");
            var challenge = pickChallenge();
            convo.addQuestion("Question: " + challenge.question, [
                {
                    pattern: "^"+ challenge.answer + "$",
                    callback: function (response, convo) {
                        convo.gotoThread('success');
                    },
                }
                , {
                    pattern: regcancel,
                    callback: function (response, convo) {
                        convo.gotoThread('cancel');
                    },
                }
                , {
                    default: true,
                    callback: function (response, convo) {
                        if (wrong_times < ANSWER_ACCEPT) {
                            convo.gotoThread("wrong_answer");
                            wrong_times += 1;
                        } else {
                            convo.gotoThread("tell_answer");
                        }
                    }
                }
            ], {}, 'quiz');

            // Wrong answer
            convo.addMessage({
                text: "Sorry, wrong answer. Try again!",
                action: 'quiz',
            }, "wrong_answer");

            // Tell answer
            convo.addMessage({
                text: challenge.explain,
                action: 'stop',
            }, "tell_answer");

            // Success thread
            convo.addMessage("Congrats, you did it!", "success");

            // Missed thread
            convo.addMessage("Time elapsed! you missed it, sorry.", "missed");
        });
    });
};

function pickChallenge() {
    var question = "Which command can be used to view the cable type that is attached to a serial interface? (Type the correct `number`)";
    question += "\n<br/> `1.` Router(config)# show interfaces";
    question += "\n<br/> `2.` Router(config)# show controllers";
    question += "\n<br/> `3.` Router(config)# show ip interface";
    question += "\n<br/> `4.` Router(config)# show ip interface brief";
    return {
        question : "" + question,
        answer : "2(.)?",
        explain : "Correct answer: `2. Router(config)# show controllers`\n\nReason: blah blah blah...",
    }
}