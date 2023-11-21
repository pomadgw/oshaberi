import express from 'express'

import { getClient } from '../lib/redis.js'

const router = express.Router()

router.get('/settings', async (_, res) => {
  const client = await getClient()

  const states = await client.hGetAll('settings')

  res.status(200).json(states)
})

router.get('/settings/:id', async (req, res) => {
  const client = await getClient()

  const state = await client.hGet('settings', req.params.id)

  if (state == null) {
    res.status(404).send('Not found')
  } else {
    res.status(200).json(JSON.parse(state))
  }
})

router.post('/settings/:id', async (req, res) => {
  const client = await getClient()

  const { state } = req.body

  await client.hSet('settings', req.params.id, JSON.stringify(state))

  res.status(200).send('OK')
})

router.get('/sessions', async (_, res) => {
  const client = await getClient()

  const states = await client.hGetAll('sessions')

  res.status(200).json(states)
})

router.get('/sessions/:id', async (req, res) => {
  const client = await getClient()

  const state = await client.hGet('sessions', req.params.id)

  if (state == null) {
    res.status(404).send('Not found')
  } else {
    res.status(200).json(JSON.parse(state))
  }
})

router.post('/sessions/:id', async (req, res) => {
  const client = await getClient()

  const { state } = req.body

  await client.hSet('sessions', req.params.id, JSON.stringify(state))

  res.status(200).send('OK')
})

export default router
