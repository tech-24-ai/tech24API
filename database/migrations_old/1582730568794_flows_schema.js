'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowsSchema extends Schema {
  up() {
    this.create('flows', (table) => {
      table.increments()
      table.integer('module_id').unsigned().references('id').inTable('modules').onDelete('restrict').onUpdate('cascade')
      table.string('name', 100)
      table.text('notes', 'text').nullable()
      table.timestamps()
    })
    this.create('flow_questions', (table) => {
      table.increments()
      table.integer('flow_id').unsigned().references('id').inTable('flows').onDelete('cascade').onUpdate('cascade')
      table.integer('question_id').unsigned().references('id').inTable('questions').onDelete('cascade').onUpdate('cascade')
      table.integer('sort_order')
      table.boolean('is_advanced')
      table.timestamps()
    })
  }

  down() {
    this.drop('flows')
    this.drop('flow_questions')
  }
}

module.exports = FlowsSchema
