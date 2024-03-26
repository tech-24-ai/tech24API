const { hooks } = require("@adonisjs/ignitor");

hooks.after.providersBooted(() => {
  const Validator = use("Validator");
  const Database = use("Database");

  const existsFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value) {
      return;
    }
    let meesagekey = "| ";

    const [table, ...columns] = args;
    if (columns.length % 2 !== 0) {
      throw `Field or value is missing from the validation syntax`;
    }
    let key = null;
    let whereKey = null;
    let whereQuery = {};
    let whereNotQuery = {};
    for (let index = 0; index < columns.length; index++) {
      if (key) {
        whereQuery[key] = columns[index];
        key = null;
      } else if (whereKey) {
        whereNotQuery[whereKey] = columns[index];
        whereKey = null;
      } else {
        if (columns[index].startsWith("not-")) {
          whereKey = columns[index].split("-")[1];
          whereNotQuery[whereKey] = null;
        } else {
          key = columns[index];
          meesagekey += key + " | ";
          whereQuery[key] = null;
        }
      }
    }
    const row = await Database.table(table).where(whereQuery).whereNot(whereNotQuery).first();
    if (row) {
      throw `Combination of ${meesagekey} already exists`;
    }
  };

  Validator.extend("exists", existsFn);
});
