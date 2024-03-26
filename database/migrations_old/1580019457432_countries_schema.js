"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class CountriesSchema extends Schema {
  up() {
    this.create("country_groups", (table) => {
      table.increments();
      table.string("name", 150).notNullable();
      table.timestamps();
    });
    this.create("countries", (table) => {
      table.increments();
      table
        .integer("group_id")
        .unsigned()
        .references("id")
        .inTable("country_groups")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.string("sortname", 3).notNullable();
      table.string("name", 150).notNullable();
      table.string("phonecode", 11).notNullable();
      table.boolean("active").defaultTo(true);
      table.integer("sort_order");
      table.timestamps();
    });
  }

  down() {
    this.drop("country_groups");
    this.drop("countries");
  }
}

module.exports = CountriesSchema;
