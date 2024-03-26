'use strict'

class StoreDocumentList {
  get rules() {
    return {
      vendor_id: 'required',
      document_type: 'required',
      document_title: 'required',
      document_file_name: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreDocumentList
