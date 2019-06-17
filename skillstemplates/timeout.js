//
// Simplest use of Botkit's conversation system
//
module.exports = function (controller) {

    controller.hears([/^time$/], 'direct_message,direct_mention', function (bot, message) {

        bot.startConversation(message, function (err, convo) {
            convo.say('This is a Botkit conversation sample.');

            convo.ask('What is your favorite color?', function (response, convo) {
                convo.say("Cool, I like '" + response.text + "' too!");
                convo.next();
            });

            convo.setTimeout(5000);
            convo.onTimeout(function (convo) {
                convo.gotoThread("no_reply_timeout");
            });

            convo.addMessage({
                text: "Sorry, I cannot hear from you.<br/> Wish you a good time!",
                action: "stop",
            }, "no_reply_timeout");
        });

    });
};