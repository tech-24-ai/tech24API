"use strict";

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
const providers = [
  "@adonisjs/framework/providers/AppProvider",
  "@adonisjs/framework/providers/ViewProvider",
  "@adonisjs/lucid/providers/LucidProvider",
  "@adonisjs/bodyparser/providers/BodyParserProvider",
  "@adonisjs/shield/providers/ShieldProvider",
  "@adonisjs/session/providers/SessionProvider",
  "@adonisjs/auth/providers/AuthProvider",
  "@adonisjs/drive/providers/DriveProvider",
  "@adonisjs/validator/providers/ValidatorProvider",
  "@adonisjs/cors/providers/CorsProvider",
  "@adonisjs/mail/providers/MailProvider",
  "adonis-mongoose-model/providers/MongooseProvider",
  "adonis-search/providers/QueryProvider",
  "adonis-scheduler/providers/SchedulerProvider",
  '@adonisjs/lucid-slugify/providers/SlugifyProvider',
];

/*
|--------------------------------------------------------------------------
| Ace Providers
|--------------------------------------------------------------------------
|
| Ace providers are required only when running ace commands. For example
| Providers for migrations, tests etc.
|
*/
const aceProviders = [
  "@adonisjs/lucid/providers/MigrationsProvider",
  "@adonisjs/vow-browser/providers/VowBrowserProvider",
  "adonis-scheduler/providers/CommandsProvider",
];

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {
  Mongoose: "Adonis/Addons/Mongoose",
  Scheduler: "Adonis/Addons/Scheduler",
};

/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = [];

module.exports = { providers, aceProviders, aliases, commands };
