"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class GptChatLog extends Model {
  // static get hidden() {
  //   return ["created_at", "updated_at"];
  // }
}

module.exports = GptChatLog;
