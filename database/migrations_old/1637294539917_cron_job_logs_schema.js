'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CronJobLogsSchema extends Schema {
  up () {
    this.create('cron_job_logs', (table) => {
      table.integer("cron_job_id")
      table.datetime('execution_date')
      table.string("type")
      table.text('error_message', 'text').nullable()
      table.string("status")
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('cron_job_logs')
  }
}

module.exports = CronJobLogsSchema
