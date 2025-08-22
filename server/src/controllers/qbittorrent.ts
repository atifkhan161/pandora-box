import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { getPathsConfig } from '@/config/config.js'

export class QBittorrentController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService
  private wsService: WebSocketService
  private sessionCookie: string | null = null
  private lastLoginTime: number = 0
  private readonly LOGIN_TIMEOUT = 3600000 // 1 hour

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
    this.wsService = wsService
  }

  // Validation schemas
  private addTorrentSchema = Joi.object({
    magnetUrl: Joi.string().required().pattern(/^magnet:\?xt=urn:btih:[a-fA-F0-9]{40,}/),
    savePath: Joi.string().optional(),
    category: Joi.string().valid('movie', 'tv', 'other').default('other'),
    priority: Joi.number().integer().min(1).max(7).default(1),
    sequentialDownload: Joi.boolean().default(false),
    firstLastPiecePrio: Joi.boolean().default(false),
    tmdbId: Joi.string().optional(),
    title: Joi.string().optional()
  })

  private controlTorrentSchema = Joi.object({
    action: Joi.string().valid('pause', 'resume', 'delete', 'recheck', 'increasePrio', 'decreasePrio', 'topPrio', 'bottomPrio').required(),
    deleteFiles: Joi.boolean().default(false)
  })

  private listTorrentsSchema = Joi.object({
    filter: Joi.string().valid('all', 'downloading', 'seeding', 'completed', 'paused', 'active', 'inactive', 'errored').default('all'),
    category: Joi.string().optional(),
    sort: Joi.string().valid('name', 'size', 'progress', 'dlspeed', 'upspeed', 'priority', 'eta', 'ratio', 'added_on').default('added_on'),
    reverse: Joi.boolean().default(true),
    limit: Joi.number().integer().min(1).max(100).optional(),
    offset: Joi.number().integer().min(0).default(0)
  })

  // Ensure qBittorrent session is authenticated
  private async ensureAuthenticated(): Promise<void> {
    const now = Date.now()
    
    // Check if we need to login (no session or session expired)
    if (!this.sessionCookie || (now - this.lastLoginTime) > this.LOGIN_TIMEOUT) {
      try {
        await this.login()
      } catch (error) {
        logger.error('qBittorrent authentication failed:', error)
        throw new ExternalServiceError('qBittorrent', 'Authentication failed')
      }
    }
  }

  // Login to qBittorrent
  private async login(): Promise<void> {
    if (!this.apiProxy.isServiceAvailable('qbittorrent')) {
      throw new ExternalServiceError('qBittorrent', 'Service not configured')
    }

    const qbClient = this.apiProxy.getService('qbittorrent')
    
    try {
      const response = await qbClient.post('/api/v2/auth/login', 
        `username=${encodeURIComponent(process.env.QBITTORRENT_USERNAME || 'admin')}&password=${encodeURIComponent(process.env.QBITTORRENT_PASSWORD || 'adminpass')}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      // qBittorrent returns "Ok." on successful login
      if (response === 'Ok.') {
        this.sessionCookie = 'authenticated' // In real implementation, extract from cookies
        this.lastLoginTime = Date.now()
        logger.info('qBittorrent authentication successful')
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      logger.error('qBittorrent login failed:', error)
      throw new ExternalServiceError('qBittorrent', 'Login failed')
    }
  }

  // Add torrent
  addTorrent = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.addTorrentSchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { magnetUrl, savePath, category, priority, sequentialDownload, firstLastPiecePrio, tmdbId, title } = value
    const userId = req.user!.id

    try {
      await this.ensureAuthenticated()

      // Extract info hash from magnet URL
      const infoHashMatch = magnetUrl.match(/xt=urn:btih:([a-fA-F0-9]{40}|[a-fA-F0-9]{32})/)
      const infoHash = infoHashMatch ? infoHashMatch[1].toLowerCase() : ''

      if (!infoHash) {
        throw new ValidationError('Invalid magnet URL - cannot extract info hash')
      }

      // Check if torrent already exists
      const existingDownload = await this.dbService.findById('downloads', infoHash)
      if (existingDownload) {
        return res.json({
          success: false,
          message: 'Torrent already exists in downloads',
          data: { existing: true, download: existingDownload }
        })
      }

      // Determine save path
      const paths = getPathsConfig()
      let finalSavePath = savePath
      if (!finalSavePath) {
        switch (category) {
          case 'movie':
            finalSavePath = paths.movies
            break
          case 'tv':
            finalSavePath = paths.tvShows
            break
          default:
            finalSavePath = paths.downloads
        }
      }

      // Add torrent to qBittorrent
      const qbClient = this.apiProxy.getService('qbittorrent')
      const formData = new URLSearchParams()
      formData.append('urls', magnetUrl)
      formData.append('savepath', finalSavePath)
      formData.append('category', category)
      formData.append('priority', priority.toString())
      formData.append('sequentialDownload', sequentialDownload.toString())
      formData.append('firstLastPiecePrio', firstLastPiecePrio.toString())

      await qbClient.post('/api/v2/torrents/add', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      // Create download record in database
      const downloadData = {
        userId,
        name: title || 'Unknown',
        magnetUrl,
        infoHash,
        status: 'queued' as const,
        progress: 0,
        speed: '0 B/s',
        eta: '∞',
        size: '0 B',
        downloaded: '0 B',
        seeders: 0,
        leechers: 0,
        ratio: 0,
        category,
        tmdbId,
        savePath: finalSavePath,
        addedAt: new Date().toISOString()
      }

      const download = await this.dbService.create('downloads', downloadData)

      // Broadcast download added event
      this.wsService.broadcastDownloadUpdate(userId, {
        type: 'download_added',
        download
      })

      // Log the download addition
      logHelpers.logExternalApi('qbittorrent', '/torrents/add', 'POST', 200, 0, false)

      res.json({
        success: true,
        message: 'Torrent added successfully',
        data: { download }
      })

    } catch (error) {
      logger.error('Error adding torrent:', error)
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('qBittorrent', 'Failed to add torrent')
    }
  })

  // List torrents
  listTorrents = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.listTorrentsSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { filter, category, sort, reverse, limit, offset } = value
    const userId = req.user!.id

    try {
      await this.ensureAuthenticated()

      // Get torrents from qBittorrent
      const qbClient = this.apiProxy.getService('qbittorrent')
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('filter', filter)
      if (category) params.append('category', category)
      if (sort) params.append('sort', sort)
      if (reverse) params.append('reverse', 'true')
      if (limit) params.append('limit', limit.toString())
      if (offset) params.append('offset', offset.toString())

      const qbTorrents = await qbClient.get('/api/v2/torrents/info?' + params.toString(), null, { cache: false })

      // Get database downloads for this user
      const dbDownloads = await this.dbService.findDownloadsByUser(userId)
      const dbDownloadsMap = new Map(dbDownloads.map(d => [d.infoHash, d]))

      // Merge qBittorrent data with database data
      const mergedTorrents = qbTorrents.map((qbTorrent: any) => {
        const dbDownload = dbDownloadsMap.get(qbTorrent.hash.toLowerCase())
        return this.mergeTorrentData(qbTorrent, dbDownload)
      })

      // Filter by user's downloads only
      const userTorrents = mergedTorrents.filter((torrent: any) => 
        dbDownloadsMap.has(torrent.hash.toLowerCase())
      )

      // Update database with current status
      await this.updateDownloadStatuses(userTorrents, userId)

      res.json({
        success: true,
        data: {
          torrents: userTorrents,
          total: userTorrents.length,
          filter,
          category
        }
      })

    } catch (error) {
      logger.error('Error listing torrents:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('qBittorrent', 'Failed to list torrents')
    }
  })

  // Control torrent (pause, resume, delete, etc.)
  controlTorrent = asyncHandler(async (req: Request, res: Response) => {
    const { error: paramsError } = Joi.object({
      hash: Joi.string().required().length(40).pattern(/^[a-fA-F0-9]+$/)
    }).validate(req.params)

    if (paramsError) {
      throw new ValidationError('Invalid torrent hash')
    }

    const { error, value } = this.controlTorrentSchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { hash } = req.params
    const { action, deleteFiles } = value
    const userId = req.user!.id

    try {
      await this.ensureAuthenticated()

      // Verify user owns this download
      const download = await this.dbService.findById('downloads', hash)
      if (!download || download.userId !== userId) {
        throw new ValidationError('Download not found or access denied')
      }

      const qbClient = this.apiProxy.getService('qbittorrent')
      const formData = new URLSearchParams()
      formData.append('hashes', hash)

      let endpoint = ''
      let newStatus = download.status

      switch (action) {
        case 'pause':
          endpoint = '/api/v2/torrents/pause'
          newStatus = 'paused'
          break
        case 'resume':
          endpoint = '/api/v2/torrents/resume'
          newStatus = 'downloading'
          break
        case 'delete':
          endpoint = '/api/v2/torrents/delete'
          formData.append('deleteFiles', deleteFiles.toString())
          newStatus = 'deleted'
          break
        case 'recheck':
          endpoint = '/api/v2/torrents/recheck'
          break
        case 'increasePrio':
          endpoint = '/api/v2/torrents/increasePrio'
          break
        case 'decreasePrio':
          endpoint = '/api/v2/torrents/decreasePrio'
          break
        case 'topPrio':
          endpoint = '/api/v2/torrents/topPrio'
          break
        case 'bottomPrio':
          endpoint = '/api/v2/torrents/bottomPrio'
          break
      }

      // Execute action on qBittorrent
      await qbClient.post(endpoint, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      // Update database record
      if (action === 'delete') {
        await this.dbService.delete('downloads', download.id)
      } else {
        await this.dbService.update('downloads', download.id, {
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      }

      // Broadcast update
      this.wsService.broadcastDownloadUpdate(userId, {
        type: 'download_updated',
        hash,
        action,
        status: newStatus
      })

      res.json({
        success: true,
        message: `Torrent ${action} successful`,
        data: { hash, action, status: newStatus }
      })

    } catch (error) {
      logger.error(`Error controlling torrent (${action}):`, error)
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('qBittorrent', `Failed to ${action} torrent`)
    }
  })

  // Get torrent details
  getTorrentDetails = asyncHandler(async (req: Request, res: Response) => {
    const { hash } = req.params
    const userId = req.user!.id

    if (!hash || !/^[a-fA-F0-9]{40}$/.test(hash)) {
      throw new ValidationError('Invalid torrent hash')
    }

    try {
      await this.ensureAuthenticated()

      // Verify user owns this download
      const download = await this.dbService.findById('downloads', hash)
      if (!download || download.userId !== userId) {
        throw new ValidationError('Download not found or access denied')
      }

      const qbClient = this.apiProxy.getService('qbittorrent')
      
      // Get torrent properties
      const [properties, trackers, files] = await Promise.all([
        qbClient.get(`/api/v2/torrents/properties?hash=${hash}`, null, { cache: false }),
        qbClient.get(`/api/v2/torrents/trackers?hash=${hash}`, null, { cache: false }),
        qbClient.get(`/api/v2/torrents/files?hash=${hash}`, null, { cache: false })
      ])

      const details = {
        hash,
        download,
        properties: this.transformTorrentProperties(properties),
        trackers: this.transformTorrentTrackers(trackers),
        files: this.transformTorrentFiles(files)
      }

      res.json({
        success: true,
        data: details
      })

    } catch (error) {
      logger.error('Error getting torrent details:', error)
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('qBittorrent', 'Failed to get torrent details')
    }
  })

  // Get qBittorrent preferences
  getPreferences = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.ensureAuthenticated()

      const qbClient = this.apiProxy.getService('qbittorrent')
      const preferences = await qbClient.get('/api/v2/app/preferences', null, { cache: true, cacheTTL: 300 })

      // Filter sensitive information
      const filteredPrefs = {
        max_connec: preferences.max_connec,
        max_uploads: preferences.max_uploads,
        dl_limit: preferences.dl_limit,
        up_limit: preferences.up_limit,
        max_ratio: preferences.max_ratio,
        max_seeding_time: preferences.max_seeding_time,
        save_path: preferences.save_path,
        temp_path: preferences.temp_path,
        autorun_enabled: preferences.autorun_enabled,
        queueing_enabled: preferences.queueing_enabled,
        max_active_downloads: preferences.max_active_downloads,
        max_active_uploads: preferences.max_active_uploads,
        max_active_torrents: preferences.max_active_torrents
      }

      res.json({
        success: true,
        data: { preferences: filteredPrefs }
      })

    } catch (error) {
      logger.error('Error getting qBittorrent preferences:', error)
      throw new ExternalServiceError('qBittorrent', 'Failed to get preferences')
    }
  })

  // Get global transfer info
  getTransferInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.ensureAuthenticated()

      const qbClient = this.apiProxy.getService('qbittorrent')
      const transferInfo = await qbClient.get('/api/v2/transfer/info', null, { cache: false })

      const formattedInfo = {
        dl_info_speed: this.formatBytes(transferInfo.dl_info_speed) + '/s',
        up_info_speed: this.formatBytes(transferInfo.up_info_speed) + '/s',
        dl_info_data: this.formatBytes(transferInfo.dl_info_data),
        up_info_data: this.formatBytes(transferInfo.up_info_data),
        dl_rate_limit: transferInfo.dl_rate_limit,
        up_rate_limit: transferInfo.up_rate_limit,
        dht_nodes: transferInfo.dht_nodes,
        connection_status: transferInfo.connection_status
      }

      res.json({
        success: true,
        data: { transferInfo: formattedInfo }
      })

    } catch (error) {
      logger.error('Error getting transfer info:', error)
      throw new ExternalServiceError('qBittorrent', 'Failed to get transfer info')
    }
  })

  // Merge qBittorrent torrent data with database download data
  private mergeTorrentData(qbTorrent: any, dbDownload?: any): any {
    return {
      hash: qbTorrent.hash,
      name: qbTorrent.name,
      size: qbTorrent.size,
      sizeFormatted: this.formatBytes(qbTorrent.size),
      progress: Math.round(qbTorrent.progress * 100),
      dlspeed: qbTorrent.dlspeed,
      dlspeedFormatted: this.formatBytes(qbTorrent.dlspeed) + '/s',
      upspeed: qbTorrent.upspeed,
      upspeedFormatted: this.formatBytes(qbTorrent.upspeed) + '/s',
      priority: qbTorrent.priority,
      num_seeds: qbTorrent.num_seeds,
      num_leechs: qbTorrent.num_leechs,
      ratio: Math.round(qbTorrent.ratio * 100) / 100,
      eta: qbTorrent.eta,
      etaFormatted: this.formatETA(qbTorrent.eta),
      state: qbTorrent.state,
      category: qbTorrent.category,
      added_on: qbTorrent.added_on,
      completed_on: qbTorrent.completed_on,
      save_path: qbTorrent.save_path,
      downloaded: qbTorrent.downloaded,
      downloadedFormatted: this.formatBytes(qbTorrent.downloaded),
      uploaded: qbTorrent.uploaded,
      uploadedFormatted: this.formatBytes(qbTorrent.uploaded),
      // Database fields
      userId: dbDownload?.userId,
      tmdbId: dbDownload?.tmdbId,
      addedAt: dbDownload?.addedAt,
      magnetUrl: dbDownload?.magnetUrl
    }
  }

  // Update download statuses in database
  private async updateDownloadStatuses(torrents: any[], userId: string): Promise<void> {
    for (const torrent of torrents) {
      try {
        const status = this.mapQBStateToStatus(torrent.state)
        await this.dbService.update('downloads', torrent.hash, {
          status,
          progress: torrent.progress,
          speed: torrent.dlspeedFormatted,
          eta: torrent.etaFormatted,
          size: torrent.sizeFormatted,
          downloaded: torrent.downloadedFormatted,
          seeders: torrent.num_seeds,
          leechers: torrent.num_leechs,
          ratio: torrent.ratio,
          updatedAt: new Date().toISOString()
        })

        // Broadcast real-time updates
        this.wsService.broadcastDownloadUpdate(userId, {
          type: 'download_status_update',
          hash: torrent.hash,
          status,
          progress: torrent.progress,
          speed: torrent.dlspeedFormatted
        })
      } catch (error) {
        logger.error(`Error updating download status for ${torrent.hash}:`, error)
      }
    }
  }

  // Map qBittorrent state to our status
  private mapQBStateToStatus(state: string): 'downloading' | 'completed' | 'paused' | 'error' | 'queued' {
    switch (state) {
      case 'downloading':
      case 'metaDL':
        return 'downloading'
      case 'uploading':
      case 'stalledUP':
        return 'completed'
      case 'pausedDL':
      case 'pausedUP':
        return 'paused'
      case 'error':
      case 'missingFiles':
        return 'error'
      case 'queuedDL':
      case 'queuedUP':
      case 'allocating':
        return 'queued'
      default:
        return 'queued'
    }
  }

  // Transform torrent properties
  private transformTorrentProperties(properties: any): any {
    return {
      save_path: properties.save_path,
      creation_date: properties.creation_date,
      piece_size: this.formatBytes(properties.piece_size),
      pieces_num: properties.pieces_num,
      pieces_have: properties.pieces_have,
      comment: properties.comment,
      wasted: this.formatBytes(properties.wasted),
      time_elapsed: this.formatDuration(properties.time_elapsed),
      nb_connections: properties.nb_connections,
      nb_connections_limit: properties.nb_connections_limit,
      share_ratio: Math.round(properties.share_ratio * 100) / 100,
      addition_date: properties.addition_date,
      completion_date: properties.completion_date,
      created_by: properties.created_by,
      dl_speed_avg: this.formatBytes(properties.dl_speed_avg) + '/s',
      up_speed_avg: this.formatBytes(properties.up_speed_avg) + '/s'
    }
  }

  // Transform torrent trackers
  private transformTorrentTrackers(trackers: any[]): any[] {
    return trackers.map(tracker => ({
      url: tracker.url,
      tier: tracker.tier,
      num_peers: tracker.num_peers,
      num_seeds: tracker.num_seeds,
      num_leeches: tracker.num_leeches,
      num_downloaded: tracker.num_downloaded,
      status: tracker.status,
      msg: tracker.msg
    }))
  }

  // Transform torrent files
  private transformTorrentFiles(files: any[]): any[] {
    return files.map(file => ({
      name: file.name,
      size: this.formatBytes(file.size),
      progress: Math.round(file.progress * 100),
      priority: file.priority,
      is_seed: file.is_seed,
      piece_range: file.piece_range,
      availability: file.availability
    }))
  }

  // Helper functions
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private formatETA(seconds: number): string {
    if (seconds === 8640000 || seconds < 0) return '∞'
    if (seconds === 0) return '0s'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  private formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }
}

export default QBittorrentController