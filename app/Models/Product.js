'use strict'

const BaseModel = use('MongooseModel')

/**
 * @class Product
 */
class Product extends BaseModel {
  /**
   * Exclude created_at and updated_at from the model
   */
  // static get timestamps() {
  //   return true
  // }

  /**
   * Product's schema
   */
  static get schema() {
    return {
      name: String,
      vendor: String,
      moduleId: String,
      rating: String,
      notes: String,
      link: String,
      countryCategories: Array,
      questions: Array,
    }
  }
}

module.exports = Product.buildModel('Product')
