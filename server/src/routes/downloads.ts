import { Router } from 'express'

const router = Router()

// Downloads management routes - placeholder
router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'Downloads endpoints not yet implemented' })
})

router.post('/search-torrents', (req, res) => {
  res.status(501).json({ success: false, message: 'Downloads endpoints not yet implemented' })
})

router.post('/add', (req, res) => {
  res.status(501).json({ success: false, message: 'Downloads endpoints not yet implemented' })
})

router.post('/:id/control', (req, res) => {
  res.status(501).json({ success: false, message: 'Downloads endpoints not yet implemented' })
})

router.delete('/:id', (req, res) => {
  res.status(501).json({ success: false, message: 'Downloads endpoints not yet implemented' })
})

export default router