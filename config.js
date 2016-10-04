var config = {}

config.host = process.env.HOST || "https://judybot.documents.azure.com:443/";
config.authKey = process.env.AUTH_KEY || "r0DuZjNGT93s7ZewedJJNYwSYvReFkmXwEctPF57x1RPUdvdtHeLzeyxhKl7gqw3YP5E2pqFBgGXw3ZtAetF3Q==";
config.databaseId = "ToDoList";
config.collectionId = "Items";

module.exports = config;