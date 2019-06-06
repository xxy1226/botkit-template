//
// Stores a user choice in Botkit 'users' storage, so that the value can be retreived later
//
module.exports = function (controller) {

    controller.hears([/^course$/], 'direct_message,direct_mention', function (bot, message) {

        // Check if a User preference already exists
        var userId = message.raw_message.actorId;
        controller.storage.users.get(userId, function (err, data) {
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

function showUserPreference(controller, bot, message, userId, color) {
    bot.startConversation(message, function (err, convo) {

        convo.sayFirst(`Hey, I know you! **'${color}'** is your favorite color.`);

        convo.ask("Should I erase your preference?  (yes/no)", [
            {
                pattern: "^yes|ya|da|si|oui$",
                callback: function (response, convo) {

                    // [WORKAROUND] Botkit uses different functions to delete persisted user data
                    // - in-memory storage, use 'storage.users.delete()'
                    // - redis storage, use 'storage.users.remove()'
                    let deleteUserPref = controller.storage.users.delete;
                    if (process.env.REDIS_URL) {
                        deleteUserPref = controller.storage.users.remove;
                    }
                    
                    deleteUserPref(userId, function (err) { 
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
    bot.startConversation(message, function (err, convo) {

        convo.ask("What is your main course?\n1. Programming\n2. Accounting\n3. Network Computing\n4. Information System\n5. Server Administration\n6. Web Development", [
            {
                pattern: "^programming|accounting|network[ computing]|information[ system]|server[ administration]|web development|1|2|3|4|5|6$",
                callback: function (response, convo) {

                    // Store color as user preference
                    var pickedCourse = convo.extractResponse('answer');
                    if (responses.answer == '1') {
                        responses.answer = 'Programming';
                    };
                    if (responses.answer == '2') {
                        responses.answer = 'Accounting';
                    };
                    if (responses.answer == '3' || responses.answer == 'network') {
                        responses.answer = 'Network Computing';
                    };
                    if (responses.answer == '4' || responses.answer == 'information' || responses.answer == 'infosys') {
                        responses.answer = 'Information System';
                    };
                    if (responses.answer == '5' || responses.answer == 'server') {
                        responses.answer = 'Server Administration';
                    };
                    if (responses.answer == '6' || responses.answer == 'web' || responses.answer == 'webdev') {
                        responses.answer = 'Web Development';
                    };
                    var userPreference = { id: userId, value: pickedCourse };
                    controller.storage.users.save(userPreference, function (err) {
                        if (err) {
                            convo.say(message, 'sorry, could not access storage, err: ' + err.message);
                            convo.next();
                            return;
                        }

                        convo.transitionTo("success", "_successfully stored user preference_");
                    });

                },
            },
            {
                default: true,
                callback: function (response, convo) {
                    convo.gotoThread('bad_response');
                }
            }
        ], { key: "answer" });

        // Bad response
        convo.addMessage({
            text: "Sorry, I don't know this course.<br/>_Tip: try programming, accounting, network, infosys, server, webdev_",
            action: 'default',
        }, 'bad_response');

        // Success thread
        convo.addMessage(
            "Cool, your main course is '{{responses.answer}}'",
            "success");
    });
}
