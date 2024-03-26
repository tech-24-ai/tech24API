"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class VisitorColumnsSchema extends Schema {
  up() {
    this.alter("visitors", (table) => {
      table.string("location").nullable();
      table.string("company_location").nullable();
      table.string("company_linkedin_link").nullable();
    });
  }

  down() {}
}

module.exports = VisitorColumnsSchema;
