import { Request, Response } from 'express'
import Joi from 'joi'
import { ApiProxyService } from '@/services/apiProxy.js'
import { DatabaseService } from '@/services/database.js'
import { WebSocketService } from '@/services/websocket.js'
import { asyncHandler, ValidationError, ExternalServiceError } from '@/middleware/errorHandler.js'
import { logger, logHelpers } from '@/utils/logger.js'
import { getPathsConfig } from '@/config/config.js'
import JellyfinController from '@/controllers/jellyfin.js'

export class CloudCommanderController {
  private apiProxy: ApiProxyService
  private dbService: DatabaseService
  private wsService: WebSocketService

  constructor(apiProxy: ApiProxyService, dbService: DatabaseService, wsService: WebSocketService) {
    this.apiProxy = apiProxy
    this.dbService = dbService
    this.wsService = wsService
  }

  // Validation schemas
  private browseSchema = Joi.object({
    path: Joi.string().default('/'),
    sort: Joi.string().valid('name', 'size', 'date', 'type').default('name'),
    order: Joi.string().valid('asc', 'desc').default('asc'),
    showHidden: Joi.boolean().default(false)
  })

  private fileOperationSchema = Joi.object({
    operation: Joi.string().valid('move', 'copy', 'delete', 'rename', 'create').required(),
    sourcePath: Joi.string().required(),
    targetPath: Joi.string().when('operation', {
      is: Joi.string().valid('move', 'copy', 'rename'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    fileName: Joi.string().when('operation', {
      is: 'create',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    isDirectory: Joi.boolean().default(false)
  })

  // Browse directory
  browseDirectory = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.browseSchema.validate(req.query)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { path, sort, order, showHidden } = value
    const userId = req.user!.id

    try {
      // Check if Cloud Commander service is available
      if (!this.apiProxy.isServiceAvailable('cloudcommander')) {
        throw new ExternalServiceError('CloudCommander', 'Service not configured')
      }

      const cloudCmdClient = this.apiProxy.getService('cloudcommander')
      
      // Get directory listing
      const response = await cloudCmdClient.get('/api/v1/fs', {
        path: path,
        sort: sort,
        order: order,
        hidden: showHidden
      }, { cache: false })

      // Transform the response
      const transformedData = this.transformDirectoryListing(response, path)

      // Log file operation
      await this.logFileOperation(userId, 'browse', path, undefined, 'completed')

      res.json({
        success: true,
        data: transformedData
      })

    } catch (error) {
      logger.error('Error browsing directory:', error)
      if (error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('CloudCommander', 'Failed to browse directory')
    }
  })

  // Perform file operation
  performFileOperation = asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = this.fileOperationSchema.validate(req.body)

    if (error) {
      throw new ValidationError(error.details[0].message)
    }

    const { operation, sourcePath, targetPath, fileName, isDirectory } = value
    const userId = req.user!.id

    try {
      // Check if Cloud Commander service is available
      if (!this.apiProxy.isServiceAvailable('cloudcommander')) {
        throw new ExternalServiceError('CloudCommander', 'Service not configured')
      }

      // Log operation start
      const operationRecord = await this.logFileOperation(userId, operation, sourcePath, targetPath, 'in_progress')

      const cloudCmdClient = this.apiProxy.getService('cloudcommander')
      let result

      switch (operation) {
        case 'move':
          result = await this.moveFile(cloudCmdClient, sourcePath, targetPath!)
          break
        case 'copy':
          result = await this.copyFile(cloudCmdClient, sourcePath, targetPath!)
          break
        case 'delete':
          result = await this.deleteFile(cloudCmdClient, sourcePath)
          break
        case 'rename':
          result = await this.renameFile(cloudCmdClient, sourcePath, targetPath!)
          break
        case 'create':
          result = await this.createItem(cloudCmdClient, sourcePath, fileName!, isDirectory)
          break
        default:
          throw new ValidationError('Unsupported operation')
      }

      // Update operation record
      await this.dbService.update('file_operations', operationRecord.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      })

      // Broadcast file operation update
      this.wsService.broadcastFileOperation(userId, {
        type: 'file_operation_completed',
        operation,
        sourcePath,
        targetPath,
        result
      })

      // Check if we need to trigger Jellyfin scan
      if ((operation === 'move' || operation === 'copy') && this.isMediaFolder(targetPath!)) {
        await this.triggerJellyfinScan(targetPath!)
      }

      res.json({
        success: true,
        message: `File ${operation} completed successfully`,
        data: result
      })

    } catch (error) {
      logger.error(`Error performing ${operation} operation:`, error)
      
      // Update operation record with error
      try {
        const operations = await this.dbService.find('file_operations', {
          userId,
          operation,
          sourcePath,
          status: 'in_progress'
        }, { limit: 1, sort: 'createdAt', order: 'desc' })

        if (operations.length > 0) {
          await this.dbService.update('file_operations', operations[0].id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date().toISOString()
          })
        }
      } catch (logError) {
        logger.error('Error updating operation log:', logError)
      }

      if (error instanceof ExternalServiceError || error instanceof ValidationError) {
        throw error
      }
      throw new ExternalServiceError('CloudCommander', `Failed to ${operation} file`)
    }
  })

