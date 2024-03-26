"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class VendorsSchema extends Schema {
  up() {
    this.alter("vendors", (table) => {
      table.dropColumn("company");
    });

    this.alter("vendors", (table) => {
      table.text("company", "text").nullable();
    });
  }

  down() {
    this.table("vendors", (table) => {
      // reverse alternations
    });
  }
}

module.exports = VendorsSchema;
