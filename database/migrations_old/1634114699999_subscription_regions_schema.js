"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class SubscriptionRegionsSchema extends Schema {
  up() {
    this.create("regions_subscriptions", (table) => {
      table
        .integer("subcription_id")
        .unsigned()
        .references("id")
        .inTable("subcriptions")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("country_group_id")
        .unsigned()
        .references("id")
        .inTable("country_groups")
        .onDelete("cascade")
        .onUpdate("cascade");
    });
  }

  down() {
    this.drop("countries_subscriptions");
  }
}

module.exports = SubscriptionRegionsSchema;
