'use strict'

class StoreImportProduct {
  get rules() {
    return {
      moduleId: 'required',      
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreImportProduct
