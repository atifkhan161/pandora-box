import { Router } from 'express'

const router = Router()

// Jellyfin media server routes - placeholder
router.post('/scan/:libraryType', (req, res) => {
  res.status(501).json({ success: false, message: 'Jellyfin endpoints not yet implemented' })
})

router.get('/scan/status', (req, res) => {
  res.status(501).json({ success: false, message: 'Jellyfin endpoints not yet implemented' })
})

router.get('/libraries', (req, res) => {
  res.status(501).json({ success: false, message: 'Jellyfin endpoints not yet implemented' })
})

router.get('/stats', (req, res) => {
  res.status(501).json({ success: false, message: 'Jellyfin endpoints not yet implemented' })
})

export default router