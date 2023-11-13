import { Router } from 'express'
import v2 from './v2'

const router = Router()

router.use('/', v2)

export default router
