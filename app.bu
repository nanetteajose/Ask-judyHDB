







var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

var server = restify.createServer();
//server.listen(process.env.port || process.env.PORT || 1173, function () {
	server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    //appId: process.env.APP_ID,
	//appId: "b70b4985-8de0-46ca-9d13-c94846589419",
    //appPassword: process.env.APP_SECRET
	
	appId: "945fc654-8c53-415d-98f3-defd99c077b4",
    appPassword: "1QsZho2VqxGguMht04DMpUd"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me. How can I help you? ", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('typing', function (message) {
    // User is typing
	console.log('typing')
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});

//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^.*bye/i });
bot.endConversationAction('Hello', 'Hello, how can I help you?', { matches: /^hello/i });
bot.endConversationAction('Hi', 'Hello, how can I help you?', { matches: /^hi/i });
//bot.beginDialogAction('help', '/help', { matches: /^help/i });




var mysql      = require('mysql');

var connection = mysql.createConnection({
 
  host     : 'sql6.freemysqlhosting.net',
  user     : 'sql6132582',
  password : '1TXDD9uuxy',
  database : 'sql6132582'
  /*
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'askjudy123'
  */
  
});

connection.connect();




//=========================================================
// Bots Dialogs
//=========================================================
var style = builder.ListStyle["button"];

//var intents = new builder.IntentDialog();
//
// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
//var model = 'https://api.projectoxford.ai/luis/v1/application?id=0531fa45-6e6e-4683-aa71-b4698f2f6300&subscription-key=7faa358bc73447fb9f293306c4ceeb81';
var model = 'https://api.projectoxford.ai/luis/v1/application?id=50d67e3e-7bf1-45e8-bfe4-fe64b3a6760f&subscription-key=7faa358bc73447fb9f293306c4ceeb81';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
//bot.dialog('/', dialog);

//var definitions = require('./definitions');
//var q = definitions.q;
//var a = definitions.a;

var q = [];
var a = {};

function getRecords(cb) {
  connection.query("SELECT * FROM  `AskJudyQA`", function(err, result) {
    if (err) throw(err); 
    cb(result);
	//console.log('Total is: ', result.length); 
  });
}
//var myres = getRecords();

getRecords(function(res){
  records = res;
  
  //console.log('Total is: ', res.length);
  for(i=0;i<res.length;i++){
	q.push(res[i].Intents);
	if (res[i].expression != "choice") {
		a[res[i].Intents] = res[i].answer;
	} else {
		a[res[i].Intents] = JSON.parse(res[i].answer);
	}
	
	
	
	//a[res[i].Intents] = res[i].answer;
	//console.log('row: ',res[i].answer)
	}
	
	
	for(x in q) {
		var fn = function (code)  { // Immediately Invoked Function Expression
					return function () {
						return function (session, results) {
							//session.send("/" + code)
							var topic = session.dialogData.topic = results.entities[0].entity;
							session.send("toopic" + topic);
							session.beginDialog("/" + code);
						} 
					} () 
				} (q[x]);
		intents.matches(q[x], fn);
	}



	intents.onDefault(function (session) {
			session.send("Sorry, I'm not sure what you mean. Could you rephrase your question or provide more details?");
		})	


	for(x in a) { 
		
			//console.log('choice : /' + function (code)  {  return function () { return code; } () } (x))
			bot.dialog('/' + function (code, object)  {  return function () { return code; } () } (x) , 
				
				function (code, obj)  { 
					return function () { 
				
						var type = typeof(a[code]);
						var waterfall_fn = [];
						var o = a[code];
						
						if (type === "string") {
							
							waterfall_fn.push(function(session){ session.send(a[code]);session.endDialog();})
							
							
						} else if (type === "object" ){
							
							var	options=[];
							
							for(option in o.choice.options){
								options.push(option)
							}
							
							var fn1 = function(session,results) { //prompt
											//var p = o;
											
											builder.Prompts.choice(session, o.choice.question, options, { listStyle: style }); 
										};
												
							waterfall_fn.push(fn1)
							
							
							
							var fn2 = function(session,results, next) { //prompt
											//session.send("f2");
											if (results.response) {
												var response = results.response.entity;
												
												
												var is_response_valid = !(typeof(a[code].choice.options[response]) === "undefined")
												
												if (is_response_valid) {
													session.beginDialog('/'+ a[code].choice.options[response])
												} else {
													session.endDialogWithResults(results);
												}
												
												
												
											} else {
												session.endDialogWithResults(results);
											}
										}
							
							
							
							waterfall_fn.push(fn2)
						}
						
						
						
						//console.log(waterfall_fn)
						return waterfall_fn; 
				
				
				
					} () 
				} (x, a[x])
			);

	}


	intents.matches("how much", function(session){
		var topic  = session.dialogData.topic;
		session.send(topic)
		
	});

	bot.dialog('/', intents);

	bot.dialog('/howmuch', function(session,args){
		var topic  = session.dialogData.topic;
		session.send(topic)
	});
	
	
	
	
	
	
});

//console.log(records.length);
//console.log(a.length);
//for (x in a){
//	console.log("test" + x + ":" + a[x]);
//}
/*
connection.query("SELECT * FROM  `AskJudyQA`", function(err, rows, fields) {
  if (err) throw err;

  //console.log('The solution is: ', rows[0].answer);
  console.log('Total is: ', rows.length);

  for(i=0;i<rows.length;i++){
	q[rows[i].Intents] = new Object();
	
	
	}
	
	
	for(i=0;i<rows.length;i++){

	a[rows[i].Intents] = rows[i].answer;
	console.log('row: ',rows[i].Intents)
	}
	
	//a[rows[0].Intents] = rows[0].answer;
});
connection.end();
JSON.stringify(a);


//var result = [ { intent : "i1", question : "q1" }, { intent : "i2", question : "q2" }];

//a[result[0].intent] = result[0].question;

for (x in a){
	console.log("test" + x + ":" + a[x]);
}
console.log(a.length);

//console.log(records.length);
*/





