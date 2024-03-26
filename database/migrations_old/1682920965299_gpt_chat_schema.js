"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class GptChatSchema extends Schema {
  up() {
    this.create("gpt_chats", (table) => {
      table.increments();
      table.string("prompt_text");
      table.string("subject");
      table.string("text");
      table.integer("created_by");
      table.integer("updated_by");
      table.timestamps();
    });

    this.create("gpt_chats_responses", (table) => {
      table.increments();

      table
        .integer("visitor_id")
        .unsigned()
        .references("id")
        .inTable("visitors")
        .onDelete("restrict")
        .onUpdate("cascade");
      table
        .integer("prompt_id")
        .unsigned()
        .references("id")
        .inTable("gpt_chats")
        .onDelete("restrict")
        .onUpdate("cascade");
      table.integer("chat_id");
      table.text("input_question");
      table.text("gpt_response");
      table.text("itmap_response");
      table.timestamps();
    });
  }

  down() {
    this.drop("gpt_chats");
    this.drop("gpt_chats_responses");
  }
}

module.exports = GptChatSchema;
