'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CompetitiveLandscapeSchema extends Schema {
  up () {
    this.create('competitive_landscapes', (table) => {
      table.increments()
      table.string('bubble_name')
      table.integer('bubble_size')
      table.integer('bubble_x')
      table.string('bubble_y')
      table.string('bubble_color')
      table.string('year')
      table.string('revenue')
      table.string('quarter')
      table.integer('market')
      table.integer('category_id')
      table.timestamps()
    })
  }

  down () {
    this.drop('competitive_landscapes')
  }
}

module.exports = CompetitiveLandscapeSchema
