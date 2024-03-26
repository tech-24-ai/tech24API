'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubscriptionPlansSchema extends Schema {
  up () {
    this.create('subscription_plans', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.string('price', 100).notNullable()
      table.text('details').nullable()
      table.timestamps()
    })
    this.create('visitor_subscription_plans', (table) => {
      table.increments()
      table.integer('visitor_id').unsigned().references('id').inTable('visitors').onDelete('restrict').onUpdate('cascade')
      table.integer('subscription_plan_id').unsigned().references('id').inTable('subscription_plans').onDelete('restrict').onUpdate('cascade')
      table.timestamps()
    })
  }

  down () {
    this.drop('subscription_plans')
    this.drop('visitor_subscription_plans')
  }
}

module.exports = SubscriptionPlansSchema
