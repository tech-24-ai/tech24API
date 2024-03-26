'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MarketProductSchema extends Schema {
  up () {
    this.create('market_products', (table) => {
      table.increments()
      table.timestamps()

      table.string('name').notNullable()
      table.string('description').notNullable()
      table.string('type').notNullable()
      table.string('category').notNullable()
      table.string('image_url').nullable()
      table.string('home_url').nullable()
      table.string('paypal_product_id').nullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })
  }

  down () {
    this.drop('market_products')
  }
}

module.exports = MarketProductSchema
