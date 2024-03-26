'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CronJobSchema extends Schema {
  up () {
    this.create('cron_jobs', (table) => {
      table.string("name")
      table.string("frequency")
      table.string("type")
      table.string("status")
      table.string("period")
      table.datetime('next_execution_date')
      table.datetime('last_execution_date')
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('cron_jobs')
  }
}

module.exports = CronJobSchema