  // Quick move to media folders
  moveToMediaFolder = asyncHandler(async (req: Request, res: Response) => {
    const { sourcePath, mediaType } = req.body
    const userId = req.user!.id

    if (!sourcePath || !mediaType || !['movies', 'tv'].includes(mediaType)) {
      throw new ValidationError('Valid sourcePath and mediaType (movies/tv) are required')
    }

    try {
      const paths = getPathsConfig()
      const targetPath = mediaType === 'movies' ? paths.movies : paths.tvShows
      
      // Determine final path
      const fileName = sourcePath.split('/').pop()
      const finalTargetPath = `${targetPath}/${fileName}`

      // Perform move operation
      await this.performFileOperation(
        { ...req, body: { operation: 'move', sourcePath, targetPath: finalTargetPath } } as Request,
        res
      )

    } catch (error) {
      logger.error('Error moving to media folder:', error)
      throw error
    }
  })

  // Get file operation history
  getFileOperationHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const { limit = 50, offset = 0, operation, status } = req.query

    try {
      const filter: any = { userId }
      if (operation) filter.operation = operation
      if (status) filter.status = status

      const operations = await this.dbService.find('file_operations', filter, {
        limit: Number(limit),
        offset: Number(offset),
        sort: 'createdAt',
        order: 'desc'
      })

      res.json({
        success: true,
        data: {
          operations,
          total: operations.length
        }
      })

    } catch (error) {
      logger.error('Error getting file operation history:', error)
      throw new ExternalServiceError('Database', 'Failed to get operation history')
    }
  })

  // Private helper methods
  private async moveFile(client: any, source: string, target: string): Promise<any> {
    return client.put('/api/v1/fs', {
      from: source,
      to: target,
      operation: 'move'
    })
  }

  private async copyFile(client: any, source: string, target: string): Promise<any> {
    return client.put('/api/v1/fs', {
      from: source,
      to: target,
      operation: 'copy'
    })
  }

  private async deleteFile(client: any, path: string): Promise<any> {
    return client.delete('/api/v1/fs', { data: { path } })
  }

  private async renameFile(client: any, oldPath: string, newPath: string): Promise<any> {
    return client.put('/api/v1/fs', {
      from: oldPath,
      to: newPath,
      operation: 'rename'
    })
  }

  private async createItem(client: any, path: string, name: string, isDirectory: boolean): Promise<any> {
    return client.post('/api/v1/fs', {
      path: `${path}/${name}`,
      type: isDirectory ? 'directory' : 'file'
    })
  }

  private transformDirectoryListing(data: any, currentPath: string): any {
    if (!data || !data.files) {
      return {
        path: currentPath,
        files: [],
        breadcrumbs: this.generateBreadcrumbs(currentPath)
      }
    }

    const files = data.files.map((file: any) => ({
      name: file.name,
      type: file.type || (file.size === undefined ? 'directory' : 'file'),
      size: file.size || 0,
      sizeFormatted: this.formatBytes(file.size || 0),
      modified: file.mtime || file.modified,
      permissions: file.mode || file.permissions,
      isDirectory: file.type === 'directory' || file.size === undefined,
      path: `${currentPath}/${file.name}`.replace(/\/+/g, '/'),
      icon: this.getFileIcon(file.name, file.type)
    }))

    return {
      path: currentPath,
      files,
      breadcrumbs: this.generateBreadcrumbs(currentPath),
      totalFiles: files.filter(f => !f.isDirectory).length,
      totalDirectories: files.filter(f => f.isDirectory).length
    }
  }

  private generateBreadcrumbs(path: string): any[] {
    const parts = path.split('/').filter(part => part !== '')
    const breadcrumbs = [{ name: 'Root', path: '/' }]
    
    let currentPath = ''
    for (const part of parts) {
      currentPath += `/${part}`
      breadcrumbs.push({
        name: part,
        path: currentPath
      })
    }
    
    return breadcrumbs
  }

  private getFileIcon(fileName: string, fileType?: string): string {
    if (fileType === 'directory') return 'folder'
    
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const iconMap: Record<string, string> = {
      // Video files
      'mp4': 'videocam', 'avi': 'videocam', 'mkv': 'videocam', 'mov': 'videocam',
      // Audio files
      'mp3': 'musical_note', 'wav': 'musical_note', 'flac': 'musical_note',
      // Image files
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
      // Documents
      'pdf': 'description', 'doc': 'description', 'docx': 'description', 'txt': 'description',
      // Archives
      'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive'
    }
    
    return iconMap[extension || ''] || 'insert_drive_file'
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  private async logFileOperation(
    userId: string,
    operation: string,
    sourcePath: string,
    targetPath?: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed' = 'pending'
  ): Promise<any> {
    return this.dbService.create('file_operations', {
      userId,
      operation,
      sourcePath,
      targetPath,
      status,
      progress: 0,
      createdAt: new Date().toISOString()
    })
  }

  private isMediaFolder(path: string): boolean {
    const paths = getPathsConfig()
    return path.startsWith(paths.movies) || path.startsWith(paths.tvShows)
  }

  private async triggerJellyfinScan(path: string): Promise<void> {
    try {
      await JellyfinController.triggerAutoScan(path, this.apiProxy, this.dbService)
      logger.info(`Jellyfin auto-scan triggered for path: ${path}`)
    } catch (error) {
      logger.error('Error triggering Jellyfin scan:', error)
    }
  }
}

export default CloudCommanderController