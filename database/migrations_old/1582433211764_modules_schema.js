'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ModulesSchema extends Schema {
  up() {
    this.create('modules', (table) => {
      table.increments()
      table.integer('category_id').unsigned().references('id').inTable('categories').onDelete('restrict').onUpdate('cascade')
      table.integer('parent_id')
      table.string('name', 100).notNullable()
      table.text('about', 'text').nullable()
      table.string('min_price', 100).nullable()
      table.string('max_price', 100).nullable()
      table.boolean('status').defaultTo(true)
      table.timestamps()
    })
  }

  down() {
    this.drop('modules')
  }
}

module.exports = ModulesSchema
