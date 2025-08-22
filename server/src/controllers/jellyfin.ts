import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'

export class JellyfinController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService
  private wsService: WebSocketService

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
    this.wsService = wsService
  }

  // Validation schemas
  private scanLibrarySchema = Joi.object({
    libraryType: Joi.string().valid('movies', 'tv', 'collections', 'all').required(),
    libraryId: Joi.string().optional()
  })

  // Get Jellyfin server info
  getServerInfo = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if Jellyfin service is available
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      // Get server info
      const serverInfo = await jellyfinClient.get('/System/Info', null, { cache: true, cacheTTL: 300 })
      
      // Get public info (doesn't require authentication)
      const publicInfo = await jellyfinClient.get('/System/Info/Public', null, { cache: true, cacheTTL: 300 })

      // Transform server info
      const transformedInfo = {
        serverName: serverInfo.ServerName || publicInfo.ServerName,
        version: serverInfo.Version || publicInfo.Version,
        id: serverInfo.Id || publicInfo.Id,
        operatingSystem: serverInfo.OperatingSystem,
        architecture: serverInfo.Architecture,
        runningTime: this.formatRunningTime(serverInfo.RunningTimeInSeconds),
        isStartupWizardCompleted: serverInfo.IsStartupWizardCompleted,
        supportsLibraryMonitor: serverInfo.SupportsLibraryMonitor,
        webPath: serverInfo.WebPath,
        status: 'online'
      }

      res.json({
        success: true,
        data: transformedInfo
      })

    } catch (error) {
      logger.error('Error fetching Jellyfin server info:', error)
      
      // Return offline status if service is unavailable
      res.json({
        success: true,
        data: {
          serverName: 'Jellyfin Server',
          status: 'offline',
          error: 'Service unavailable'
        }
      })
    }
  })

  // Get libraries
  getLibraries = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      // Get libraries
      const libraries = await jellyfinClient.get('/Items', {
        parentId: '',
        includeItemTypes: 'CollectionFolder'
      }, { cache: true, cacheTTL: 600 })

      // Transform library data
      const transformedLibraries = libraries.Items?.map((library: any) => ({
        id: library.Id,
        name: library.Name,
        type: this.mapLibraryType(library.CollectionType),
        path: library.Path,
        itemCount: library.ChildCount || 0,
        lastModified: library.DateModified,
        canRefresh: true
      })) || []

      res.json({
        success: true,
        data: {
          libraries: transformedLibraries,
          total: transformedLibraries.length
        }
      })

    } catch (error) {
      logger.error('Error fetching Jellyfin libraries:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Jellyfin', 'Failed to fetch libraries')
    }
  })

  // Trigger library scan
  scanLibrary = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.scanLibrarySchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { libraryType, libraryId } = value
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      // Log scan start
      const scanRecord = await this.logLibraryScan(userId, libraryType, 'running')

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      let scanResult
      if (libraryId) {
        // Scan specific library
        scanResult = await jellyfinClient.post(`/Items/${libraryId}/Refresh`, {
          Recursive: true,
          ImageRefreshMode: 'Default',
          MetadataRefreshMode: 'Default'
        })
      } else {
        // Scan all libraries of type or all libraries
        if (libraryType === 'all') {
          scanResult = await jellyfinClient.post('/Library/Refresh')
        } else {
          // Get libraries of specific type and scan them
          const libraries = await this.getLibrariesByType(libraryType)
          const scanPromises = libraries.map(lib => 
            jellyfinClient.post(`/Items/${lib.id}/Refresh`, {
              Recursive: true,
              ImageRefreshMode: 'Default',
              MetadataRefreshMode: 'Default'
            })
          )
          scanResult = await Promise.all(scanPromises)
        }
      }

      // Update scan record
      await this.dbService.update('jellyfin_scans', scanRecord.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      // Broadcast scan started event
      this.wsService.broadcastToUser(userId, {
        type: 'jellyfin',
        event: 'scan_started',
        data: {
          libraryType,
          libraryId,
          scanId: scanRecord.id
        }
      })

      res.json({
        success: true,
        message: `Library scan initiated for ${libraryType}`,
        data: {
          scanId: scanRecord.id,
          libraryType,
          libraryId
        }
      })

    } catch (error) {
      logger.error('Error starting library scan:', error)
      
      // Update scan record with error
      try {
        const scans = await this.dbService.find('jellyfin_scans', {
          userId,
          libraryType,
          status: 'running'
        }, { limit: 1, sort: 'startedAt', order: 'desc' })

        if (scans.length > 0) {
          await this.dbService.update('jellyfin_scans', scans[0].id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date().toISOString()
          })
        }
      } catch (logError) {
        logger.error('Error updating scan log:', logError)
      }

      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('Jellyfin', 'Failed to start library scan')
    }
  })

  // Get scan status
  getScanStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      // Get running scheduled tasks (library scans)
      const scheduledTasks = await jellyfinClient.get('/ScheduledTasks', null, { cache: false })
      
      // Filter library scan tasks
      const libraryScanTasks = scheduledTasks.filter((task: any) => 
        task.Name?.includes('Scan') || task.Key?.includes('RefreshLibrary')
      )

      // Get recent scan history from database
      const recentScans = await this.dbService.find('jellyfin_scans', {
        userId
      }, {
        limit: 10,
        sort: 'startedAt',
        order: 'desc'
      })

      // Transform scan data
      const transformedScans = recentScans.map((scan: any) => ({
        id: scan.id,
        libraryType: scan.libraryType,
        status: scan.status,
        progress: scan.progress || 0,
        itemsAdded: scan.itemsAdded || 0,
        itemsUpdated: scan.itemsUpdated || 0,
        startedAt: scan.startedAt,
        completedAt: scan.completedAt,
        errorMessage: scan.errorMessage,
        duration: scan.completedAt ? this.calculateDuration(scan.startedAt, scan.completedAt) : null
      }))

      res.json({
        success: true,
        data: {
          currentScans: libraryScanTasks.map((task: any) => ({
            id: task.Id,
            name: task.Name,
            state: task.State,
            currentProgressPercentage: task.CurrentProgressPercentage || 0,
            lastExecutionResult: task.LastExecutionResult
          })),
          recentScans: transformedScans,
          isScanning: libraryScanTasks.some((task: any) => task.State === 'Running')
        }
      })

    } catch (error) {
      logger.error('Error getting scan status:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Jellyfin', 'Failed to get scan status')
    }
  })

  // Get library statistics
  getLibraryStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      // Get library statistics
      const [movieStats, tvStats, musicStats] = await Promise.all([
        this.getItemStats(jellyfinClient, 'Movie'),
        this.getItemStats(jellyfinClient, 'Series'),
        this.getItemStats(jellyfinClient, 'MusicAlbum')
      ])

      const stats = {
        movies: movieStats,
        tvShows: tvStats,
        music: musicStats,
        lastUpdated: new Date().toISOString()
      }

      res.json({
        success: true,
        data: stats
      })

    } catch (error) {
      logger.error('Error getting library statistics:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Jellyfin', 'Failed to get library statistics')
    }
  })

  // Clean library (remove missing items)
  cleanLibrary = asyncHandler(async (req: Request, res: Response) => {
    const { libraryId } = req.params
    const userId = req.user!.id

    try {
      if (!this.apiProxy.isServiceAvailable('jellyfin')) {
        throw new ExternalServiceError('Jellyfin', 'Service not configured')
      }

      const jellyfinClient = this.apiProxy.getService('jellyfin')
      
      // Trigger library cleanup
      await jellyfinClient.post('/Library/DeleteMediaFiles', {
        ids: [libraryId]
      })

      // Log the cleanup operation
      await this.logLibraryScan(userId, 'cleanup', 'completed')

      // Broadcast cleanup event
      this.wsService.broadcastToUser(userId, {
        type: 'jellyfin',
        event: 'cleanup_completed',
        data: {
          libraryId
        }
      })

      res.json({
        success: true,
        message: 'Library cleanup initiated',
        data: {
          libraryId
        }
      })

    } catch (error) {
      logger.error('Error cleaning library:', error)
      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('Jellyfin', 'Failed to clean library')
    }
  })

  // Private helper methods
  private mapLibraryType(collectionType: string): string {
    const typeMap: Record<string, string> = {
      'movies': 'movies',
      'tvshows': 'tv',
      'music': 'music',
      'books': 'books',
      'photos': 'photos',
      'livetv': 'livetv'
    }
    
    return typeMap[collectionType?.toLowerCase()] || collectionType || 'unknown'
  }

  private async getLibrariesByType(libraryType: string): Promise<any[]> {
    const jellyfinClient = this.apiProxy.getService('jellyfin')
    
    const libraries = await jellyfinClient.get('/Items', {
      parentId: '',
      includeItemTypes: 'CollectionFolder'
    })

    const typeFilter = libraryType === 'movies' ? 'movies' : 
                      libraryType === 'tv' ? 'tvshows' : 
                      libraryType

    return libraries.Items?.filter((lib: any) => 
      this.mapLibraryType(lib.CollectionType) === libraryType
    ).map((lib: any) => ({
      id: lib.Id,
      name: lib.Name,
      type: this.mapLibraryType(lib.CollectionType)
    })) || []
  }

  private async getItemStats(client: any, itemType: string): Promise<any> {
    try {
      const response = await client.get('/Items', {
        includeItemTypes: itemType,
        recursive: true,
        fields: 'BasicSyncInfo'
      })

      return {
        total: response.TotalRecordCount || 0,
        items: response.Items?.length || 0
      }
    } catch (error) {
      logger.error(`Error getting ${itemType} stats:`, error)
      return { total: 0, items: 0 }
    }
  }

  private formatRunningTime(seconds: number): string {
    if (!seconds) return 'Unknown'
    
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

  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const duration = Math.floor((end - start) / 1000)
    
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    
    return `${minutes}m ${seconds}s`
  }

  private async logLibraryScan(
    userId: string,
    libraryType: string,
    status: 'running' | 'completed' | 'failed'
  ): Promise<any> {
    return this.dbService.create('jellyfin_scans', {
      userId,
      libraryType,
      status,
      progress: 0,
      itemsAdded: 0,
      itemsUpdated: 0,
      startedAt: new Date().toISOString()
    })
  }

  // Method to be called by file operations when files are moved to media folders
  static async triggerAutoScan(libraryPath: string, apiProxy: ApiProxyService, dbService: DatabaseService): Promise<void> {
    try {
      if (!apiProxy.isServiceAvailable('jellyfin')) {
        logger.info('Jellyfin not available for auto-scan')
        return
      }

      const jellyfinClient = apiProxy.getService('jellyfin')
      
      // Determine library type from path
      let libraryType = 'unknown'
      if (libraryPath.toLowerCase().includes('movie')) {
        libraryType = 'movies'
      } else if (libraryPath.toLowerCase().includes('tv') || libraryPath.toLowerCase().includes('show')) {
        libraryType = 'tv'
      }

      // Get libraries and find matching one
      const libraries = await jellyfinClient.get('/Items', {
        parentId: '',
        includeItemTypes: 'CollectionFolder'
      })

      const matchingLibrary = libraries.Items?.find((lib: any) => 
        lib.Path && libraryPath.startsWith(lib.Path)
      )

      if (matchingLibrary) {
        // Trigger scan for specific library
        await jellyfinClient.post(`/Items/${matchingLibrary.Id}/Refresh`, {
          Recursive: true,
          ImageRefreshMode: 'Default',
          MetadataRefreshMode: 'Default'
        })

        logger.info(`Jellyfin auto-scan triggered for library: ${matchingLibrary.Name}`)
      } else {
        logger.info(`No matching Jellyfin library found for path: ${libraryPath}`)
      }

    } catch (error) {
      logger.error('Error triggering Jellyfin auto-scan:', error)
    }
  }
}

export default JellyfinController