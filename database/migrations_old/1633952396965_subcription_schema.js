'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubcriptionSchema extends Schema {
  up () {
    this.create('subcriptions', (table) => {

      table.integer('plan_id').unsigned().notNullable()

      table.boolean('is_auto_renewal').defaultTo(false)

      table.datetime('subscription_start_date').notNullable()
      table.datetime('subscription_end_date').notNullable()

      table.boolean('is_active').defaultTo(false)

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.increments()
      table.timestamps()
    })

    this.alter('subcriptions', table => {
      table.foreign('plan_id')
      .references('market_plans.id')
      .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('subcriptions')
  }
}

module.exports = SubcriptionSchema
