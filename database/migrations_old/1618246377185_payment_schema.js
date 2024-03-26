'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentSchema extends Schema {
  up() {
    this.create('payments', (table) => {
      table.increments()
      table.string('name', 100).notNullable()
      table.text('api_key').nullable()
      table.string('username', 200).nullable()
      table.string('password', 200).nullable()
      table.text('details').nullable()
      table.timestamps()
    })

    this.create('visitor_payments', (table) => {
      table.increments()
      table.integer('subscription_plan_id').unsigned().references('id').inTable('subscription_plans').onDelete('restrict').onUpdate('cascade')
      table.integer('visitor_id').unsigned().references('id').inTable('visitors').onDelete('restrict').onUpdate('cascade')
      table.integer('payment_id').unsigned().references('id').inTable('payments').onDelete('restrict').onUpdate('cascade')
      table.string('price', 100).notNullable()
      table.timestamps()
    })
    this.create('vendor_payments', (table) => {
      table.increments()
      table.integer('vendor_id').unsigned().references('id').inTable('vendors').onDelete('restrict').onUpdate('cascade')
      table.integer('payment_id').unsigned().references('id').inTable('payments').onDelete('restrict').onUpdate('cascade')
      table.string('price', 100).notNullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('payments')
    this.drop('visitor_payments')
    this.drop('vendor_payments')
  }
}

module.exports = PaymentSchema
