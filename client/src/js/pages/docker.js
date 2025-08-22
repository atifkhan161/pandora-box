import { apiService } from '../services/api.js'
import websocketService from '../services/websocket.js'

export default {
  path: '/docker/',
  async: function ({ router, to, resolve, reject }) {
    const template = `
      <div class="page" data-name="docker">
        <div class="navbar">
          <div class="navbar-bg"></div>
          <div class="navbar-inner sliding">
            <div class="left">
              <a href="#" class="link back">
                <i class="f7-icons">chevron_left</i>
                <span class="back-text">Back</span>
              </a>
            </div>
            <div class="title">Docker Control</div>
            <div class="right">
              <a href="#" class="link" id="refresh-docker">
                <i class="f7-icons">arrow_clockwise</i>
              </a>
            </div>
          </div>
        </div>

        <div class="page-content">
          <!-- Tab Bar -->
          <div class="toolbar tabbar tabbar-labels">
            <div class="toolbar-inner">
              <a href="#tab-containers" class="tab-link tab-link-active">
                <i class="f7-icons">cube_box</i>
                <span class="tabbar-label">Containers</span>
              </a>
              <a href="#tab-stacks" class="tab-link">
                <i class="f7-icons">layers</i>
                <span class="tabbar-label">Stacks</span>
              </a>
            </div>
          </div>

          <!-- Tabs Content -->
          <div class="tabs">
            <!-- Containers Tab -->
            <div id="tab-containers" class="page-content tab tab-active">
              <!-- Container Stats -->
              <div class="block-title">Container Status</div>
              <div class="block">
                <div class="row">
                  <div class="col-25">
                    <div class="card stats-card">
                      <div class="card-content card-content-padding">
                        <div class="stats-number" id="running-containers">-</div>
                        <div class="stats-label">Running</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-25">
                    <div class="card stats-card">
                      <div class="card-content card-content-padding">
                        <div class="stats-number" id="stopped-containers">-</div>
                        <div class="stats-label">Stopped</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-25">
                    <div class="card stats-card">
                      <div class="card-content card-content-padding">
                        <div class="stats-number" id="paused-containers">-</div>
                        <div class="stats-label">Paused</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-25">
                    <div class="card stats-card">
                      <div class="card-content card-content-padding">
                        <div class="stats-number" id="total-containers">-</div>
                        <div class="stats-label">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Filter Controls -->
              <div class="block">
                <div class="segmented segmented-strong">
                  <a href="#" class="button button-active" data-filter="all">All</a>
                  <a href="#" class="button" data-filter="running">Running</a>
                  <a href="#" class="button" data-filter="stopped">Stopped</a>
                  <a href="#" class="button" data-filter="paused">Paused</a>
                </div>
              </div>

              <!-- Containers List -->
              <div class="list containers-list" id="containers-list">
                <ul>
                  <!-- Loading -->
                  <li class="item-content">
                    <div class="item-inner">
                      <div class="item-title">
                        <div class="preloader"></div>
                        <span>Loading containers...</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Stacks Tab -->
            <div id="tab-stacks" class="page-content tab">
              <!-- Stack Controls -->
              <div class="block">
                <div class="row">
                  <div class="col-50">
                    <button class="button button-fill color-red" id="restart-arr-stack">
                      <i class="f7-icons">arrow_clockwise</i> Restart ARR Stack
                    </button>
                  </div>
                  <div class="col-50">
                    <button class="button button-fill color-blue" id="change-gluetun-country">
                      <i class="f7-icons">globe</i> Change VPN Country
                    </button>
                  </div>
                </div>
              </div>

              <!-- Stacks List -->
              <div class="list stacks-list" id="stacks-list">
                <ul>
                  <!-- Loading -->
                  <li class="item-content">
                    <div class="item-inner">
                      <div class="item-title">
                        <div class="preloader"></div>
                        <span>Loading stacks...</span>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    resolve({
      template,
      data: {
        containers: [],
        stacks: [],
        currentFilter: 'all',
        activeTab: 'containers'
      },
      on: {
        pageInit: function () {
          console.log('Docker page initialized')
          this.loadContainers()
          this.loadStacks()
          this.setupEventListeners()
          this.setupWebSocketListeners()
        },
        pageBeforeRemove: function () {
          this.cleanupWebSocketListeners()
        }
      },
      methods: {
        async loadContainers(filter = null) {
          try {
            const params = {}
            if (filter && filter !== 'all') {
              params.status = filter
            }

            const response = await apiService.get('/docker/containers', params)

            if (response.success) {
              this.data.containers = response.data.containers || []
              this.renderContainersList()
              this.updateContainerStats()
            } else {
              throw new Error(response.message || 'Failed to load containers')
            }
          } catch (error) {
            console.error('Error loading containers:', error)
            this.$app.showError('Failed to load containers')
            this.$el.find('#containers-list ul').html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">Failed to load containers</div>
                </div>
              </li>
            `)
          }
        },

        async loadStacks() {
          try {
            const response = await apiService.get('/docker/stacks')

            if (response.success) {
              this.data.stacks = response.data.stacks || []
              this.renderStacksList()
            } else {
              throw new Error(response.message || 'Failed to load stacks')
            }
          } catch (error) {
            console.error('Error loading stacks:', error)
            this.$el.find('#stacks-list ul').html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">Failed to load stacks</div>
                </div>
              </li>
            `)
          }
        },

        renderContainersList() {
          const container = this.$el.find('#containers-list ul')
          
          if (!this.data.containers || this.data.containers.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No containers found</div>
                  <div class="item-subtitle">No containers match the current filter</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.containers.map(container => `
            <li class="item-content">
              <div class="item-media">
                <div class="status-indicator status-${container.status}"></div>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${container.name}</div>
                  <div class="item-subtitle">
                    ${container.image} • ${container.status}
                    ${container.uptime ? ' • ' + container.uptime : ''}
                  </div>
                  <div class="item-text">
                    ${container.ports ? 'Ports: ' + container.ports.join(', ') : ''}
                    ${container.cpuUsage ? ' • CPU: ' + container.cpuUsage : ''}
                    ${container.memUsage ? ' • MEM: ' + container.memUsage : ''}
                  </div>
                </div>
                <div class="item-after">
                  <div class="container-actions">
                    <span class="badge color-${this.getStatusColor(container.status)}">${container.status}</span>
                    <div class="button-group">
                      ${this.getContainerActionButtons(container)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        renderStacksList() {
          const container = this.$el.find('#stacks-list ul')
          
          if (!this.data.stacks || this.data.stacks.length === 0) {
            container.html(`
              <li class="item-content">
                <div class="item-inner">
                  <div class="item-title">No stacks found</div>
                  <div class="item-subtitle">No Docker stacks are available</div>
                </div>
              </li>
            `)
            return
          }

          const html = this.data.stacks.map(stack => `
            <li class="item-content">
              <div class="item-media">
                <div class="status-indicator status-${stack.status}"></div>
              </div>
              <div class="item-inner">
                <div class="item-title">
                  <div class="item-header">${stack.name}</div>
                  <div class="item-subtitle">
                    ${stack.serviceCount} services • ${stack.status}
                  </div>
                  <div class="item-text">
                    Created: ${new Date(stack.creationDate).toLocaleDateString()}
                    ${stack.updateDate ? ' • Updated: ' + new Date(stack.updateDate).toLocaleDateString() : ''}
                  </div>
                </div>
                <div class="item-after">
                  <div class="stack-actions">
                    <span class="badge color-${this.getStatusColor(stack.status)}">${stack.status}</span>
                    <div class="button-group">
                      ${this.getStackActionButtons(stack)}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          `).join('')

          container.html(html)
        },

        getStatusColor(status) {
          const colors = {
            running: 'green',
            stopped: 'red',
            paused: 'orange',
            restarting: 'blue',
            created: 'gray',
            exited: 'red',
            dead: 'red',
            active: 'green',
            inactive: 'red'
          }
          return colors[status] || 'gray'
        },

        getContainerActionButtons(container) {
          const buttons = []
          
          if (container.status === 'running') {
            buttons.push(`<button class="button button-small button-fill color-orange action-btn" data-action="stop" data-id="${container.id}">Stop</button>`)
            buttons.push(`<button class="button button-small button-fill color-blue action-btn" data-action="restart" data-id="${container.id}">Restart</button>`)
          } else if (container.status === 'stopped' || container.status === 'exited') {
            buttons.push(`<button class="button button-small button-fill color-green action-btn" data-action="start" data-id="${container.id}">Start</button>`)
          } else if (container.status === 'paused') {
            buttons.push(`<button class="button button-small button-fill color-green action-btn" data-action="unpause" data-id="${container.id}">Unpause</button>`)
          }
          
          if (container.status === 'running') {
            buttons.push(`<button class="button button-small button-fill color-yellow action-btn" data-action="pause" data-id="${container.id}">Pause</button>`)
          }
          
          return buttons.join('')
        },

        getStackActionButtons(stack) {
          const buttons = []
          
          if (stack.status === 'active') {
            buttons.push(`<button class="button button-small button-fill color-orange stack-action-btn" data-action="stop" data-id="${stack.id}">Stop</button>`)
            buttons.push(`<button class="button button-small button-fill color-blue stack-action-btn" data-action="restart" data-id="${stack.id}">Restart</button>`)
          } else {
            buttons.push(`<button class="button button-small button-fill color-green stack-action-btn" data-action="start" data-id="${stack.id}">Start</button>`)
          }
          
          return buttons.join('')
        },

        updateContainerStats() {
          if (!this.data.containers) return

          const running = this.data.containers.filter(c => c.status === 'running').length
          const stopped = this.data.containers.filter(c => c.status === 'stopped' || c.status === 'exited').length
          const paused = this.data.containers.filter(c => c.status === 'paused').length
          const total = this.data.containers.length

          this.$el.find('#running-containers').text(running)
          this.$el.find('#stopped-containers').text(stopped)
          this.$el.find('#paused-containers').text(paused)
          this.$el.find('#total-containers').text(total)
        },

        async controlContainer(containerId, action) {
          try {
            const response = await apiService.post(`/docker/containers/${containerId}`, {
              action: action
            })

            if (response.success) {
              this.$app.showSuccess(`Container ${action} successful`)
              this.loadContainers(this.data.currentFilter)
            } else {
              throw new Error(response.message || `Failed to ${action} container`)
            }
          } catch (error) {
            console.error(`Error ${action} container:`, error)
            this.$app.showError(`Failed to ${action} container`)
          }
        },

        async controlStack(stackId, action) {
          try {
            const response = await apiService.post(`/docker/stacks/${stackId}`, {
              action: action
            })

            if (response.success) {
              this.$app.showSuccess(`Stack ${action} successful`)
              this.loadStacks()
            } else {
              throw new Error(response.message || `Failed to ${action} stack`)
            }
          } catch (error) {
            console.error(`Error ${action} stack:`, error)
            this.$app.showError(`Failed to ${action} stack`)
          }
        },

        async restartArrStack() {
          try {
            const response = await apiService.post('/docker/arr-stack/restart')

            if (response.success) {
              this.$app.showSuccess('ARR Stack restart initiated')
              this.loadStacks()
            } else {
              throw new Error(response.message || 'Failed to restart ARR stack')
            }
          } catch (error) {
            console.error('Error restarting ARR stack:', error)
            this.$app.showError('Failed to restart ARR stack')
          }
        },

        async changeGluetunCountry() {
          const countries = [
            'US', 'UK', 'DE', 'FR', 'NL', 'CA', 'AU', 'JP', 'SG', 'CH'
          ]

          const buttons = countries.map(country => ({
            text: country,
            onClick: async () => {
              try {
                const response = await apiService.post('/docker/gluetun/country', {
                  country: country
                })

                if (response.success) {
                  this.$app.showSuccess(`VPN country changed to ${country}`)
                } else {
                  throw new Error(response.message || 'Failed to change country')
                }
              } catch (error) {
                console.error('Error changing VPN country:', error)
                this.$app.showError('Failed to change VPN country')
              }
            }
          }))

          this.$app.actions.create({
            buttons: [
              ...buttons,
              { text: 'Cancel', color: 'red' }
            ]
          }).open()
        },

        setupEventListeners() {
          // Tab switching
          this.$el.find('.tab-link').on('click', (e) => {
            e.preventDefault()
            const target = this.$app.$(e.currentTarget).attr('href')
            this.data.activeTab = target.replace('#tab-', '')
          })

          // Container filter buttons
          this.$el.find('.segmented .button').on('click', (e) => {
            e.preventDefault()
            const button = this.$app.$(e.currentTarget)
            const filter = button.data('filter')
            
            // Update active state
            this.$el.find('.segmented .button').removeClass('button-active')
            button.addClass('button-active')
            
            // Load filtered containers
            this.data.currentFilter = filter
            this.loadContainers(filter)
          })

          // Container action buttons
          this.$el.find('#containers-list').on('click', '.action-btn', (e) => {
            e.stopPropagation()
            const button = this.$app.$(e.currentTarget)
            const action = button.data('action')
            const containerId = button.data('id')
            
            if (action === 'stop' || action === 'restart') {
              this.$app.dialog.confirm(
                `Are you sure you want to ${action} this container?`,
                `Confirm ${action}`,
                () => {
                  this.controlContainer(containerId, action)
                }
              )
            } else {
              this.controlContainer(containerId, action)
            }
          })

          // Stack action buttons
          this.$el.find('#stacks-list').on('click', '.stack-action-btn', (e) => {
            e.stopPropagation()
            const button = this.$app.$(e.currentTarget)
            const action = button.data('action')
            const stackId = button.data('id')
            
            if (action === 'stop' || action === 'restart') {
              this.$app.dialog.confirm(
                `Are you sure you want to ${action} this stack?`,
                `Confirm ${action}`,
                () => {
                  this.controlStack(stackId, action)
                }
              )
            } else {
              this.controlStack(stackId, action)
            }
          })

          // Special ARR stack controls
          this.$el.find('#restart-arr-stack').on('click', () => {
            this.$app.dialog.confirm(
              'This will restart all ARR services. Continue?',
              'Restart ARR Stack',
              () => {
                this.restartArrStack()
              }
            )
          })

          this.$el.find('#change-gluetun-country').on('click', () => {
            this.changeGluetunCountry()
          })

          // Refresh
          this.$el.find('#refresh-docker').on('click', (e) => {
            e.preventDefault()
            if (this.data.activeTab === 'containers') {
              this.loadContainers(this.data.currentFilter)
            } else {
              this.loadStacks()
            }
          })

          // Pull to refresh
          const ptr = this.$app.ptr.create('.page-content')
          this.$el.find('.page-content').on('ptr:refresh', () => {
            if (this.data.activeTab === 'containers') {
              this.loadContainers(this.data.currentFilter)
            } else {
              this.loadStacks()
            }
            this.$app.ptr.done()
          })
        },

        setupWebSocketListeners() {
          // Listen for container updates
          websocketService.onMessage('container', (message) => {
            switch (message.event) {
              case 'action_completed':
                this.loadContainers(this.data.currentFilter)
                break
            }
          })

          // Listen for stack updates
          websocketService.onMessage('stack', (message) => {
            switch (message.event) {
              case 'action_completed':
                this.loadStacks()
                break
            }
          })
        },

        cleanupWebSocketListeners() {
          websocketService.offMessage('container')
          websocketService.offMessage('stack')
        }
      }
    })
  }
}