'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddressSchema extends Schema {
  up () {
    this.create('addresses', (table) => {
      
      table.string('user_type').notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.string('address1').notNullable()
      table.string('address2').notNullable()
      table.integer('city').unsigned().notNullable()
      table.integer('state').unsigned().notNullable()
      table.integer('country').unsigned().notNullable()
      table.integer('pincode').unsigned().notNullable()

      table.integer('created_by').unsigned().nullable()
      table.integer('updated_by').unsigned().nullable()

      table.increments()
      table.timestamps()
    })

    this.alter('addresses', table => {
      table.foreign('user_id')
       .references('users.id')
       .onDelete('CASCADE')
    })

  }

  down () {
    this.drop('addresses')
  }
}

module.exports = AddressSchema
