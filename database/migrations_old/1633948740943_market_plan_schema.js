'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')


class MarketPlanSchema extends Schema {
  up () {
    this.create('market_plans', (table) => {
      table.increments()
      table.timestamps()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.string('plan_name').notNullable()
      table.enum('plan_duration', ['Monthly', 'Yearly']).defaultTo('Monthly').notNullable()
      table.decimal('plan_price', 10, 2).unsigned();
      table.decimal('current_price_or_special_price', 10, 2).unsigned();

      table.integer('segment_id').unsigned().notNullable()
      table.enum('plan_type', ['Static', 'Custom']).defaultTo('Static').notNullable()

      table.integer('max_market').notNullable()
      table.integer('max_region').notNullable()
      table.integer('max_country').notNullable()

      table.string('is_active')
      table.string('paypal_plan_id')

    })

    this.alter('market_plans', table => {
      table.foreign('segment_id')
       .references('mi_segments.id')
       .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('market_plans')
  }
}

module.exports = MarketPlanSchema
