'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OptionsSchema extends Schema {
  up() {
    this.create('options', (table) => {
      table.increments()
      table.text('name')
      table.boolean('have_priority', false)
      table.boolean('have_sub_option', false)
      table.timestamps()
    })

    this.create('sub_options', (table) => {
      table.increments()
      table.text('name')
      table.timestamps()
    })

    this.create('option_sub_options', (table) => {
      table.increments()
      table.integer('option_id').unsigned().references('id').inTable('options').onDelete('cascade').onUpdate('cascade')
      table.integer('sub_option_id').unsigned().references('id').inTable('sub_options').onDelete('cascade').onUpdate('cascade')
      table.integer('sort_order')
      table.timestamps()
    })
  }

  down() {
    this.drop('options')
    this.drop('sub_options')
    this.drop('option_sub_options')
  }
}

module.exports = OptionsSchema
