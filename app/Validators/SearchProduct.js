'use strict'

class SearchProduct {
  get rules() {
    return {      
      search_report_id: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = SearchProduct
