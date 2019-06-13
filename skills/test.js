reg1 = /^1|[pP]ro(gram)?(gramming)?$/; // Programming
reg2 = /^2|[aA]cc(ounting)?$/; // Accounting
reg3 = /^3|[nN]et(work)?(working)?(work [cC]om)?(work [cC]omputing)?$/; // Network Computing
reg4 = /^4|[iI]nfo(r)?(rmation)?(sys)?( sys)?( system)?$/; // Information System
reg5 = /^5|[sS]erver(admin)?( admin)?( [aA]dministration)?$/; // Server Administration
reg6 = /^6|[wW]eb(dev)?( dev)?( [dD]evelopment)?$/; // Web Development
regex = /^1|[pP]ro(gram)?(gramming)?|2|[aA]cc(ounting)?|3|[nN]et(work)?(working)?(work [cC]om)?(work [cC]omputing)?|4|[iI]nfo(r)?(rmation)?(sys)?( sys)?( system)?|5|[sS]erver(admin)?( admin)?( [aA]dministration)?|6|[wW]eb(dev)?( dev)?( [dD]evelopment)?$/;
var pickedCourse = "";

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

module.exports = function(controller) {

    // Create hearing event listener
    controller.hears([/^test$/],"direct_message,direct_mention", function(bot, message) {

        // Start a conversation
        bot.startConversation(message, function(err, convo) {

            convo.ask("What is your main course?\n1. Programming\n2. Accounting\n3. Network Computing\n4. Information System\n5. Server Administration\n6. Web Development", [

                {
                    pattern: regex,
                    callback: function(response, convo) {
                        convo.setVar("course", convertCourse(convo.extractResponse("answer")));
                        convo.gotoThread("Confirm_course");
                    },
                },
                {
                    pattern: "^exit(.)?|bye|see (ya|you)$",
                    callback: function(convo) {
                        convo.say("Ok, let's do it next time.");
                        convo.stop();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.say("Sorry, I don't know this course.<br/>_Tip: you can try programming, accounting, network, infosys, server, webdev_");
                        convo.repeat();
                        convo.next();
                    },
                },
            ], {key: "answer"});

            convo.addMessage("You picked '{{vars.course}}'","Confirm_course");

            convo.addQuestion("Please, confirm your choice ? (yes|no)",[
                {
                    pattern: "^yes|yeah|y|si|shi|hey|oui|da$",
                    callback: function(response, convo) {
                        convo.setVar("course", convertCourse(convo.extractResponse("answer")));
                        convo.gotoThread("success");
                    },
                },
                {
                    pattern: "^exit$",
                    callback: function(response, convo) {
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.transitionTo("default", "Got it, let's try again...");
                    },
                },
            ], {}, "Confirm_course");

            convo.addMessage("Cool, your main course is '{{vars.course}}'.","success");
        });
    });
};