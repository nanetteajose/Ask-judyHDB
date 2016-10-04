var DocumentDBClient = require('documentdb').DocumentClient;
var config = require('./config');
var DbActions = require('./routes/dbactions');
var DbDao = require('./models/dbDao');



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


//=========================================================
// Bots Dialogs
//=========================================================
var style = builder.ListStyle["button"];

//var intents = new builder.IntentDialog();

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
//var model = 'https://api.projectoxford.ai/luis/v1/application?id=309391a7-6a95-4a7f-a92c-18bd2b054dec&subscription-key=7faa358bc73447fb9f293306c4ceeb81&q=';
var model = 'https://api.projectoxford.ai/luis/v1/application?id=50d67e3e-7bf1-45e8-bfe4-fe64b3a6760f&subscription-key=7faa358bc73447fb9f293306c4ceeb81';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
//bot.dialog('/', dialog);

var docDbClient = new DocumentDBClient(config.host, {
    masterKey: config.authKey
});
var dbDao = new DbDao(docDbClient, config.databaseId, config.collectionId);
var dbActions = new DbActions(dbDao);
dbDao.init(function(){
	
	dbActions.initQuestions(function(err, items){
	
		console.log(items);
		var q = items;
		for(x in q) {
			var fn = function (code)  { // Immediately Invoked Function Expression
						return function () {
							return function (session) {
								//session.send("/" + code)
								session.beginDialog("/" + code);
							} 
						} () 
					} (q[x.name]);
			intents.matches(q[x.name], fn);
		}
		
		
		
	}); // init questions
	
	
	dbActions.initAnswers(function(err, items){
	console.log(items);
var a = items;		
for(x in a) { 
	
		console.log('choice : /' + function (code)  { /* Immediately Invoked Function Expression */ return function () { return code; } () } (a[x].name))
		bot.dialog('/' + function (code, object)  { /* Immediately Invoked Function Expression */ return function () { return code; } () } (a[x].name) , 
			
			function (code, obj)  { /* Immediately Invoked Function Expression */ 
				return function () { 
					var txt = obj.description;
					var acode = (txt.slice(0,1)!="{"?txt:JSON.parse(txt));
					var type = typeof(acode);
					var waterfall_fn = [];
					var o = acode;
					
					if (type === "string") {
						
						waterfall_fn.push(function(session){ session.send(obj.name);session.endDialog();})
						
						
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
											
											

											var is_response_valid = !(typeof(acode.choice.options[response]) === "undefined")
											
											if (is_response_valid) {
												session.beginDialog('/'+ acode.choice.options[response])
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
			} (a[x].name, a[x])
		);

}
		
		
		
	}) //end init answers
	
	
	
	
	bot.dialog('/', intents);
	
	
});





var definitions = require('./definitions');
var q = definitions.q;
var a = definitions.a;


/*
for(x in q) {
	var fn = function (code)  { // Immediately Invoked Function Expression
				return function () {
					return function (session) {
						//session.send("/" + code)
						session.beginDialog("/" + code);
					} 
				} () 
			} (q[x]);
	intents.matches(q[x], fn);
}
*/


intents.onDefault(function (session) {
        session.send("Sorry, I'm not sure what you mean. Could you rephrase your question or provide more details?");
    })	








