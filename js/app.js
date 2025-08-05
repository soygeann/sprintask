// Registra el service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registrado!', reg))
            .catch(err => console.log('Error al registrar Service Worker:', err));
    });
}

// --- Modelo de Datos (Data) ---
let tasks = [
    {
        id: '1',
        title: 'Completar informe de ventas',
        description: 'Revisar datos de Q3 y generar reporte final para la reunión del lunes.',
        dueDate: '2025-08-07',
        status: 'urgent',
        subtasks: ['Revisar cifras', 'Analizar tendencias', 'Generar gráficos'],
        comments: ['El informe es crucial para la próxima presentación.'],
    },
    {
        id: '2',
        title: 'Llamar a cliente X',
        description: 'Coordinar la reunión para la firma del contrato.',
        dueDate: '2025-08-06',
        status: 'urgent',
        subtasks: [],
        comments: [],
    },
    {
        id: '3',
        title: 'Revisar emails',
        description: 'Responder a correos pendientes de la semana anterior.',
        dueDate: '2025-08-08',
        status: 'pending',
        subtasks: [],
        comments: [],
    },
    {
        id: '4',
        title: 'Preparar presentación',
        description: 'Preparar diapositivas para la reunión de equipo.',
        dueDate: '2025-08-10',
        status: 'meetings',
        subtasks: ['Recopilar datos', 'Diseñar diapositivas'],
        comments: [],
    },
    {
        id: '5',
        title: 'Proyecto finalizado',
        description: 'Documentación completa del proyecto Beta.',
        dueDate: '2025-07-25',
        status: 'finished',
        subtasks: [],
        comments: ['Proyecto entregado y aprobado.'],
    },
    {
        id: '6',
        title: 'Esperando respuesta',
        description: 'Contactar a proveedor para cotización. Quedo a la espera.',
        dueDate: '2025-08-09',
        status: 'paused',
        subtasks: [],
        comments: [],
    },
];

// Funciones para persistencia de datos
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

loadTasksFromLocalStorage();

// --- Selectores del DOM ---
const taskListTitle = document.getElementById('task-list-title');
const urgentHomeCount = document.querySelector('.menu-button:nth-of-type(1) .task-count');
const pendingHomeCount = document.querySelector('#normal-count');
const meetingsHomeCount = document.querySelector('#meeting-count');
const finishedHomeCount = document.querySelector('#finished-count');
const pausedHomeCount = document.querySelector('#paused-count');
const urgentTasksList = document.getElementById('urgent-tasks-list');
const urgentTaskCount = document.querySelector('.screen-header .task-count');
const addTaskHeaderButton = document.getElementById('add-task-header-button');
const addTaskFooterButton = document.getElementById('add-task-footer-button');
const taskModal = document.getElementById('add-task-modal');
const modalCloseButton = document.querySelector('#add-task-modal .modal-close-button');
const newTaskForm = document.getElementById('add-task-form');
const taskTitleInput = document.getElementById('add-task-title');
const taskDescriptionInput = document.getElementById('add-task-description');
const deleteModal = document.getElementById('delete-modal');
const deleteModalCloseButton = document.querySelector('#delete-modal .modal-close-button');
const confirmDeleteButton = document.getElementById('confirm-delete-button');
const cancelDeleteButton = document.getElementById('cancel-delete-button');
const editTaskModal = document.getElementById('edit-task-modal');
const editModalCloseButton = document.querySelector('#edit-task-modal .modal-close-button');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskTitleInput = document.getElementById('edit-task-title');
const editTaskDescriptionInput = document.getElementById('edit-task-description');
const editTaskStatusSelect = document.getElementById('edit-task-status');
const editSubtasksList = document.getElementById('edit-subtasks-list');
const newSubtaskInput = document.getElementById('new-subtask-input');
const addSubtaskButton = document.getElementById('add-subtask-button');
const editCommentsList = document.getElementById('edit-comments-list');
const newCommentInput = document.getElementById('new-comment-input');
const addCommentButton = document.getElementById('add-comment-button');

let taskIdToDelete = null;
let currentEditingTask = null;

// --- Funciones de Lógica de Tareas ---

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const statusToTitle = {
    'urgent': 'Urgentes',
    'pending': 'Pendientes',
    'meetings': 'Próxima reunión',
    'finished': 'Finalizadas',
    'paused': 'Sin poder culminar'
};

