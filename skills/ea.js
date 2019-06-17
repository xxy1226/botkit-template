//
// Simplest use of Botkit's conversation system
//
regea = /^1|[nN]ico|[nN]ianguang [cC]ai|2|[aA]ndrew|[xX]ueyin [xX]ia$/

var eas = [
    {
        ea_id: 1,
        name: "Nianguang Cai",
        nickname: "Nico",
        regname: "[nN]ico|[nN]ianguang [cC]ai",
        office: "Roblin Centre (Prev. PSC) P414",
        email: "ncai@rrc.ca",
        work_phone: "204-949-8495",
        schedule: [
            "12:00 pm - 5:50 pm",
            "11:00 am - 2:50 pm",
            "",
            "12:00 pm - 1:50 pm,3:00 pm - 5:50 pm",
            "12:00 pm - 3:50 pm",
        ],
        course: [
            "Programming 1",
            "Programming 2",
            "Network Computing 1",
            "Web Development",
            "Information System",
            "Data Warehouse",
            "Accounting",
        ],
    },
    {
        ea_id: 2,
        name: "Xueyin Xia",
        nickname: "Andrew",
        regname: "[aA]ndrew|[xX]ueyin [xX]ia",
        office: "Roblin Centre (Prev. PSC) P414",
        email: "xxia@rrc.ca",
        work_phone: "204-949-8495",
        schedule: [
            "8:00 am - 10:50 am,2:00 pm - 3:50 pm",
            "",
            "10:00 am - 2:50 pm",
            "10:00 am - 3:50 pm",
            "8:00 am - 1:50 pm",
        ],
        course: [
            "Network Computing 2",
            "Network Computing 3 & 4",
            "Server Administration",
            "Web Development",
            "Cisco DevNet",
        ],
    },
];

module.exports = function (controller) {

    controller.hears([/^ea$/], 'direct_message,direct_mention', function (bot, message) {

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

            // List available EAs
            ealist = "";
            var numl = 1;
            for (var ea of eas) {
                ealist += "`"+numl+".` "+ea.name+" (**"+ea.nickname+"**)\n\n";
                numl += 1;
            };
            // ealist += "\n<br/> `0.` Cancel";
            ealist += "\n\n_(type a `number`, a **bold nickname** for more information)_";

            convo.say("The following EAs are available");

            convo.ask(ealist, [
                {
                    pattern: regea,
                    callback: function (response, convo) {
                        var selectedEA;
                        var ea_info = "";
                        selectedAnswer = convo.extractResponse('answer');
                        var nums = 0;
                        for (var ea of eas) {
                            nums += 1;
                            let regex = new RegExp("^" + nums + "|" + ea.regname + "$");
                            if (regex.test(selectedAnswer)) {
                                selectedEA = ea;
                                ea_info += "**"+ea.name+" ("+ea.nickname+")**";
                                ea_info += "\n<br/> Work Phone: " + ea.work_phone.substr(-4);
                                ea_info += "\n<br/> Calendar:";
                                if (ea.schedule[0]!=""){
                                    ea_info += "<br/> \n\tMonday";
                                    for (freetime of ea.schedule[0].split(',')) { ea_info += "\n\t\t" + freetime; };
                                }
                                if (ea.schedule[1]!=""){
                                    ea_info += "<br/> \n\tTuesday";
                                    for (freetime of ea.schedule[1].split(',')) { ea_info += "\n\t\t" + freetime; };
                                }
                                if (ea.schedule[2]!=""){
                                    ea_info += "\n\tWednesday";
                                    for (freetime of ea.schedule[2].split(',')) { ea_info += "\n\t\t" + freetime; };
                                }
                                if (ea.schedule[3]!=""){
                                    ea_info += "\n\tThursday";
                                    for (freetime of ea.schedule[3].split(',')) { ea_info += "\n\t\t" + freetime; };
                                }
                                if (ea.schedule[4]!=""){
                                    ea_info += "\n\tFriday";
                                    for (freetime of ea.schedule[4].split(',')) { ea_info += "\n\t\t" + freetime; };
                                }
                                ea_info += '\n_Book an appointment with this EA? (yes|no)_';
                                break;
                            }
                        }
                        convo.setVar("ea", selectedEA);

                        convo.setVar("ea_info", ea_info);
                        // convo.setVar("ea_id", convertEA(convo.extractResponse('answer')));
                        convo.setTimeout(SHORT_WAITING_TIME);
                        convo.onTimeout(function (convo) {
                            convo.gotoThread("no_reply_timeout");
                        });

                        convo.gotoThread("selected_ea");
                    },
                },
                {
                    pattern: regmenucancel,
                    callback: function (response, convo) {
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

            convo.addQuestion("{{vars.ea_info}}", [
                {
                    pattern: regyes,
                    callback: function (response, convo) {
                        convo.gotoThread("book_appointment_ea");
                    },
                },
                {
                    pattern: regno,
                    callback: function (response, convo) {
                        convo.gotoThread("thread_no");
                    },
                },
                {
                    default: true,
                    callback: function (response, convo) {
                        convo.gotoThread("bad_response");
                    }
                }
            ], {}, 'selected_ea');

            convo.addMessage("Click to send an email:", "book_appointment_ea");
            convo.addMessage("{{vars.ea.email}}", "book_appointment_ea");
            convo.addMessage({
                text: "_Function not finished, to be continued..._",
                action: "completed",
            }, "book_appointment_ea");

            convo.addMessage({
                text: "Ok, let's do it next time.",
                action: 'stop',
            },'thread_exit');

            convo.addMessage({
                text: "Ok, let's do it next time.",
                action: 'completed',
            },'thread_no');

            convo.addMessage({
                text: "Sorry, I don't understand",
                action: 'default',
            }, 'bad_response');
        });

    });
};