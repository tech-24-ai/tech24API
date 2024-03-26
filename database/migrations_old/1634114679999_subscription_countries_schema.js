"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class SubscriptionCountriesSchema extends Schema {
  up() {
    this.create("countries_subscriptions", (table) => {
      table
        .integer("subcription_id")
        .unsigned()
        .references("id")
        .inTable("subcriptions")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("country_id")
        .unsigned()
        .references("id")
        .inTable("countries")
        .onDelete("cascade")
        .onUpdate("cascade");
    });
  }

  down() {
    this.drop("countries_subscriptions");
  }
}

module.exports = SubscriptionCountriesSchema;
