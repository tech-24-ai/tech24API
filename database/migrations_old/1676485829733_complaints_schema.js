"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ComplaintsSchema extends Schema {
  up() {
    this.create("complaints", (table) => {
      table.increments();
      table.string("code", 100).notNullable();
      table.integer("user_id").notNullable();
      table.enu("complain_by", ["Consultant", "Visitor"]).notNullable();
      table.string("subject", 150).notNullable();
      table.text("message").notNullable();
      table.text("admin_remarks").nullable();
      table.integer("ref_id").nullable();
      table.integer("created_by").nullable();
      table.integer("updated_by").nullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("complaints");
  }
}

module.exports = ComplaintsSchema;
