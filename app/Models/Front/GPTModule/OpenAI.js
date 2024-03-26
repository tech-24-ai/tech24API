// class OpenAI extends Model {
//   static get table() {
//     return "openai";
//   }
// }

"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class OpenAI extends Model {}

module.exports = OpenAI;
