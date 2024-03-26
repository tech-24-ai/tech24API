'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubcriptionSchema extends Schema {
  up () {

    this.alter('subcriptions', table => {
      table.integer('transaction_id').unsigned().nullable()
    })

    this.alter('subcriptions', table => {
      table.foreign('transaction_id')
       .references('transcation_histories.id')
       .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('subcriptions')
  }
}

module.exports = SubcriptionSchema
