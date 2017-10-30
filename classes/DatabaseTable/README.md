### DatabaseTable

This classes serves as a proxy to database tables, making it easier to select, insert, etc.

#### Select

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// SELECT * FROM account;
const rows1 = await account.select();

// SELECT * FROM account WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await account.select({
  id: 1,
  name: 'Tim Marshall'
});

// SELECT * FROM account WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
const rows3 = await account.select({
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// SELECT * FROM account;
const rows1 = await DatabaseTable.select('account');

// SELECT * FROM account WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await DatabaseTable.select('account', {
  id: 1,
  name: 'Tim Marshall'
});
```
</details>

#### Update

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// UPDATE account SET activated = false;
const rows1 = await account.update({
  activated: false
});

// UPDATE account SET email = 'tim@marshall.io' WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await account.update({
  email: 'tim@marshall.io'
}, {
  id: 1,
  name: 'Tim Marshall'
});

// UPDATE account SET email = 'tim@marshall.io' WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
const rows3 = await account.update({
  email: 'tim@marshall.io'
}, {
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// UPDATE account SET activated = false;
const rows1 = await DatabaseTable.update('account', {
  activated: false
});

// UPDATE account SET activated = false WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await DatabaseTable.update('account', {
  activated: false
}, {
  id: 1,
  name: 'Tim Marshall'
});
```
</details>

#### Insert

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io');
const rows1 = await account.insert({
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
});

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io'), ('John Newton', NULL);
const rows2 = await account.insert({
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, {
  name: 'John Newton'
});
```

##### Direct (static) call

```js
// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io');
const rows1 = await DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
});

// INSERT INTO account (name, email) VALUES ('Tim Marshall', 'tim@marshall.io'), ('John Newton', NULL);
const rows2 = await DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  email: 'tim@marshall.io'
}, {
  name: 'John Newton'
});
```
</details>

#### Delete

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// DELETE FROM account;
const rows1 = await account.delete();

// DELETE FROM account WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await account.delete({
  id: 1,
  name: 'Tim Marshall'
});

// DELETE FROM account WHERE (id = 1 AND name = 'Tim Marshall') OR (id = 2);
const rows3 = await account.delete({
  id: 1,
  name: 'Tim Marshall'
}, {
  id: 2
});
```

##### Direct (static) call

```js
// DELETE FROM account;
const rows1 = await DatabaseTable.delete('account');

// DELETE FROM account WHERE id = 1 AND name = 'Tim Marshall';
const rows2 = await DatabaseTable.delete('account', {
  id: 1,
  name: 'Tim Marshall'
});
```
</details>

#### Upsert

<details>

##### Using Constructor

```js
const account = new DatabaseTable('account');

// attempts:
// INSERT INTO account (name, email, added) VALUES ('Tim Marshall', 'tim@marshall.io', NOW());
//
// falls back to:
// UPDATE account SET name = 'Tim Marshall', updated = NOW() WHERE email = 'tim@marshall.io';
const rows = await account.upsert({
  // insert
  name: 'Tim Marshall',
  email: 'tim@marshall.io',
  added: new Date()
}, {
  // update
  name: 'Tim Marshall',
  updated: new Date()
}, {
  // update conditions
  email: 'tim@marshall.io'
});
```

##### Direct (static) call

```js
// attempts:
// INSERT INTO account (name, email, added) VALUES ('Tim Marshall', 'tim@marshall.io', NOW());
//
// falls back to:
// UPDATE account SET name = 'Tim Marshall', updated = NOW() WHERE email = 'tim@marshall.io';
const rows = await DatabaseTable.upsert('account', {
  // insert
  name: 'Tim Marshall',
  email: 'tim@marshall.io',
  added: new Date()
}, {
  // update
  name: 'Tim Marshall',
  updated: new Date()
}, {
  // update conditions
  email: 'tim@marshall.io'
});
```
</details>

#### Literal strings

These are **not** escaped by the postgres module.
Use only when needed, and never with user-inputted values.

```js
// INSERT INTO accoutn (name, added) VALUES ('Tim Marshall', NOW());
const rows = await DatabaseTable.insert('account', {
  name: 'Tim Marshall',
  added: DatabaseTable.literal('NOW()')
});
```
