/**
 * Files Service for Pandora PWA
 * Handles file operations and Cloud Commander integration
 */

import { apiClient } from './api.js'

export class FilesService {
  constructor(client = apiClient) {
    this.client = client
  }

  /**
   * List directory contents
   * @param {string} path - Directory path
   * @returns {Promise<Array>} Directory contents
   */
  async listDirectory(path = '/') {
    try {
      const response = await this.client.get('/files/list', { path })
      return response
    } catch (error) {
      console.error('Failed to list directory:', error)
      throw error
    }
  }

  /**
   * Get file or directory information
   * @param {string} path - File/directory path
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(path) {
    try {
      const response = await this.client.get('/files/info', { path })
      return response
    } catch (error) {
      console.error('Failed to get file info:', error)
      throw error
    }
  }

  /**
   * Create directory
   * @param {string} path - Directory path to create
   * @returns {Promise<Object>} Creation result
   */
  async createDirectory(path) {
    try {
      const response = await this.client.post('/files/mkdir', { path })
      return response
    } catch (error) {
      console.error('Failed to create directory:', error)
      throw error
    }
  }

  /**
   * Delete file or directory
   * @param {string} path - Path to delete
   * @param {boolean} recursive - Whether to delete recursively
   * @returns {Promise<Object>} Deletion result
   */
  async delete(path, recursive = false) {
    try {
      const response = await this.client.delete('/files/delete', {
        path,
        recursive
      })
      return response
    } catch (error) {
      console.error('Failed to delete:', error)
      throw error
    }
  }

  /**
   * Move file or directory
   * @param {string} sourcePath - Source path
   * @param {string} destinationPath - Destination path
   * @returns {Promise<Object>} Move result
   */
  async move(sourcePath, destinationPath) {
    try {
      const response = await this.client.post('/files/move', {
        source: sourcePath,
        destination: destinationPath
      })
      return response
    } catch (error) {
      console.error('Failed to move file:', error)
      throw error
    }
  }

  /**
   * Copy file or directory
   * @param {string} sourcePath - Source path
   * @param {string} destinationPath - Destination path
   * @returns {Promise<Object>} Copy result
   */
  async copy(sourcePath, destinationPath) {
    try {
      const response = await this.client.post('/files/copy', {
        source: sourcePath,
        destination: destinationPath
      })
      return response
    } catch (error) {
      console.error('Failed to copy file:', error)
      throw error
    }
  }

  /**
   * Rename file or directory
   * @param {string} path - Current path
   * @param {string} newName - New name
   * @returns {Promise<Object>} Rename result
   */
  async rename(path, newName) {
    try {
      const response = await this.client.post('/files/rename', {
        path,
        newName
      })
      return response
    } catch (error) {
      console.error('Failed to rename:', error)
      throw error
    }
  }

