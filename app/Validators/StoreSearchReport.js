'use strict'

class StoreSearchReport {
  get rules() {
    return {
      category_id: 'required',
      module_id: 'required',      
      is_advanced: 'required'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreSearchReport
