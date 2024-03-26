# Tech24 web services

## Setup

clone the repo and then run `npm install`.


### Migrations

Run the following command to run startup migrations.

```js
adonis migration:run
ENV_PATH=.env.dev adonis migration:run --force
ENV_PATH=.env.dev adonis migration:refresh --force
```

### Seed

Run the following command to run startup seeds.

```js
adonis seed
ENV_PATH=.env.dev adonis seed --force
```


### Run Application

Run the following command to run application.

```js
adonis serve --dev
ENV_PATH=.env.dev adonis serve --dev
```
