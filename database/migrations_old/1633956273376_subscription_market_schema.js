'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubscriptionMarketSchema extends Schema {
  up () {
    this.create('subscription_markets', (table) => {
      table.integer('user_id').unsigned().notNullable()
      table.integer('subscription_id').unsigned().notNullable()
      table.integer('segment_id').unsigned().notNullable()
      table.integer('category_id').unsigned().notNullable() 
      table.integer('market_id').unsigned().notNullable() 
      table.integer('country_id').unsigned().nullable()
      table.integer('country_groups_id').unsigned().nullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.increments()
      table.timestamps()
    })

    this.alter('subscription_markets', table => {
      table.foreign('user_id')
       .references('users.id')
       .onDelete('CASCADE')

      table.foreign('subscription_id')
      .references('subcriptions.id')
      .onDelete('CASCADE')

      table.foreign('segment_id')
      .references('mi_segments.id')
      .onDelete('CASCADE')

      table.foreign('category_id')
      .references('categories.id')
      .onDelete('CASCADE')

      table.foreign('market_id')
      .references('modules.id')
      .onDelete('CASCADE')

      table.foreign('country_id')
      .references('countries.id')
      .onDelete('CASCADE')

      table.foreign('country_groups_id')
      .references('country_groups.id')
      .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('subscription_markets')
  }
}

module.exports = SubscriptionMarketSchema
