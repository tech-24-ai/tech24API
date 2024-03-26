"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class ConsultantChatHistoriesSchema extends Schema {
  up() {
    this.create("consultant_chat_histories", (table) => {
      table.increments();
      table
        .integer("booking_id")
        .unsigned()
        .references("id")
        .inTable("booking_histories")
        .onUpdate("cascade")
        .onDelete("cascade");
      table
        .integer("consultant_id")
        .unsigned()
        .references("id")
        .inTable("consultants")
        .onUpdate("cascade")
        .onDelete("cascade");
      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onUpdate("cascade")
        .onDelete("cascade");
      table.boolean("allow_consultant_message").defaultTo(true);
      table.boolean("allow_visitor_message").defaultTo(true);
      table.datetime("chat_active_deadline");
      table.timestamps();
    });
    this.create("consultant_chat_logs", (table) => {
      table.increments();
      table
        .integer("chat_id")
        .unsigned()
        .references("id")
        .inTable("consultant_chat_histories")
        .onDelete("cascade")
        .onUpdate("cascade");
      table.text("message").notNullable();
      table.datetime("message_datetime").notNullable();
      table.integer("created_by").unsigned();
      table.enu("message_by", ["Consultant", "Visitor"]).notNullable();
      table.timestamps();
    });
  }

  down() {
    this.drop("consultant_chat_histories");
    this.drop("consultant_chat_logs");
  }
}

module.exports = ConsultantChatHistoriesSchema;