function renderTasks(status) {
    if (taskListTitle) {
        taskListTitle.textContent = statusToTitle[status] || 'Tareas';
    }
    
    if (!urgentTasksList || !urgentTaskCount) return;

    const filteredTasks = tasks.filter(task => task.status === status);
    urgentTaskCount.textContent = filteredTasks.length;

    urgentTasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'No hay tareas en esta sección.';
        urgentTasksList.appendChild(message);
        return;
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="task-info">
                <input type="checkbox" class="task-checkbox" data-id="${task.id}">
                <h3>${task.title}</h3>
            </div>
            <div class="task-actions">
                <button class="action-edit" data-id="${task.id}"><img src="img/icono-editar.png" alt="Editar"></button>
                <button class="action-delete" data-id="${task.id}"><img src="img/icono-borrar.png" alt="Borrar"></button>
            </div>
        `;
        urgentTasksList.appendChild(li);
    });

    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            finishTask(taskId);
        });
    });

    document.querySelectorAll('.action-edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            editTask(taskId);
        });
    });
    
    document.querySelectorAll('.action-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            showDeleteModal(taskId);
        });
    });
}

function createNewTask(e) {
    e.preventDefault();
    const title = taskTitleInput.value;
    const description = taskDescriptionInput.value;
    const currentStatus = getUrlParameter('status') || 'urgent';

    if (title.trim() === '') {
        alert('El título de la tarea es obligatorio.');
        return;
    }

    const newTask = {
        id: generateUniqueId(),
        title: title,
        description: description || 'Sin descripción.',
        dueDate: new Date().toISOString().slice(0, 10),
        status: currentStatus,
        subtasks: [],
        comments: [],
    };
    tasks.push(newTask);
    console.log('Nueva tarea creada:', newTask);
    
    saveTasksToLocalStorage();
    hideModal();
    renderTasks(currentStatus);
    newTaskForm.reset();
}

function editTask(taskId) {
    currentEditingTask = tasks.find(task => task.id === taskId);
    if (!currentEditingTask) return;

    editTaskTitleInput.value = currentEditingTask.title;
    editTaskDescriptionInput.value = currentEditingTask.description;
    editTaskStatusSelect.value = currentEditingTask.status;
    
    renderSubtasks(currentEditingTask.subtasks);
    renderComments(currentEditingTask.comments);

    showEditModal();
}

function saveEditedTask(e) {
    e.preventDefault();
    if (!currentEditingTask) return;

    const oldStatus = currentEditingTask.status;
    const newStatus = editTaskStatusSelect.value;

    currentEditingTask.title = editTaskTitleInput.value;
    currentEditingTask.description = editTaskDescriptionInput.value;
    currentEditingTask.status = newStatus;

    console.log('Tarea editada:', currentEditingTask);

    saveTasksToLocalStorage();
    hideEditModal();
    
    const currentStatus = getUrlParameter('status');
    renderTasks(currentStatus || 'urgent');
}

function finishTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const taskToFinish = tasks[taskIndex];
        const comment = prompt(`¿Deseas agregar un comentario final para la tarea "${taskToFinish.title}"?`);

        const currentStatus = getUrlParameter('status') || 'urgent';
        const originPanelTitle = statusToTitle[currentStatus];

        taskToFinish.comments.push(`Tarea finalizada desde el panel: [${originPanelTitle}]`);
        if (comment) {
            taskToFinish.comments.push(comment);
        }
        
        taskToFinish.status = 'finished';
        
        saveTasksToLocalStorage();
        renderTasks(currentStatus);
    }
}

function handleDeleteConfirm() {
    if (taskIdToDelete) {
        tasks = tasks.filter(task => task.id !== taskIdToDelete);
        console.log('Tarea borrada:', taskIdToDelete);
        taskIdToDelete = null;

        saveTasksToLocalStorage();
        hideDeleteModal();
        const currentStatus = getUrlParameter('status');
        renderTasks(currentStatus || 'urgent');
    }
}

function renderSubtasks(subtasks) {
    if (!editSubtasksList) return;
    editSubtasksList.innerHTML = '';
    subtasks.forEach((subtask, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="subtask-text">${subtask}</span>
            <button class="action-delete-subtask" data-index="${index}"><img src="img/icono-borrar.png" alt="Borrar Subtarea"></button>
        `;
        editSubtasksList.appendChild(li);
    });
}

function addSubtask() {
    if (!currentEditingTask) return;
    const subtaskText = newSubtaskInput.value.trim();
    if (subtaskText) {
        currentEditingTask.subtasks.push(subtaskText);
        renderSubtasks(currentEditingTask.subtasks);
        newSubtaskInput.value = '';
    }
}

function deleteSubtask(index) {
    if (!currentEditingTask) return;
    currentEditingTask.subtasks.splice(index, 1);
    renderSubtasks(currentEditingTask.subtasks);
}

