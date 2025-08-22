import { apiService } from '../services/api.js'
import websocketService from '../services/websocket.js'

export default {
  path: '/files/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="files">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">File Manager</div>
            <div class="right">
              <a href="#" class="link" id="refresh-files">
                <i class="f7-icons">arrow_clockwise</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Breadcrumb Navigation -->
          <div class="block">
            <div class="chip-outline" id="breadcrumb-nav">
              <!-- Breadcrumbs will be populated here -->
            </div>
          </div>

          <!-- File Operations Panel -->
          <div class="block" id="file-operations" style="display: none;">
            <div class="card">
              <div class="card-content card-content-padding">
                <div class="block-title">File Operations</div>
                <div class="button-group">
                  <button class="button button-small button-fill color-blue" id="move-btn">Move</button>
                  <button class="button button-small button-fill color-green" id="copy-btn">Copy</button>
                  <button class="button button-small button-fill color-orange" id="rename-btn">Rename</button>
                  <button class="button button-small button-fill color-red" id="delete-btn">Delete</button>
                </div>
                <div class="margin-top">
                  <span id="selected-count">0</span> items selected
                  <a href="#" class="float-right" id="clear-selection">Clear Selection</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Directory Stats -->
          <div class="block">
            <div class="row">
              <div class="col-33">
                <div class="stats-item">
                  <div class="stats-number" id="total-files">-</div>
                  <div class="stats-label">Files</div>
                </div>
              </div>
              <div class="col-33">
                <div class="stats-item">
                  <div class="stats-number" id="total-folders">-</div>
                  <div class="stats-label">Folders</div>
                </div>
              </div>
              <div class="col-33">
                <div class="stats-item">
                  <div class="stats-number" id="total-size">-</div>
                  <div class="stats-label">Size</div>
                </div>
              </div>
            </div>
          </div>

          <!-- View Controls -->
          <div class="block">
            <div class="segmented segmented-strong">
              <a href="#" class="button button-active" data-view="list">
                <i class="f7-icons">list_bullet</i>
              </a>
              <a href="#" class="button" data-view="grid">
                <i class="f7-icons">grid</i>
              </a>
            </div>
            <div class="float-right">
              <a href="#" class="link" id="select-all">Select All</a>
            </div>
          </div>

          <!-- Files List -->
          <div class="list files-list" id="files-list">
            <ul>
              <!-- Loading -->
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">
                    <div class="preloader"></div>
                    <span>Loading files...</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Quick Move Options -->
          <div class="block">
            <div class="block-title">Quick Move to Media Folders</div>
            <div class="row">
              <div class="col-50">
                <button class="button button-fill color-red" id="move-to-movies">
                  <i class="f7-icons">film</i> Movies Folder
                </button>
              </div>
              <div class="col-50">
                <button class="button button-fill color-blue" id="move-to-tv">
                  <i class="f7-icons">tv</i> TV Shows Folder
                </button>
              </div>
            </div>
          </div>

          <!-- Floating Action Button -->
          <div class="fab fab-right-bottom fab-extended" id="create-fab">
            <a href="#">
              <i class="f7-icons">plus</i>
              <div class="fab-text">Create</div>
            </a>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        currentPath: '/',
        files: [],
        selectedFiles: new Set(),
        viewMode: 'list',
        breadcrumbs: []
      },
      on: {
        pageInit: function () {
          console.log('Files page initialized')
          this.loadDirectory('/')
          this.setupEventListeners()
          this.setupWebSocketListeners()
        },
        pageBeforeRemove: function () {
          this.cleanupWebSocketListeners()
        }
      },
      methods: {
        async loadDirectory(path = '/') {
          try {
            const response = await apiService.get('/files/browse', {
              path: path,
              sort: 'name',
              order: 'asc',
              showHidden: false
            })

            if (response.success) {
              this.data.currentPath = path
              this.data.files = response.data.files || []
              this.data.breadcrumbs = response.data.breadcrumbs || []
              
              this.renderBreadcrumbs()
              this.renderFilesList()
              this.updateStats(response.data)
              this.clearSelection()
            } else {
              throw new Error(response.message || 'Failed to load directory')
            }
          } catch (error) {
            console.error('Error loading directory:', error)
            this.$app.showError('Failed to load directory')
            this.$el.find('#files-list ul').html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">Failed to load directory</div>
                </div>
              </li>
            `)
          }
        },

        renderBreadcrumbs() {
          const container = this.$el.find('#breadcrumb-nav')
          
          if (!this.data.breadcrumbs || this.data.breadcrumbs.length === 0) {
            container.html('<div class="chip"><div class="chip-label">Root</div></div>')
            return
          }

          const html = this.data.breadcrumbs.map((crumb, index) => `
            <div class="chip${index === this.data.breadcrumbs.length - 1 ? ' chip-active' : ''}" 
                 data-path="${crumb.path}">
              <div class="chip-label">${crumb.name}</div>
            </div>
          `).join('')

          container.html(html)
        },

        renderFilesList() {
          const container = this.$el.find('#files-list ul')
          
          if (!this.data.files || this.data.files.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No files found</div>
                  <div class="item-subtitle">This directory is empty</div>
                </div>
              </li>
            `)
            return
          }

          // Sort files - directories first, then files
          const sortedFiles = [...this.data.files].sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1
            if (!a.isDirectory && b.isDirectory) return 1
            return a.name.localeCompare(b.name)
          })

          const html = sortedFiles.map(file => `
            <li class="item-content item-checkbox" data-path="${file.path}">
              <div class="item-media">
                <label class="checkbox">
                  <input type="checkbox" name="file-checkbox" value="${file.path}"/>
                  <i class="icon-checkbox"></i>
                </label>
              </div>
              <div class="item-media">
                <i class="f7-icons">${file.icon}</i>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${file.name}</div>
                  <div class="item-subtitle">
                    ${file.isDirectory ? 'Directory' : file.sizeFormatted}
                    ${file.modified ? ' • ' + new Date(file.modified).toLocaleDateString() : ''}
                  </div>
                </div>
                <div class="item-after">
                  ${file.isDirectory ? '<i class="f7-icons">chevron_right</i>' : ''}
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        updateStats(data) {
          this.$el.find('#total-files').text(data.totalFiles || 0)
          this.$el.find('#total-folders').text(data.totalDirectories || 0)
          
          // Calculate total size
          const totalSize = this.data.files.reduce((sum, file) => 
            sum + (file.size || 0), 0)
          this.$el.find('#total-size').text(this.formatBytes(totalSize))
        },

        async performFileOperation(operation, files, targetPath = null) {
          try {
            const operations = files.map(async (filePath) => {
              const response = await apiService.post('/files/operation', {
                operation: operation,
                sourcePath: filePath,
                targetPath: targetPath
              })
              return response
            })

            const results = await Promise.all(operations)
            const successCount = results.filter(r => r.success).length
            
            if (successCount === files.length) {
              this.$app.showSuccess(`${operation} completed successfully`)
              this.loadDirectory(this.data.currentPath)
              this.clearSelection()
            } else {
              this.$app.showError(`${operation} partially failed`)
            }
          } catch (error) {
            console.error(`Error performing ${operation}:`, error)
            this.$app.showError(`Failed to ${operation} files`)
          }
        },

        async moveToMediaFolder(mediaType) {
          const selectedFiles = Array.from(this.data.selectedFiles)
          
          if (selectedFiles.length === 0) {
            this.$app.showError('Please select files to move')
            return
          }

          try {
            const operations = selectedFiles.map(async (filePath) => {
              const response = await apiService.post('/files/move-to-media', {
                sourcePath: filePath,
                mediaType: mediaType
              })
              return response
            })

            const results = await Promise.all(operations)
            const successCount = results.filter(r => r.success).length
            
            if (successCount === selectedFiles.length) {
              this.$app.showSuccess(`Moved ${successCount} files to ${mediaType} folder`)
              this.loadDirectory(this.data.currentPath)
              this.clearSelection()
            } else {
              this.$app.showError('Some files failed to move')
            }
          } catch (error) {
            console.error('Error moving to media folder:', error)
            this.$app.showError('Failed to move files')
          }
        },

        setupEventListeners() {
          // Breadcrumb navigation
          this.$el.find('#breadcrumb-nav').on('click', '.chip', (e) => {
            const path = this.$app.$(e.currentTarget).data('path')
            if (path) {
              this.loadDirectory(path)
            }
          })

          // File/Directory clicks
          this.$el.find('#files-list').on('click', '.item-content', (e) => {
            if (this.$app.$(e.target).hasClass('checkbox') || this.$app.$(e.target).closest('.checkbox').length) {
              return // Handle checkbox separately
            }
            
            const listItem = this.$app.$(e.currentTarget)
            const path = listItem.data('path')
            const file = this.data.files.find(f => f.path === path)
            
            if (file && file.isDirectory) {
              this.loadDirectory(path)
            }
          })

          // File selection
          this.$el.find('#files-list').on('change', 'input[type="checkbox"]', (e) => {
            const checkbox = this.$app.$(e.currentTarget)
            const filePath = checkbox.val()
            
            if (checkbox.is(':checked')) {
              this.data.selectedFiles.add(filePath)
            } else {
              this.data.selectedFiles.delete(filePath)
            }
            
            this.updateSelectionUI()
          })

          // Select all
          this.$el.find('#select-all').on('click', (e) => {
            e.preventDefault()
            const checkboxes = this.$el.find('input[name="file-checkbox"]')
            checkboxes.prop('checked', true).trigger('change')
          })

          // Clear selection
          this.$el.find('#clear-selection').on('click', (e) => {
            e.preventDefault()
            this.clearSelection()
          })

          // File operations
          this.$el.find('#move-btn').on('click', () => this.showMoveDialog())
          this.$el.find('#copy-btn').on('click', () => this.showCopyDialog())
          this.$el.find('#rename-btn').on('click', () => this.showRenameDialog())
          this.$el.find('#delete-btn').on('click', () => this.showDeleteDialog())

          // Quick media moves
          this.$el.find('#move-to-movies').on('click', () => this.moveToMediaFolder('movies'))
          this.$el.find('#move-to-tv').on('click', () => this.moveToMediaFolder('tv'))

          // Refresh
          this.$el.find('#refresh-files').on('click', (e) => {
            e.preventDefault()
            this.loadDirectory(this.data.currentPath)
          })

          // Create FAB
          this.$el.find('#create-fab').on('click', () => this.showCreateDialog())

          // View mode toggle
          this.$el.find('[data-view]').on('click', (e) => {
            e.preventDefault()
            const button = this.$app.$(e.currentTarget)
            const viewMode = button.data('view')
            
            this.$el.find('[data-view]').removeClass('button-active')
            button.addClass('button-active')
            
            this.data.viewMode = viewMode
            // TODO: Implement grid view
          })

          // Pull to refresh
          const ptr = this.$app.ptr.create('.page-content')
          this.$el.find('.page-content').on('ptr:refresh', () => {
            this.loadDirectory(this.data.currentPath)
            this.$app.ptr.done()
          })
        },

        updateSelectionUI() {
          const count = this.data.selectedFiles.size
          this.$el.find('#selected-count').text(count)
          
          if (count > 0) {
            this.$el.find('#file-operations').show()
          } else {
            this.$el.find('#file-operations').hide()
          }
        },

        clearSelection() {
          this.data.selectedFiles.clear()
          this.$el.find('input[name="file-checkbox"]').prop('checked', false)
          this.updateSelectionUI()
        },

        showMoveDialog() {
          // TODO: Implement move dialog with directory picker
          this.$app.dialog.prompt('Enter target path:', 'Move Files', (targetPath) => {
            if (targetPath) {
              this.performFileOperation('move', Array.from(this.data.selectedFiles), targetPath)
            }
          })
        },

        showCopyDialog() {
          // TODO: Implement copy dialog with directory picker
          this.$app.dialog.prompt('Enter target path:', 'Copy Files', (targetPath) => {
            if (targetPath) {
              this.performFileOperation('copy', Array.from(this.data.selectedFiles), targetPath)
            }
          })
        },

        showRenameDialog() {
          if (this.data.selectedFiles.size !== 1) {
            this.$app.showError('Please select exactly one file to rename')
            return
          }

          const filePath = Array.from(this.data.selectedFiles)[0]
          const fileName = filePath.split('/').pop()
          
          this.$app.dialog.prompt('Enter new name:', 'Rename File', (newName) => {
            if (newName && newName !== fileName) {
              const newPath = filePath.replace(fileName, newName)
              this.performFileOperation('rename', [filePath], newPath)
            }
          }, fileName)
        },

        showDeleteDialog() {
          const count = this.data.selectedFiles.size
          if (count === 0) return

          this.$app.dialog.confirm(
            `Are you sure you want to delete ${count} item(s)?`,
            'Delete Files',
            () => {
              this.performFileOperation('delete', Array.from(this.data.selectedFiles))
            }
          )
        },

        showCreateDialog() {
          const actions = [
            {
              text: 'Create Folder',
              onClick: () => {
                this.$app.dialog.prompt('Enter folder name:', 'Create Folder', (name) => {
                  if (name) {
                    this.createItem(name, true)
                  }
                })
              }
            },
            {
              text: 'Create File',
              onClick: () => {
                this.$app.dialog.prompt('Enter file name:', 'Create File', (name) => {
                  if (name) {
                    this.createItem(name, false)
                  }
                })
              }
            }
          ]

          this.$app.actions.create({
            buttons: actions
          }).open()
        },

        async createItem(name, isDirectory) {
          try {
            const response = await apiService.post('/files/operation', {
              operation: 'create',
              sourcePath: this.data.currentPath,
              fileName: name,
              isDirectory: isDirectory
            })

            if (response.success) {
              this.$app.showSuccess(`${isDirectory ? 'Folder' : 'File'} created successfully`)
              this.loadDirectory(this.data.currentPath)
            } else {
              throw new Error(response.message)
            }
          } catch (error) {
            console.error('Error creating item:', error)
            this.$app.showError(`Failed to create ${isDirectory ? 'folder' : 'file'}`)
          }
        },

        formatBytes(bytes) {
          if (bytes === 0) return '0 B'
          const k = 1024
          const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
          const i = Math.floor(Math.log(bytes) / Math.log(k))
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
        },

        setupWebSocketListeners() {
          websocketService.onMessage('file', (message) => {
            switch (message.event) {
              case 'file_operation_completed':
                this.loadDirectory(this.data.currentPath)
                break
            }
          })
        },

        cleanupWebSocketListeners() {
          websocketService.offMessage('file')
        }
      }
    })
  }
}