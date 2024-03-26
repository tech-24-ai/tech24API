"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class PlanMarketCountriesSchema extends Schema {
  up() {
    this.create("countries_market_plans", (table) => {
      table
        .integer("market_plan_id")
        .unsigned()
        .references("id")
        .inTable("market_plans")
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
    this.drop("countries_market_plans");
  }
}

module.exports = PlanMarketCountriesSchema;
