"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class CategoryRole extends Model {
  static get table() {
    return "category_role";
  }

  categories() {
    return this.belongsTo("App/Models/Admin/ProductModule/Category");
  }

  roles() {
    return this.belongsTo("App/Models/Admin/UserModule/Role");
  }

  static get incrementing() {
    return false;
  }

  static get createdAtColumn() {
    return null;
  }

  static get updatedAtColumn() {
    return null;
  }
}

module.exports = CategoryRole;
