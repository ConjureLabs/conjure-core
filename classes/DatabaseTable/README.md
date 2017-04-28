### DatabaseTable

This classes serves as a proxy to database tables, making it easier to select, insert, etc.

#### Select

<details>
##### Using Constructor

```js
const account = new DatabaseTable('Account');

// SELECT * FROM account;
account.select((err, rows) => {
  // ...
});

// SELECT * FROM account WHERE id = 1 AND name = 'Tim Marshall';
account.select({
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});

// SELECT * FROM account WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
accont.select({
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
}, (err, rows) => {
  // ...
})
```

##### Direct (static) call

```js
// SELECT * FROM account;
DatabaseTable.select('account', (err, rows) => {
  // ...
});

// SELECT * FROM account WHERE id = 1 AND name = 'Tim Marshall';
DatabaseTable.select('account', {
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});
```
</details>

#### Update

<details>
##### Using Constructor

```js
const account = new DatabaseTable('Account');

// UPDATE account SET activated = false;
account.update({
  activated: false
}, (err, rows) => {
  // ...
});

// UPDATE account SET email = 'tim@marshall.io' WHERE id = 1 AND name = 'Tim Marshall';
account.update({
  email: 'tim@marshall.io'
}, {
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});

// UPDATE account SET email = 'tim@marshall.io' WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
account.update({
  email: 'tim@marshall.io'
}, {
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
}, (err, rows) => {
  // ...
})
```

##### Direct (static) call

```js
// UPDATE account SET activated = false;
DatabaseTable.update('account', {
  activated: false
}, (err, rows) => {
  // ...
});

// UPDATE account SET activated = false WHERE id = 1 AND name = 'Tim Marshall';
DatabaseTable.update('account', {
  activated: false
}, {
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});
```
</details>

#### Insert

<details>
##### Using Constructor

```js
const account = new DatabaseTable('Account');

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io');
account.insert({
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, (err, rows) => {
  // ...
});

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io'), ('John Newton', NULL);
account.insert({
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, {
  name: 'John Newton'
}, (err, rows) => {
  // ...
});
```

##### Direct (static) call

```js
// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io');
DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, (err, rows) => {
  // ...
});

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io'), ('John Newton', NULL);
DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, {
  name: 'John Newton'
}, (err, rows) => {
  // ...
});
```
</details>

#### Delete

<details>
##### Using Constructor

```js
const account = new DatabaseTable('Account');

// DELETE FROM account;
account.delete((err, rows) => {
  // ...
});

// DELETE FROM account WHERE id = 1 AND name = 'Tim Marshall';
account.delete({
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});

// DELETE FROM account WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
accont.delete({
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
}, (err, rows) => {
  // ...
})
```

##### Direct (static) call

```js
// DELETE FROM account;
DatabaseTable.delete('account', (err, rows) => {
  // ...
});

// DELETE FROM account WHERE id = 1 AND name = 'Tim Marshall';
DatabaseTable.delete('account', {
  id: 1,
  name: 'Tim Marshall'
}, (err, rows) => {
  // ...
});
```
</details>

#### Literal strings

These are **not** escaped by the postgres module.
Use only when needed, and never with user-inputted values.

```js
// INSERT INTO accoutn (name, added) VALUES ('Tim Marshall', NOW());
DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  added: DatabaseTable.literal('NOW()')
}, (err, rows) => {
  // ...
});
```
