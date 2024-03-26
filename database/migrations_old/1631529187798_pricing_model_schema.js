'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricingModelSchema extends Schema {
  up () {
    this.createIfNotExists('pricing_models', (table) => {
      table.increments()
      table.timestamps()
      table.string('name').notNullable()
      table.string('description')
      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })

    this.alter('pricing_models', table => {
      table.foreign('created_by')
       .references('users.id')
       .onDelete('CASCADE')

       table.foreign('updated_by')
       .references('users.id')
       .onDelete('CASCADE')

      })
  }

  down () {
    this.drop('pricing_models')
  }
}

module.exports = PricingModelSchema
