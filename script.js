class UniversityTodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('universityTasks')) || [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.setMinDate();
    }

    bindEvents() {
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });
        
        // Event listener para el modo oscuro (podría implementarse en el futuro)
        this.detectSystemTheme();
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        });
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDate').min = today;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId);
        } else {
            this.addTask();
        }
    }

    addTask() {
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const date = document.getElementById('taskDate').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value;

        const task = {
            id: Date.now(),
            title,
            subject,
            date,
            priority,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        this.updateStats();
        
        document.getElementById('taskForm').reset();
        this.showNotification('Tarea agregada exitosamente! 🎉', 'success');
    }

    startEditTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskSubject').value = task.subject;
        document.getElementById('taskDate').value = task.date;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDescription').value = task.description;
        
        this.editingTaskId = id;
        
        document.querySelector('.add-btn').textContent = '💾 Guardar Cambios';
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }

    updateTask(id) {
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const date = document.getElementById('taskDate').value;
        const priority = document.getElementById('taskPriority').value;
        const description = document.getElementById('taskDescription').value;

        this.tasks = this.tasks.map(task => {
            if (task.id === id) {
                return {
                    ...task,
                    title,
                    subject,
                    date,
                    priority,
                    description
                };
            }
            return task;
        });

        this.saveTasks();
        this.render();
        this.updateStats();
        
        document.getElementById('taskForm').reset();
        this.editingTaskId = null;
        document.querySelector('.add-btn').textContent = '➕ Agregar Tarea';
        
        this.showNotification('Tarea actualizada correctamente! ✏️', 'success');
    }

    cancelEdit() {
        this.editingTaskId = null;
        document.getElementById('taskForm').reset();
        document.querySelector('.add-btn').textContent = '➕ Agregar Tarea';
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
            this.updateStats();
            
            const message = task.completed ? 
                '¡Tarea completada! 🎉' : 
                'Tarea marcada como pendiente';
            this.showNotification(message, 'success');
        }
    }

    deleteTask(id) {
        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.render();
            this.updateStats();
            this.showNotification('Tarea eliminada', 'success');
            
            // Si estábamos editando esta tarea, cancelamos la edición
            if (this.editingTaskId === id) {
                this.cancelEdit();
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.render();
    }

    getFilteredTasks() {
        const today = new Date().toISOString().split('T')[0];
        
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'overdue':
                return this.tasks.filter(t => !t.completed && t.date < today);
            case 'alta':
                return this.tasks.filter(t => t.priority === 'alta');
            default:
                return this.tasks;
        }
    }

    isOverdue(date, completed) {
        if (completed) return false;
        const today = new Date().toISOString().split('T')[0];
        return date < today;
    }

    getDaysUntilDue(date) {
        const today = new Date();
        const dueDate = new Date(date);
        dueDate.setHours(23, 59, 59, 999); // Set to end of day
        
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`;
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        return `En ${diffDays} días`;
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    render() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${this.getEmptyStateIcon()}</div>
                    <h3>${this.getEmptyStateTitle()}</h3>
                    <p>${this.getEmptyStateMessage()}</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => {
            const isOverdue = this.isOverdue(task.date, task.completed);
            const daysInfo = this.getDaysUntilDue(task.date);
            const formattedDate = this.formatDate(task.date);
            
            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                    <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <span class="task-priority priority-${task.priority}">${task.priority.toUpperCase()}</span>
                    </div>
                    
                    <div class="task-meta">
                        <span class="task-subject">${task.subject}</span>
                        <span class="task-due" title="${formattedDate}">${daysInfo}</span>
                    </div>
                    
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    
                    <div class="task-actions">
                        <button class="btn btn-complete" onclick="app.toggleTask(${task.id})">
                            ${task.completed ? '↺ Reabrir' : '✓ Completar'}
                        </button>
                        <button class="btn btn-edit" onclick="app.startEditTask(${task.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-delete" onclick="app.deleteTask(${task.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getEmptyStateIcon() {
        const icons = {
            'all': '📝',
            'pending': '⏳',
            'completed': '✅',
            'overdue': '⚠️',
            'alta': '🔥'
        };
        return icons[this.currentFilter] || '📝';
    }

    getEmptyStateTitle() {
        const titles = {
            'all': 'No hay tareas aún',
            'pending': 'No hay tareas pendientes',
            'completed': 'No hay tareas completadas',
            'overdue': 'No hay tareas atrasadas',
            'alta': 'No hay tareas de alta prioridad'
        };
        return titles[this.currentFilter] || 'No hay tareas';
    }

    getEmptyStateMessage() {
        const messages = {
            'all': 'Comienza agregando tu primera tarea universitaria',
            'pending': '¡Genial! Has completado todas tus tareas',
            'completed': 'Aún no has completado ninguna tarea',
            'overdue': '¡Excelente! No tienes tareas atrasadas',
            'alta': 'No tienes tareas con prioridad alta'
        };
        return messages[this.currentFilter] || 'Intenta con otro filtro';
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        
        const stats = {
            total: this.tasks.length,
            pending: this.tasks.filter(t => !t.completed).length,
            completed: this.tasks.filter(t => t.completed).length,
            overdue: this.tasks.filter(t => !t.completed && t.date < today).length
        };

        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('pendingTasks').textContent = stats.pending;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('overdueTasks').textContent = stats.overdue;

        // Animar los cambios en las estadísticas
        this.animateValue('totalTasks', 0, stats.total, 500);
        this.animateValue('pendingTasks', 0, stats.pending, 500);
        this.animateValue('completedTasks', 0, stats.completed, 500);
        this.animateValue('overdueTasks', 0, stats.overdue, 500);
    }

    animateValue(id, start, end, duration) {
        if (start === end) return;
        
        const range = end - start;
        const element = document.getElementById(id);
        let startTimestamp = null;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * range + start);
            element.textContent = value;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }

    saveTasks() {
        localStorage.setItem('universityTasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.remove('hidden');
        }, 10);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the app
const app = new UniversityTodoApp();
