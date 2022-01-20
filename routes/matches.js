import express from 'express'

const router = express.Router()


router.get("/", getMatches)
router.post("/", postMatch)



export default router;