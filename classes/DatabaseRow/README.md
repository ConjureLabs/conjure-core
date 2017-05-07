### DatabaseRow

This class serves a single database row, never more.

#### Row instance

```js
const DatabaseRow = require('classes/DatabaseRow');

// row from the account table
const row = new DatabaseRow('account', {
  id: 1,
  name: 'Tim Marshall',
  // ...
});
```

#### Creating a new row

```js
// no .id in row content
new DatabaseRow('account', {
  name: 'Tim Marshall'
}).save((err, row) => {
  // ...
});
```

#### Updating an existing row

```js
// has .id
new DatabaseRow('account', {
  id: 1,
  email: 'tim@marshall.iio'
}).save(err => {
  // if no error, then row 1 now has email of 'tim@marshall.io'
});
```

#### Deleting a row

```js
// has .id
new DatabaseRow('account', {
  id: 1
}).delete(err => {
  // if no error, then row 1 was successfully deleted
});
```

After a deletion you cannot make any more modifying calls to the row (like .save).
If you want to re-save the row, you'd have to call `.copy` on it and then `.save` off the new copy.


#### Copy a row

This will return a new row instance, _without an id_ (making it a copy, not a clone).

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
});

const row2 = accountRow.copy();

/*
  row2 == {
    name: 'Tim Marshall',
    email: 'tim@marshall.io'
  }

  row2 !== accountRow
 */
```

#### Chain an update to a row instance

Nearly all the methods return the instance, making chaining easy.

There is a method `.set(data)` which allows you to easily modify attributes and then chain off a `.save()`.

```js
const accountRow = new DatabaseRow('account', {
  id: 1,
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
});

// want to modify email and save
accountRow
  .set({
    email: 'tim@conjure.sh'
  })
  .save(err => {
    // ...
  });
```
