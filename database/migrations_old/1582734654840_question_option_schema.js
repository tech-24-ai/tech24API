'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class QuestionOptionSchema extends Schema {
  up() {
    this.create('question_options', (table) => {
      table.increments()
      table.integer('question_id').unsigned().references('id').inTable('questions').onDelete('cascade').onUpdate('cascade')
      table.integer('option_id').unsigned().references('id').inTable('options').onDelete('cascade').onUpdate('cascade')
      table.integer('sort_order')
      table.timestamps()
    })
  }

  down() {
    this.drop('question_options')
  }
}

module.exports = QuestionOptionSchema
