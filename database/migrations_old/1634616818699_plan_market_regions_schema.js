"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class PlanMarketRegionsSchema extends Schema {
  up() {
    this.create("regions_market_plans", (table) => {
      table
        .integer("market_plan_id")
        .unsigned()
        .references("id")
        .inTable("market_plans")
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
    this.drop("regions_market_plans");
  }
}

module.exports = PlanMarketRegionsSchema;
