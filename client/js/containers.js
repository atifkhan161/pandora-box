import { pb } from '../js/pocketbase';

class ContainersPage {
    constructor() {
        this.containerGrid = document.querySelector('.container-grid');
        this.searchInput = document.querySelector('.searchbar-input');
        this.searchInput.addEventListener('input', this.handleSearch.bind(this));
        this.loadContainers();
    }    // Placeholder for WebSocket integration for real-time logs and resource usage
        // const ws = new WebSocket('ws://localhost:8080/api/v1/containers/logs');
        // ws.onmessage = (event) => {
        //     console.log('Real-time log:', event.data);
        // };
    };

    async loadContainers() {
        try {
            // Placeholder for fetching container data
            const response = await fetch('/api/v1/containers');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.allContainers = await response.json();
            this.renderContainers(this.allContainers);

            this.renderContainers(containers);
        } catch (error) {
            console.error('Error loading containers:', error);
            // Display error message to user
        }
    };

    renderContainers(containersToRender) {
        this.containerGrid.innerHTML = '';
        containersToRender.forEach(container => {
            const card = document.createElement('div');
            card.classList.add('container-card');
            card.innerHTML = `
                <h3>${container.name}</h3>
                <div class="container-status">
                    <span class="status-indicator ${container.status === 'running' ? 'status-running' : 'status-stopped'}"></span>
                    <span>${container.status.charAt(0).toUpperCase() + container.status.slice(1)}</span>
                </div>
                <div class="container-info">
                    <p>Image: ${container.image}</p>
                    <p>Ports: ${container.ports}</p>
                </div>
                <div class="container-actions">
                    <button data-id="${container.id}" data-action="start">Start</button>
                    <button data-id="${container.id}" data-action="stop">Stop</button>
                    <button data-id="${container.id}" data-action="restart">Restart</button>
                    <button data-id="${container.id}" data-action="delete">Delete</button>
                </div>
            `;
            this.containerGrid.appendChild(card);
        });

        this.containerGrid.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', this.handleContainerAction.bind(this));
        });
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const filteredContainers = this.allContainers.filter(container =>
            container.name.toLowerCase().includes(searchTerm) ||
            container.image.toLowerCase().includes(searchTerm)
        );
        this.renderContainers(filteredContainers);
    }

    handleContainerAction(event) {
        const containerId = event.target.dataset.id;
        const action = event.target.dataset.action;
        try {
            const response = await fetch(`/api/v1/containers/${containerId}/${action}`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(`Container ${containerId} ${action}ed successfully.`);
            this.loadContainers(); // Reload containers to reflect changes
        } catch (error) {
            console.error(`Error performing ${action} on container ${containerId}:`, error);
            // Display error message to user
        }
    }
}

new ContainersPage();