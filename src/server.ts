import 'json-bigint-patch'
import 'reflect-metadata'

import express from 'express'
import bootstrap from 'src/helpers/bootstrap.js'

void (async () => {
  const app = express()

  console.log('Starting app')
  await bootstrap(app);
})()
