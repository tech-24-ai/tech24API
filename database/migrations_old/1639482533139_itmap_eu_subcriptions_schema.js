'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ItmapEuSubcriptionsSchema extends Schema {
  up () {
    this.create('itmap_eu_subcriptions', (table) => {
      table.increments()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.integer('plan_id').unsigned().notNullable()
      table.integer('payment_transcation_id').unsigned().nullable()
      table.integer('user_id').unsigned().notNullable()

      table.datetime('subscription_start_date').notNullable()
      table.datetime('subscription_end_date').notNullable()

      table.boolean('is_active').defaultTo(false)

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()
    })
    this.alter('itmap_eu_subcriptions', table => {
      table.foreign('plan_id')
      .references('itmap_eu_market_plans.id')
      .onDelete('CASCADE')
    })
  }

  down () {
    this.drop('itmap_eu_subcriptions')
  }
}

module.exports = ItmapEuSubcriptionsSchema
