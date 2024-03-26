'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SubcriptionSchema extends Schema {
  up () {
    this.alter('subcriptions', (table) => {
      table.integer('user_id').unsigned().notNullable()
    })

    this.alter('subcriptions', table => {
      table.foreign('user_id')
       .references('investors.id')
       .onDelete('CASCADE')
    })
  }

  down () {
  }
}

module.exports = SubcriptionSchema