function renderComments(comments) {
    if (!editCommentsList) return;
    editCommentsList.innerHTML = '';
    comments.forEach((comment, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="comment-text">${comment}</span>
            <button class="action-delete-comment" data-index="${index}"><img src="img/icono-borrar.png" alt="Borrar Comentario"></button>
        `;
        editCommentsList.appendChild(li);
    });
}

function addComment() {
    if (!currentEditingTask) return;
    const commentText = newCommentInput.value.trim();
    if (commentText) {
        currentEditingTask.comments.push(commentText);
        renderComments(currentEditingTask.comments);
        newCommentInput.value = '';
    }
}

function deleteComment(index) {
    if (!currentEditingTask) return;
    currentEditingTask.comments.splice(index, 1);
    renderComments(currentEditingTask.comments);
}

// --- Lógica de Modals ---
function showModal() {
    if (taskModal) {
        taskModal.classList.add('active');
    }
}

function hideModal() {
    if (taskModal) {
        taskModal.classList.remove('active');
    }
}

function showDeleteModal(taskId) {
    if (deleteModal) {
        taskIdToDelete = taskId;
        deleteModal.classList.add('active');
    }
}

function hideDeleteModal() {
    if (deleteModal) {
        deleteModal.classList.remove('active');
    }
}

function showEditModal() {
    if (editTaskModal) {
        editTaskModal.classList.add('active');
    }
}

function hideEditModal() {
    if (editTaskModal) {
        editTaskModal.classList.remove('active');
        currentEditingTask = null;
    }
}

// --- Lógica de renderizado en HOME ---
function updateAllCountsHome() {
    if (urgentHomeCount) {
        urgentHomeCount.textContent = tasks.filter(task => task.status === 'urgent').length;
    }
    if (pendingHomeCount) {
        pendingHomeCount.textContent = tasks.filter(task => task.status === 'pending').length;
    }
    if (meetingsHomeCount) {
        meetingsHomeCount.textContent = tasks.filter(task => task.status === 'meetings').length;
    }
    if (finishedHomeCount) {
        finishedHomeCount.textContent = tasks.filter(task => task.status === 'finished').length;
    }
    if (pausedHomeCount) {
        pausedHomeCount.textContent = tasks.filter(task => task.status === 'paused').length;
    }
}

// --- Lógica para activar el enlace del NAV según el panel ---
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        const homeLink = document.querySelector('.bottom-nav a[href="index.html"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    } else if (path.includes('tasks.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentStatus = urlParams.get('status');
        if (currentStatus) {
            const activeLink = document.querySelector(`.bottom-nav a[href*="status=${currentStatus}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }
}

// --- FUNCIÓN DE INICIALIZACIÓN PRINCIPAL ---
// Esta función se encarga de iniciar la lógica de la aplicación
// una vez que la pantalla de inicio ha terminado.
function initializeApp() {
    const path = window.location.pathname;
    
    if (path.includes('tasks.html')) {
        const status = getUrlParameter('status');
        renderTasks(status || 'urgent');
    } else if (path.includes('index.html') || path === '/') {
        updateAllCountsHome();
    }
    
    setActiveNavLink();
}

// --- Listeners de eventos de la aplicación ---
// Estos listeners no se ejecutan dentro de initializeApp,
// solo se registran una vez.
if (addTaskHeaderButton) {
    addTaskHeaderButton.addEventListener('click', showModal);
}
if (addTaskFooterButton) {
    addTaskFooterButton.addEventListener('click', showModal);
}
if (modalCloseButton) {
    modalCloseButton.addEventListener('click', hideModal);
}
if (newTaskForm) {
    newTaskForm.addEventListener('submit', createNewTask);
}
if (deleteModalCloseButton) {
    deleteModalCloseButton.addEventListener('click', hideDeleteModal);
}
if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener('click', handleDeleteConfirm);
}
if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener('click', hideDeleteModal);
}
if (editModalCloseButton) {
    editModalCloseButton.addEventListener('click', hideEditModal);
}
if (editTaskForm) {
    editTaskForm.addEventListener('submit', saveEditedTask);
}
if (addSubtaskButton) {
    addSubtaskButton.addEventListener('click', addSubtask);
}
if (addCommentButton) {
    addCommentButton.addEventListener('click', addComment);
}
if (editSubtasksList) {
    editSubtasksList.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-delete-subtask')) {
            const index = e.target.getAttribute('data-index');
            deleteSubtask(index);
        }
    });
}
if (editCommentsList) {
    editCommentsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('action-delete-comment')) {
            const index = e.target.getAttribute('data-index');
            deleteComment(index);
        }
    });
}

// --- Lógica de la pantalla de inicio (SPLASH SCREEN) ---
// Este es el único lugar donde se usa el listener de DOMContentLoaded.
document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const splashVideo = document.getElementById('splash-video');
    const appContainer = document.querySelector('.app-container');

    const splashScreenShown = sessionStorage.getItem('splashScreenShown');

    if (splashScreenShown) {
        if (splashScreen) splashScreen.style.display = 'none';
        if (appContainer) {
            appContainer.style.display = 'block';
            initializeApp();
        }
    } else {
        if (splashVideo && splashScreen && appContainer) {
            splashVideo.onended = () => {
                splashScreen.classList.add('hidden');
                appContainer.style.display = 'block';
                initializeApp();
                sessionStorage.setItem('splashScreenShown', 'true');
            };
            splashVideo.play();
        } else {
            if (appContainer) {
                appContainer.style.display = 'block';
                initializeApp();
            }
        }
    }
});