"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class BookingFreeAddonsSchema extends Schema {
  up() {
    this.create("booking_free_addons", (table) => {
      table.increments();
      table
        .integer("module_id")
        .unsigned()
        .references("id")
        .inTable("modules")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("category_id")
        .unsigned()
        .references("id")
        .inTable("categories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table
        .integer("document_id")
        .unsigned()
        .references("id")
        .inTable("documents")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.integer("duration").notNullable();
      table.enu("type", ["Technology", "Document"]).notNullable();
      table
        .integer("created_by")
        .unsigned()
        .references("id")
        .inTable("users")
        .onUpdate("cascade");
      table
        .integer("updated_by")
        .unsigned()
        .references("id")
        .inTable("users")
        .onUpdate("cascade");
      table.timestamps();
    });
    this.create("visitor_booking_addons", (table) => {
      table.increments();
      table
        .integer("addon_id")
        .unsigned()
        .references("id")
        .inTable("booking_free_addons")
        .onUpdate("cascade")
        .onDelete("cascade");
      table
        .integer("booking_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onUpdate("cascade")
        .onDelete("cascade");
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onUpdate("cascade")
        .onDelete("cascade");
      table
        .integer("booking_logs_id")
        .unsigned()
        .references("id")
        .inTable("booking_logs")
        .onUpdate("cascade")
        .onDelete("cascade");
      table.timestamps();
    });
  }

  down() {
    this.drop("booking_free_addons");
    this.drop("visitor_booking_addons");
  }
}

module.exports = BookingFreeAddonsSchema;
