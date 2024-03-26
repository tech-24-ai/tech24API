"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class TimeZonesSchema extends Schema {
  up() {
    this.create("time_zones", (table) => {
      table.increments();
      table.string("name", 200).notNullable();
      table.string("sort_name", 3).nullable();
      table.string("country_name", 200).nullable();
      table.string("zone", 100).notNullable();
      table.string("offset", 100).notNullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("time_zones");
  }
}

module.exports = TimeZonesSchema;
