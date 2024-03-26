'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class InvoiceSchema extends Schema {
  up () {
    this.create('invoices', (table) => {

      table.integer('subscription_id').unsigned().notNullable()
      table.integer('transaction_id').unsigned().notNullable()
      table.string('invoice_no').notNullable()
      table.datetime('invoice_date').notNullable()
      table.decimal('invoice_amount', 10, 2).unsigned();

      table.integer('address_id').unsigned().notNullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.increments()
      table.timestamps()
    })


    this.alter('invoices', table => {
      table.foreign('subscription_id')
      .references('subcriptions.id')
      .onDelete('CASCADE')

      table.foreign('transaction_id')
      .references('transcation_histories.id')
      .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('invoices')
  }
}

module.exports = InvoiceSchema