  /**
   * Upload file
   * @param {string} directoryPath - Target directory
   * @param {File} file - File to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(directoryPath, file, onProgress = null) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', directoryPath)
      
      const response = await this.client.upload('/files/upload', formData, onProgress)
      return response
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  /**
   * Upload multiple files
   * @param {string} directoryPath - Target directory
   * @param {FileList|Array} files - Files to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Upload results
   */
  async uploadFiles(directoryPath, files, onProgress = null) {
    const results = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const result = await this.uploadFile(directoryPath, file, (progress, loaded, total) => {
          if (onProgress) {
            onProgress(i, files.length, progress, loaded, total, file.name)
          }
        })
        
        results.push({ file: file.name, success: true, result })
      } catch (error) {
        results.push({ file: file.name, success: false, error: error.message })
      }
    }
    
    return results
  }

  /**
   * Download file
   * @param {string} path - File path
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Blob>} File blob
   */
  async downloadFile(path, onProgress = null) {
    try {
      const response = await this.client.download('/files/download', onProgress, {
        method: 'POST',
        body: JSON.stringify({ path })
      })
      return response
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }

  /**
   * Get file content as text
   * @param {string} path - File path
   * @returns {Promise<string>} File content
   */
  async getFileContent(path) {
    try {
      const response = await this.client.get('/files/content', { path })
      return response
    } catch (error) {
      console.error('Failed to get file content:', error)
      throw error
    }
  }

  /**
   * Save file content
   * @param {string} path - File path
   * @param {string} content - File content
   * @returns {Promise<Object>} Save result
   */
  async saveFileContent(path, content) {
    try {
      const response = await this.client.post('/files/content', {
        path,
        content
      })
      return response
    } catch (error) {
      console.error('Failed to save file content:', error)
      throw error
    }
  }

  /**
   * Search files
   * @param {string} query - Search query
   * @param {string} path - Search path (optional)
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchFiles(query, path = '/', options = {}) {
    try {
      const response = await this.client.get('/files/search', {
        query,
        path,
        ...options
      })
      return response
    } catch (error) {
      console.error('Failed to search files:', error)
      throw error
    }
  }

  /**
   * Get disk usage information
   * @param {string} path - Path to check
   * @returns {Promise<Object>} Disk usage info
   */
  async getDiskUsage(path = '/') {
    try {
      const response = await this.client.get('/files/disk-usage', { path })
      return response
    } catch (error) {
      console.error('Failed to get disk usage:', error)
      throw error
    }
  }

  /**
   * Create archive (zip)
   * @param {Array} paths - Paths to archive
   * @param {string} archiveName - Archive name
   * @returns {Promise<Object>} Archive result
   */
  async createArchive(paths, archiveName) {
    try {
      const response = await this.client.post('/files/archive', {
        paths,
        archiveName
      })
      return response
    } catch (error) {
      console.error('Failed to create archive:', error)
      throw error
    }
  }

  /**
   * Extract archive
   * @param {string} archivePath - Archive path
   * @param {string} extractPath - Extraction path
   * @returns {Promise<Object>} Extraction result
   */
  async extractArchive(archivePath, extractPath) {
    try {
      const response = await this.client.post('/files/extract', {
        archivePath,
        extractPath
      })
      return response
    } catch (error) {
      console.error('Failed to extract archive:', error)
      throw error
    }
  }

  /**
   * Move files to Movies folder
   * @param {Array} paths - File paths to move
   * @returns {Promise<Object>} Move result
   */
  async moveToMovies(paths) {
    try {
      const response = await this.client.post('/files/organize/movies', { paths })
      return response
    } catch (error) {
      console.error('Failed to move to movies:', error)
      throw error
    }
  }

  /**
   * Move files to TV Shows folder
   * @param {Array} paths - File paths to move
   * @returns {Promise<Object>} Move result
   */
  async moveToTVShows(paths) {
    try {
      const response = await this.client.post('/files/organize/tv-shows', { paths })
      return response
    } catch (error) {
      console.error('Failed to move to TV shows:', error)
      throw error
    }
  }

  /**
   * Get file type icon
   * @param {string} fileName - File name
   * @param {boolean} isDirectory - Whether it's a directory
   * @returns {string} Icon class or emoji
   */
  getFileIcon(fileName, isDirectory = false) {
    if (isDirectory) {
      return '📁'
    }
    
    const extension = this.getFileExtension(fileName).toLowerCase()
    
    const iconMap = {
      // Video files
      'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'mov': '🎬', 'wmv': '🎬',
      'flv': '🎬', 'webm': '🎬', 'm4v': '🎬', '3gp': '🎬',
      
      // Audio files
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'aac': '🎵', 'ogg': '🎵',
      'wma': '🎵', 'm4a': '🎵',
      
      // Image files
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
      'svg': '🖼️', 'webp': '🖼️', 'ico': '🖼️',
      
      // Document files
      'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄', 'rtf': '📄',
      'odt': '📄',
      
      // Spreadsheet files
      'xls': '📊', 'xlsx': '📊', 'csv': '📊', 'ods': '📊',
      
      // Presentation files
      'ppt': '📊', 'pptx': '📊', 'odp': '📊',
      
      // Archive files
      'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
      'bz2': '📦', 'xz': '📦',
      
      // Code files
      'js': '💻', 'html': '💻', 'css': '💻', 'php': '💻', 'py': '💻',
      'java': '💻', 'cpp': '💻', 'c': '💻', 'h': '💻', 'json': '💻',
      'xml': '💻', 'yml': '💻', 'yaml': '💻',
      
      // Torrent files
      'torrent': '🧲'
    }
    
    return iconMap[extension] || '📄'
  }

  /**
   * Get file extension
   * @param {string} fileName - File name
   * @returns {string} File extension
   */
  getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.')
    return lastDot > 0 ? fileName.substring(lastDot + 1) : ''
  }

  /**
   * Format file size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  /**
   * Format file date
   * @param {string|Date} date - Date string or Date object
   * @returns {string} Formatted date
   */
  formatFileDate(date) {
    if (!date) return 'Unknown'
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString()
    } catch (error) {
      return 'Unknown'
    }
  }

  /**
   * Check if file is media file
   * @param {string} fileName - File name
   * @returns {boolean} Whether file is media
   */
  isMediaFile(fileName) {
    const extension = this.getFileExtension(fileName).toLowerCase()
    const mediaExtensions = [
      'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp',
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'
    ]
    
    return mediaExtensions.includes(extension)
  }

  /**
   * Check if file is video file
   * @param {string} fileName - File name
   * @returns {boolean} Whether file is video
   */
  isVideoFile(fileName) {
    const extension = this.getFileExtension(fileName).toLowerCase()
    const videoExtensions = [
      'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'
    ]
    
    return videoExtensions.includes(extension)
  }

  /**
   * Check if file is audio file
   * @param {string} fileName - File name
   * @returns {boolean} Whether file is audio
   */
  isAudioFile(fileName) {
    const extension = this.getFileExtension(fileName).toLowerCase()
    const audioExtensions = [
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'
    ]
    
    return audioExtensions.includes(extension)
  }

  /**
   * Check if file is image file
   * @param {string} fileName - File name
   * @returns {boolean} Whether file is image
   */
  isImageFile(fileName) {
    const extension = this.getFileExtension(fileName).toLowerCase()
    const imageExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'
    ]
    
    return imageExtensions.includes(extension)
  }

  /**
   * Build breadcrumb path
   * @param {string} path - Current path
   * @returns {Array} Breadcrumb items
   */
  buildBreadcrumb(path) {
    if (!path || path === '/') {
      return [{ name: 'Home', path: '/' }]
    }
    
    const parts = path.split('/').filter(part => part.length > 0)
    const breadcrumb = [{ name: 'Home', path: '/' }]
    
    let currentPath = ''
    parts.forEach(part => {
      currentPath += '/' + part
      breadcrumb.push({
        name: part,
        path: currentPath
      })
    })
    
    return breadcrumb
  }

  /**
   * Get parent directory path
   * @param {string} path - Current path
   * @returns {string} Parent directory path
   */
  getParentPath(path) {
    if (!path || path === '/') {
      return '/'
    }
    
    const parts = path.split('/').filter(part => part.length > 0)
    if (parts.length <= 1) {
      return '/'
    }
    
    parts.pop()
    return '/' + parts.join('/')
  }
}

// Create default files service instance
export const filesService = new FilesService()

export default FilesService