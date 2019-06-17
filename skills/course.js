//
// Stores a user choice in Botkit 'users' storage, so that the value can be retreived later
//
reg1 = /^1|[pP][rR][oO]([gG][rR][aA][mM])?([gG][rR][aA][mM][mM][iI][nN][gG])?$/; // Programming
reg2 = /^2|[aA][cC][cC](ounting)?$/; // Accounting
reg3 = /^3|[nN][eE][tT](work)?(working)?(work [cC]om)?(work [cC]omputing)?$/; // Network Computing
reg4 = /^4|[iI][nN][fF][oO](r)?(rmation)?(sys)?( sys)?( system)?$/; // Information System
reg5 = /^5|[sS][eE][rR][vV][eE][rR](admin)?( admin)?( [aA]dministration)?$/; // Server Administration
reg6 = /^6|[wW][eE][bB]([dD][eE][vV])?( dev)?( [dD]evelopment)?$/; // Web Development
regex = /^1|[pP][rR][oO]([gG][rR][aA][mM])?([gG][rR][aA][mM][mM][iI][nN][gG])?|2|[aA][cC][cC](ounting)?|3|[nN][eE][tT](work)?(working)?(work [cC]om)?(work [cC]omputing)?|4|[iI][nN][fF][oO](r)?(rmation)?(sys)?( sys)?( system)?|5|[sS][eE][rR][vV][eE][rR](admin)?( admin)?( [aA]dministration)?|6|[wW][eE][bB]([dD][eE][vV])?( dev)?( [dD]evelopment)?$/;

function convertCourse(course) {
    if (reg1.test(course)) {
        return 'Programming';
    };
    if (reg2.test(course)) {
        return 'Accounting';
    };
    if (reg3.test(course)) {
        return 'Network Computing';
    };
    if (reg4.test(course)) {
        return 'Information System';
    };
    if (reg5.test(course)) {
        return 'Server Administration';
    };
    if (reg6.test(course)) {
        return 'Web Development';
    };
}

module.exports = function (controller) {

    // Create hearing event listener
    controller.hears([/[cC][oO][uU][rR][sS][eE]/], 'direct_message,direct_mention', function (bot, message) {

        // Check if a User preference already exists
        var userId = message.raw_message.actorId;
        controller.storage.users.get(userId + "course", function (err, data) {
            if (err) {
                bot.reply(message, 'could not access storage, err: ' + err.message, function (err, message) {
                    bot.reply(message, 'sorry, I am not feeling well \uF613! try again later...');
                });
                return;
            }

            // User preference found
            if (data) {
                // Show user preference
                showUserPreference(controller, bot, message, userId, data.value);
                return;
            }

            // Ask for preference
            askForUserPreference(controller, bot, message, userId);
        });
    });
}

function showUserPreference(controller, bot, message, userId, course) {
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

        convo.sayFirst(`Hey, I know you! Your main course is **'${course}'**.`);

        convo.ask("Should I erase your preference?  (yes/no)", [
            {
                pattern: regyes,
                callback: function (response, convo) {

                    // [WORKAROUND] Botkit uses different functions to delete persisted user data
                    // - in-memory storage, use 'storage.users.delete()'
                    // - redis storage, use 'storage.users.remove()'
                    let deleteUserPref = controller.storage.users.delete;
                    if (process.env.REDIS_URL) {
                        deleteUserPref = controller.storage.users.remove;
                    }

                    deleteUserPref(userId + "course", function (err) {
                        if (err) {
                            convo.say(message, 'sorry, could not access storage, err: ' + err.message);
                            convo.repeat();
                            return;
                        }

                        convo.say("Successfully reset your preference.");
                        convo.next();
                    });
                },
            },
            {
                default: true,
                callback: function (response, convo) {
                    convo.say("Got it, leaving your preference as is.");
                    convo.next();
                }
            }
        ]);
    });
}

function askForUserPreference(controller, bot, message, userId) {

    // Start a conversation
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

        question = "What is your main course?";
        question += "\n<br/> `1.` Programming (**pro**)";
        question += "\n<br/> `2.` Accounting (**acc**)";
        question += "\n<br/> `3.` Network Computing (**net**)";
        question += "\n<br/> `4.` Information System (**info**)";
        question += "\n<br/> `5.` Server Administration (**ser**)";
        question += "\n<br/> `6.` Web Development (**web**)";
        question += "\n\n<br/> `0.` Cancel";
        question += '\n<br/>_(type a `number`, a **bold keyword** or "cancel")_';
        convo.ask(question, [
            {
                pattern: regex,
                callback: function(response, convo) {
                    convo.setVar("course", convertCourse(convo.extractResponse('answer')));
                    convo.gotoThread("Confirm_course");
                },
            },
            {
                pattern: regmenucancel,
                callback: function(response, convo) {
                    convo.gotoThread("thread_exit");
                },
            },
            {
                default: true,
                callback: function (response, convo) {
                    convo.gotoThread("bad_response");
                },
            },
        ], {key: "answer"});

        convo.addMessage("You picked '{{vars.course}}'","Confirm_course");

        convo.addMessage({
            text: "Ok, let's do it next time.",
            action: 'stop',
        },'thread_exit');

        convo.addMessage({
            text: "Sorry, I don't know this course.<br/>_Tip: you can try programming, accounting, network, infosys, server, webdev_",
            action: 'default',
        }, 'bad_response');

        convo.addQuestion("Please, confirm your choice ? (yes|no)",[
            {
                pattern: regyes,
                callback: function(response, convo) {
                    
                    // Store course as user preference
                    var pickedCourse = convertCourse(convo.extractResponse('answer'));

                    var userPreference = { id: userId + "course", value: pickedCourse };
                    controller.storage.users.save(userPreference, function (err) {
                        if (err) {
                            convo.say(message, 'sorry, could not access storage, err: ' + err.message);
                            convo.next();
                            return;
                        }
                    })
                    convo.gotoThread("success", "_Ok, I remember your main course._");
                },
            },
            {
                pattern: regmenucancel,
                callback: function(response, convo) {
                    convo.gotoThread("thread_exit");
                },
            },
            {
                default: true,
                callback: function (response, convo) {
                    convo.transitionTo("default", "Got it, let's try again...");
                }
            }
        ], {}, "Confirm_course");

        convo.addMessage("Cool, your main course is '{{vars.course}}'.","success");
    });
}