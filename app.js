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

bot.endConversationAction('goodbye', 'Goodbye:)', { matches: /^.*bye/i });

//=========================================================
// Bots Dialogs
//=========================================================
var style = builder.ListStyle["button"];

//var intents = new builder.IntentDialog();

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=33d6986f-cd13-4711-a0c2-720bbdcae475&subscription-key=896bf1af48e14c74856a6f3cc9e5d8f4';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
//bot.dialog('/', dialog);


intents.matches(/^hello|hi/i, [
    function (session) {
        session.send("Hello, how can I help you?");
        session.endDialog("");
    }
]);

intents.matches(/^thank |thanks/i, [
    function (session) {
        session.send("You are welcome.");
        session.endDialog("");
    }
]);

var docDbClient = new DocumentDBClient(config.host, {
    masterKey: config.authKey
});
var dbDao = new DbDao(docDbClient, config.databaseId, config.collectionId);
var dbActions = new DbActions(dbDao);
dbDao.init(function(){
	
	dbActions.initQuestions(function(err, items){
	
		//console.log(items);
		var q = items;
		for(x in q) {
			var fn = function (code)  { // Immediately Invoked Function Expression
						return function () {
							return function (session, args) {
								
								var subtopic = "";
								
								for(i in args.entities){
									var entity = args.entities[i]
									var type = entity.type;
									
									if (type === "Topic") {
										session.userData.topic = entity
									} else if (type === "subtopic"){
										subtopic = args.intents[0].intent + " ";
									}
									
									console.log('str '+  entity.type + ' ' + entity.entity)
								}
								
								

								
								//session.send("/" + code)
								session.beginDialog("/" + code);
							} 
						} () 
					} (q[x].name);
			intents.matches(q[x].name, fn);
		}
		
		
		
	}); // init questions
	
	
	dbActions.initAnswers(function(err, items){
	//console.log(items);
var a = items;		
for(x in a) { 
	
		//console.log('choice : /' + function (code)  { /* Immediately Invoked Function Expression */ return function () { return code; } () } (a[x].name))
		bot.dialog('/' + function (code, object)  { /* Immediately Invoked Function Expression */ return function () { return code; } () } (a[x].name) , 
			
			function (code, obj)  { /* Immediately Invoked Function Expression */ 
				return function () { 
					var txt = obj.description;
					var acode = (txt.slice(0,1)!="{"?txt:JSON.parse(txt));
					var type = typeof(acode);
					var waterfall_fn = [];
					var o = acode;
					
					if (type === "string") {
						//console.log('str '+obj.name)
						waterfall_fn.push(function(session, args, fn){ session.send(obj.description);session.endDialog();})
						
						
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
					
					
					
					//console.log(''+waterfall_fn)
					return waterfall_fn; 
			
			
			
				} () 
			} (a[x].name, a[x])
		);
		
		
		
		
			
			//console.log(fnz)

}
		
		
		
	}) //end init answers
	
	
	
	
	
	
	
});


//search parking fines|offenses
var request = require("request");
var async = require("async");
//request.debug = true;

var searchParkingFines = function( session, address ) {
	
	var data;
	var s = session;
	
	var txtbody;
	var m_address = session.message.address;
	//request.debug = true;
	var thisbot = bot;			
	
	
	request({
					  url: "https://services3.hdb.gov.sg/webapp/BL16AWESVPAYMENT/faces/JSP/eservices/pay/BL16REPayFromESVSearch.jsp",
					  method: "GET",
					 jar: true,
						}, function(error, response, body) {
							
			 var msg = new builder.Message()
								.address(m_address)
								.text("connected to service searching now nn");
							thisbot.send(msg);
							
						}
			);			
	
	
		request({
					  url: "https://services3.hdb.gov.sg/webapp/BL16AWESVPAYMENT/faces/JSP/eservices/pay/BL16REPayFromESVSearch.jsp",
					  method: "GET",
					  jar: true,
						}, function(error, response, body) {
						  //parse body to get data
						  
						  var start = body.indexOf('name="javax.faces.ViewState"');
						  var tmp = (body.slice(start));
						  var end = tmp.indexOf('" />',1);
						  tmp = tmp.slice(0, end + 1);
						  tmp = tmp.split(" ");
						  tmp = tmp[2].split("=");
						  data = {
							searchKeyword:"",
							
							"view:form1:j_id_jsp_1367732672_4":"true",
							"view:form1:noticeVehicleType" :s.dialogData.type,
							"view:form1:vehicleNoticeNo" :s.dialogData.vehicleNumber,
							"view:form1:continueHidbuttonID" : "Continue",			
							"javax.faces.ViewState":tmp[1].replace('"',"")+"==",
							"view:form1_SUBMIT":"1"
							
						
						  }
						  
						 
						  console.log(tmp[1].replace('"',"")+"==")
						  
						  //s.send(tmp[1].replace('"',"")+"==")
						  
						  s.dialogData.requestdata = data
						  var msg = new builder.Message()
								.address(m_address)
								.text("connected to service searching now");
							thisbot.send(msg);
						  
						  
				});
	
	
	
	
	
	async.series([
	//f1
	function() {
	
	
			}, function(){
				var msg = new builder.Message()
								.address(m_address)
								.text("connected to service searching now 123");
							thisbot.send(msg);
				
			},
		//f2
			function(){
			
					request.post({
						  url: "https://services3.hdb.gov.sg/webapp/BL16AWESVPAYMENT/faces/JSP/eservices/pay/BL16REPayFromESVSearch.jsp",
						  
						  jar: true,
						  
						  form: s.dialogData.requestdata
							}, function(error, response, body) {
							  //console.log(body);
							  //equest.debug = false;	
							  
							  console.log('done');
							  txtbody =body;
							  //s.send("Done");
							  
							  var start = body.indexOf('<table id="view:form1:tbNoticeList"');
							  var tmp = (body.slice(start));
							  var end = tmp.indexOf('</table>',1);
							  tmp = tmp.slice(0, end + 9);
							  console.log("tmpv=========start: " + tmp+"tmpv=========end")
							  
							 

								var headstart = tmp.indexOf('<thead');
								var tmphead = (tmp.slice(headstart));
								var headend = tmphead.indexOf('</thead>',1);
								tmphead = tmphead.slice(0, headend + 9);

								var startkey = '<div style="overflow: -moz-scrollbars-none; overflow-x: hidden; width: 100%;" >'
								var endkey = '</div>'


								//var thcount = (tmphead.match(/<th /g) || []).length;
								var tmpstring;
								tmpstring = "";
								for (i=1;i<=5;i++)
								{
								var thstart = tmphead.indexOf(startkey);
								var thend = tmphead.indexOf(endkey);
								var contstr = tmphead.slice(thstart, thend );
								tmpstring = tmpstring + contstr.slice(startkey.length, thend) + ";"
								tmphead = tmphead.slice(thend + 6, headend );
								}
								

								var headstart = tmp.indexOf('<tbody');
								var tmphead = (tmp.slice(headstart));

								var headend = tmphead.indexOf('</tbody>',1);
								tmphead = tmphead.slice(0, headend + 9);
								
								var startkey = '<div style="overflow: -moz-scrollbars-none; overflow-x: hidden; width: 100%;" >'
								var endkey = '</div>'


								//var thcount = (tmphead.match(/<td /g) || []).length;
								/*
								var tmpcontstring;
								tmpcontstring = "";
								for (i=1;i<=5;i++)
								{
								var thstart = tmphead.indexOf(startkey);
								var thend = tmphead.indexOf(endkey);
								var contstr = tmphead.slice(thstart, thend );
								tmpcontstring = tmpcontstring + contstr.slice(startkey.length, thend) + ";"
								tmphead = tmphead.slice(thend + 6, headend );
								}
								
								var thlist = tmpstring.split(";");
								var tdlist = tmpcontstring.split(";");
								var finalstr = ""
								for (x = 0; x<5; x++)
								{
								var mystr = tdlist[x];
								if (mystr.indexOf("<input") < 0 ) {
								finalstr = finalstr + thlist[x] + " : " + tdlist[x] + "\n" 
								s.send(thlist[x] + " : " + tdlist[x]);
								}

								}*/
							var msg = new builder.Message()
								.address(m_address)
								.text(tmp);
							thisbot.send(msg);
					});


			
			} //end f2
	]);
	
	
}


var searchtype = { "By Vehicle No": "V","By Notice No":"N"};


//intents.matches(/^search parking [fines|offense]/i, [
intents.matches(/^parking [fines|offense]/i, [
    function (session) {
		
		var terms = '<a target="_blank" href="http://www.hdb.gov.sg/cs/infoweb/parking-fines-e-payment-(non-login)/terms-and-conditions">Terms and Conditions of Parking Fines e-Payment</a>';
		builder.Prompts.confirm(session, "You are about use the service of finding parking offenses, Continuing this action means that you have read and understood the " + terms, { listStyle: style });
		
        
    },
    function (session, results, next) {
		
		console.log("LOG==============" + results.response);
		
        if (results.response) {            
            builder.Prompts.choice(session, "How would you like to search?", searchtype , { listStyle: style } );
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) { session.dialogData.type = searchtype[results.response.entity];
		console.log("text=========: " + session.dialogData.type)
			var txttype = (session.dialogData.type== "V"? "Vehicle" :"Notice");
            builder.Prompts.text(session, "Please provide the " + txttype + " number");
        } else {
            next();
        }
    },
    function (session, results, next) {
		
		console.log("text=========: " + results.response)
		
        if (results.response) { session.dialogData.vehicleNumber = results.response;
			session.send("Looking up your info...");
			searchParkingFines(session);
        } else {
            session.send("Ok. May I help you with another question?");
        }
    },function (session, results, next) {
        session.send("You are encouraged to settle your fine(s) early to avoid incurring higher fine(s) or Court action.");
		
		
    },
	
	
]);



intents.onDefault(function (session) {
        session.send("Sorry, I'm not sure what you mean. Could you rephrase your question or provide more details?");
		
    })	


bot.dialog('/', intents);





