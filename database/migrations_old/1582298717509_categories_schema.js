'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategoriesSchema extends Schema {
  up() {
    this.create('categories', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.string('color', 30).notNullable()
      table.string('header_color', 30).notNullable()
      table.string('bg_color', 30).notNullable()
      table.text('image', 'text').nullable()
      table.boolean('no_flow', false)
      table.integer('sort_order')
      table.text('detail', 'text').nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('categories')
  }
}

module.exports = CategoriesSchema
