"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class GptChatLogsSchema extends Schema {
  up() {
    this.create("gpt_chat_logs", (table) => {
      table.increments();
      table.timestamps();
      table.input("id");
      table.input("input");
      table.input("request");
      table.input("response");
    });
  }

  down() {
    this.drop("gpt_chat_logs");
  }
}

module.exports = GptChatLogsSchema;
