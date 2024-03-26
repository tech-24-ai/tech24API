"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantRateCardsSchema extends Schema {
  up() {
    this.create("consultant_rate_cards", (table) => {
      table.increments();
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.decimal("amount_per_hour", 10, 2);
      table.integer("min_minute").defaultTo(0);
      table.integer("max_minute").defaultTo(0);
      table
        .integer("skill_id")
        .unsigned()
        .references("id")
        .inTable("skills")
        .onDelete("cascade")
        .onUpdate("restrict");
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.integer("updated_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
    this.create("consultant_rate_card_histories", (table) => {
      table.increments();
      table
        .integer("rate_card_id")
        .unsigned()
        .references("id")
        .inTable("consultant_rate_cards")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.decimal("amount_per_hour", 10, 2);
      table.integer("min_minute").defaultTo(0);
      table.integer("max_minute").defaultTo(0);
      table
        .integer("skill_id")
        .unsigned()
        .references("id")
        .inTable("skills")
        .onDelete("cascade")
        .onUpdate("restrict");
      table.integer("created_by").unsigned().references("id").inTable("users");
      table.timestamps();
    });
  }

  down() {
    this.drop("consultant_rate_cards");
    this.drop("consultant_rate_card_histories");
  }
}

module.exports = ConsultantRateCardsSchema;
