'use strict';

// todo: tests!

const appRoot = require('app-root-path');

const slice = Array.prototype.slice;

// todo: add a common prefix to any symbol constant?
const queryCallback = Symbol('database.query callback');
const staticProxy = Symbol('static method, proxy to instance method');

// used to mark a string, to not be wrapped in an escaped string
class DatabaseQueryLiteral extends String {
  constructor(str) {
    super(str);
  }
}

class DatabaseQueryCast extends DatabaseQueryLiteral {
  constructor(str, castTo) {
    // todo: find a better, future-proof way of accessing pg escaping (or is this fine?)
    const prepareValue = require('pg/lib/utils').prepareValue;
    super(`'${prepareValue(str)}'::${prepareValue(castTo)}`);
  }
}

module.exports = class DatabaseTable {
  constructor(tableName) {
    this.tableName = tableName;
  }

  select(/* [constraints, ...,] callback */) {
    const database = require(`${appRoot}/modules/database`);

    const args = slice.call(arguments);
    const callback = args.pop(); // callback is assumed to always be last arg
    const constraints = args; // anything left in arguments will be considered constraints
    const queryValues = [];

    const whereClause = generateWhereClause(constraints, queryValues);

    database.query(`SELECT * FROM ${this.tableName}${whereClause}`, queryValues, this[queryCallback](callback));
    return this;
  }

  static select() {
    return this[staticProxy]('select', arguments);
  }

  update(/* updates, [constraints, ...,] callback */) {
    const database = require(`${appRoot}/modules/database`);

    const args = slice.call(arguments);
    const updates = args.shift(); // updates is assumed to always be the first arg
    const callback = args.pop(); // callback is assumed to always be last arg
    const constraints = args; // anything left in arguments will be considered constraints
    const queryValues = [];

    const updatesSql = generateSqlKeyVals(', ', updates, queryValues);
    const whereClause = generateWhereClause(constraints, queryValues);

    database.query(`UPDATE ${this.tableName} SET ${updatesSql}${whereClause}`, queryValues, this[queryCallback](callback));
    return this;
  }

  static update() {
    return this[staticProxy]('update', arguments);
  }

  delete(/* [constraints, ...,] callback */) {
    const database = require(`${appRoot}/modules/database`);

    const args = slice.call(arguments);
    const callback = args.pop(); // callback is assumed to always be last arg
    const constraints = args; // anything left in arguments will be considered constraints
    const queryValues = [];

    const whereClause = generateWhereClause(constraints, queryValues);

    database.query(`DELETE FROM ${this.tableName}${whereClause}`, queryValues, this[queryCallback](callback));
    return this;
  }

  static delete() {
    return this[staticProxy]('delete', arguments);
  }

  insert(/* newRowContent[, newRowContent, ...,], callback */) {
    const database = require(`${appRoot}/modules/database`);

    const args = slice.call(arguments);
    const callback = args.pop(); // callback is assumed to always be last arg
    const newRows = args; // anything left in arguments will be considered new row objects

    if (!newRows.length) {
      callback(new Error('There were no rows to insert'));
      return this;
    }

    const columnNames = findAllColumnNames(newRows);

    if (columnNames.includes('id')) {
      callback(new Error('Cannot insert a row that has .id'));
      return this;
    }

    const queryValues = [];
    const insertAssignmentsFormatted = generateInsertValues(newRows, columnNames, queryValues);

    database.query(`INSERT INTO ${this.tableName}(${columnNames.join(', ')}) VALUES ${insertAssignmentsFormatted} RETURNING *`, queryValues, this[queryCallback](callback));
    return this;
  }

  static insert() {
    return this[staticProxy]('insert', arguments);
  }

  upsert(insertContent, updateContent, updateConstraints, callback) {
    this.insert(insertContent, function(err) {
      if (!err) {
        return callback.apply(callback, slice.call(arguments));
      }

      if (err && typeof err.message === 'string' && err.message.substr(0, 13) === 'duplicate key') {
        return this.update(updateContent, updateConstraints, callback);
      }

      return callback(err);
    }.bind(this));

    return this;
  }

  static upsert() {
    return this[staticProxy]('upsert', arguments);
  }

  [queryCallback](callback) {
    return (err, result) => {
      if (err) {
        return callback(err)
      }

      const DatabaseRow = require(`${appRoot}/classes/DatabaseRow`);
      return callback(null, (result.rows || []).map(row => {
        return new DatabaseRow(this.tableName, row);
      }));
    };
  }

  static [staticProxy](methodName, originalArgs /* [ tableName, [constraints, ...,] callback ] */) {
    const args = slice.call(originalArgs);
    const tableName = args.shift();
    const instance = new DatabaseTable(tableName);
    instance[methodName].apply(instance, args);
    return this;
  }

  static literal(str) {
    return new DatabaseQueryLiteral(str);
  }

  static cast(str, castTo) {
    return new DatabaseQueryCast(str, castTo);
  }
}

function generateInsertValues(rows, columnNames, valuesArray) {
  const insertAssignments = [];

  for (let i = 0; i < rows.length; i++) {
    const newRowAssignment = [];

    for (let j = 0; j < columnNames.length; j++) {
      const val = rows[i][ columnNames[j] ];

      if (val === undefined) {
        newRowAssignment.push('NULL');
        continue;
      }

      if (val instanceof DatabaseQueryLiteral) {
        newRowAssignment.push(val);
        continue;
      }

      valuesArray.push(val);
      newRowAssignment.push(`$${valuesArray.length}`);
    }

    insertAssignments.push(newRowAssignment);
  }

  const valuesFormatted = insertAssignments
    .map(assignmentArr => {
      return `(${assignmentArr.join(', ')})`;
    })
    .join(', ');

  return valuesFormatted;
}

function generateSqlKeyVals(separator, dict, valuesArray) {
  return Object.keys(dict)
    .map((key, i) => {
      const val = dict[key];

      if (val instanceof DatabaseQueryLiteral) {
        return `${key} = ${val}`;
      }

      valuesArray.push(val);
      return `${key} = $${valuesArray.length}`;
    })
    .join(separator);
}

/*
  constraints should be an array of constraint {} objects
  e.g. [{ id: 1 }, { id: 2 }]
 */
function generateWhereClause(constraints, queryValues) {
  if (!constraints.length) {
    return '';
  }

  if (constraints.length === 1) {
    return ' WHERE ' + generateSqlKeyVals(' AND ', constraints[0], queryValues);
  }

  return ' WHERE ' + constraints
    .map(constr => {
      return `(${generateSqlKeyVals(' AND ', constr, queryValues)})`;
    })
    .join(' OR ');
}

/*
  iterates over one to many row objects, which may have a different number of columns,
  and returns an unordered array of columns that covers all objects
 */
function findAllColumnNames(rows) {
  const columnNames = [];

  for (let i = 0; i < rows.length; i++) {
    for (let key in rows[i]) {
      if (columnNames.includes(key)) {
        continue;
      }

      columnNames.push(key);
    }
  }

  return columnNames;
}
