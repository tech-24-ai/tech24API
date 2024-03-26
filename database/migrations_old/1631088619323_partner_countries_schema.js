"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class PartnerCountriesSchema extends Schema {
  up() {
    this.create("countries_partners", (table) => {
      table
        .integer("partner_id")
        .unsigned()
        .references("id")
        .inTable("partners")
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
    this.drop("countries_partners");
  }
}

module.exports = PartnerCountriesSchema;
