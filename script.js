        const cardBgColors = ['#1e293b', '#064e3b', '#4c1d95', '#451a03', '#27272a'];
        let tasks = JSON.parse(localStorage.getItem('myDailyTasks')) || [];
        
        let currentEditingId = null;
        let currentDetailId = null;
        let lastAddedId = null; 
        let lastClickedCard = null;
        let currentFilter = "all";

        function saveToLocalStorage() { localStorage.setItem('myDailyTasks', JSON.stringify(tasks)); }

        function calculatePriority(deadlineIso) {
            const now = new Date();
            const deadlineDate = new Date(deadlineIso);
            const diffTime = deadlineDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffTime < 0) return { level: "overdue", text: "Terlewat!" };
            if (diffDays <= 1) return { level: "high", text: "H-1 (Mendesak)" };
            if (diffDays <= 3) return { level: "medium", text: `H-${diffDays} (Segera)` };
            return { level: "low", text: "Santai" };
        }

        function formatTimeOnly(isoString) {
            const d = new Date(isoString);
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }

        function formatDateOnly(isoString) {
            const d = new Date(isoString);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        function setFilter(filter, btn) {
            currentFilter = filter;

            document.querySelectorAll(".filter-btn").forEach(b => {
                b.classList.remove("active");
            });

            btn.classList.add("active");

            renderTasks();
}

        function renderTasks() {
            const container = document.getElementById('taskContainer');
            container.innerHTML = '';

            updateStatistics();

            if (tasks.length === 0) {
                container.innerHTML = `<div class="empty-state">Belum ada tugas saat ini.<br>Klik tombol <strong>+</strong> di bawah untuk mulai membuat rutinitasmu.</div>`;
                return;
            }

        const searchKeyword =
            document.getElementById("searchInput")?.value.toLowerCase() || "";

            const sortedTasks = tasks
            .map(task => {
                const priorityInfo = calculatePriority(task.deadline);

                return {
                    ...task,
                    priorityLevel: priorityInfo.level,
                    priorityText: priorityInfo.text
                };
            })
            .filter(task => {

                // FILTER PENCARIAN
                const keyword = searchKeyword.trim().toLowerCase();

                const title = (task.title || "").toLowerCase();
                const desc = (task.description || "").toLowerCase();

                const matchSearch =
                    title.includes(keyword) ||
                    desc.includes(keyword);

                // FILTER PRIORITAS
                const matchFilter =
                    currentFilter === "all"
                        ? true
                        : task.priorityLevel === currentFilter;

                return matchSearch && matchFilter;

            })
            .sort((a, b) => {

                const order = {
                    overdue:1,
                    high:2,
                    medium:3,
                    low:4
                };

                return order[a.priorityLevel] - order[b.priorityLevel];

            });

            sortedTasks.forEach(task => {
                const card = document.createElement('div');
                card.className = `task-card ${task.priorityLevel}`;
                 if (task.completed) {
                    card.classList.add('completed');
                }
                card.style.backgroundColor = task.bgColor;
                
                card.onclick = function() { showDetail(task.id, this); };
                
                if (task.id === lastAddedId) card.classList.add('animate-new-task');
                
                /* --- PERUBAHAN URUTAN HTML DI SINI --- */
                card.innerHTML = `
                    <div class="task-title">${task.title}</div>
                    <div class="time-display">${formatTimeOnly(task.deadline)}</div>
                    <div class="priority-label ${task.priorityLevel}-label">${task.priorityText}</div>
                `;
                container.appendChild(card);
            });

            if (lastAddedId) setTimeout(() => { lastAddedId = null; }, 600); 
        }

        function openAddModal() {
            currentEditingId = null;
            document.getElementById('formTitle').innerText = "Tambah Tugas Baru";
            document.getElementById('taskName').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskDeadline').value = '';
            
            const modal = document.getElementById('taskModal');
            const modalContent = modal.querySelector('.modal-content');
            
            modal.style.display = 'block';
            void modal.offsetWidth; 
            
            modalContent.style.transition = 'transform 0.4s var(--ease-out-cubic), opacity 0.3s ease';
            modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
            modalContent.style.opacity = '1';
            modal.classList.add('is-active');
        }

        function showDetail(id, cardElement) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            
            currentDetailId = id;
            const statusBtn =
                document.querySelector('[onclick="toggleTaskStatus()"]');

            statusBtn.textContent =
                task.completed
                    ? 'Batalkan Selesai'
                    : 'Tandai Selesai';
            lastClickedCard = cardElement;
            
            document.getElementById('detailTitle').innerText = task.title;
            document.getElementById('detailDesc').innerText = task.description || "Tidak ada deskripsi.";
            document.getElementById('detailCreated').innerText = formatDateOnly(task.createdAt) + " " + formatTimeOnly(task.createdAt);
            document.getElementById('detailDate').innerText = formatDateOnly(task.deadline);
            document.getElementById('detailTime').innerText = formatTimeOnly(task.deadline);

            const modal = document.getElementById('detailModal');
            const modalContent = modal.querySelector('.modal-content');
            
            const rect = cardElement.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            
            const deltaX = cardCenterX - screenCenterX;
            const deltaY = cardCenterY - screenCenterY;
            
            modalContent.style.transition = 'none';
            modalContent.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.4)`;
            modalContent.style.opacity = '0';
            
            modal.style.display = 'block';
            void modal.offsetWidth;
            
            modalContent.style.transition = 'transform 0.4s var(--ease-out-cubic), opacity 0.3s ease';
            modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
            modalContent.style.opacity = '1';
            modal.classList.add('is-active');
        }

        function closeActiveModal(modalId) {
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            const modalContent = modal.querySelector('.modal-content');
            modal.classList.remove('is-active');
            
            if (modalId === 'detailModal' && lastClickedCard) {
                const rect = lastClickedCard.getBoundingClientRect();
                const deltaX = (rect.left + rect.width / 2) - (window.innerWidth / 2);
                const deltaY = (rect.top + rect.height / 2) - (window.innerHeight / 2);
                
                modalContent.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.4)`;
                modalContent.style.opacity = '0';
            } else {
                modalContent.style.transform = 'translate(-50%, -40%) scale(0.8)';
                modalContent.style.opacity = '0';
            }
            
            setTimeout(() => {
                modal.style.display = 'none';
                modalContent.style.transform = '';
                modalContent.style.opacity = '';
                modalContent.style.transition = '';
            }, 400); 
        }

        function openEditModal() {
            const task = tasks.find(t => t.id === currentDetailId);
            if (!task) return;
            
            closeActiveModal('detailModal'); 
            currentEditingId = task.id;
            
            document.getElementById('formTitle').innerText = "Edit Tugas";
            document.getElementById('taskName').value = task.title;
            document.getElementById('taskDesc').value = task.description;
            
            const d = new Date(task.deadline);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            document.getElementById('taskDeadline').value = d.toISOString().slice(0, 16);
            
            setTimeout(() => {
                const modal = document.getElementById('taskModal');
                const modalContent = modal.querySelector('.modal-content');
                
                modal.style.display = 'block';
                void modal.offsetWidth;
                
                modalContent.style.transition = 'transform 0.4s var(--ease-out-cubic), opacity 0.3s ease';
                modalContent.style.transform = 'translate(-50%, -50%) scale(1)';
                modalContent.style.opacity = '1';
                modal.classList.add('is-active');
            }, 300);
        }

        function saveTask() {
            const name = document.getElementById('taskName').value;
            const desc = document.getElementById('taskDesc').value;
            const deadlineInput = document.getElementById('taskDeadline').value;
            
            if(!name || !deadlineInput) {
                alert("Mohon isi nama dan deadline!");
                return;
            }

            if (currentEditingId !== null) {
                const taskIndex = tasks.findIndex(t => t.id === currentEditingId);
                tasks[taskIndex].title = name;
                tasks[taskIndex].description = desc;
                tasks[taskIndex].deadline = new Date(deadlineInput).toISOString();
                lastAddedId = null; 
            } else {
                const newTaskId = Date.now();
                const randomColor = cardBgColors[Math.floor(Math.random() * cardBgColors.length)];
                tasks.push({
                    id: newTaskId,
                    title: name,
                    description: desc,
                    createdAt: new Date().toISOString(),
                    deadline: new Date(deadlineInput).toISOString(),
                    bgColor: randomColor,
                    completed: false
                });
                lastAddedId = newTaskId; 
            }

            saveToLocalStorage();
            closeActiveModal('taskModal');
            renderTasks();
        }

        function deleteTask() {
            if(confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
                tasks = tasks.filter(t => t.id !== currentDetailId);
                saveToLocalStorage();
                closeActiveModal('detailModal');
                renderTasks();
            }
        }
        function toggleTaskStatus() {
            const task = tasks.find(t => t.id === currentDetailId);

            if (!task) return;

            task.completed = !task.completed;

            saveToLocalStorage();
            closeActiveModal('detailModal');
            renderTasks();
}

        function updateStatistics() {

            const total = tasks.length;

            const completed =
                tasks.filter(task => task.completed).length;

        const active = tasks.filter(task => {

            if (task.completed) return false;

            const priority = calculatePriority(task.deadline);

            return priority.level !== "overdue";

        }).length;

            const urgent =
                tasks.filter(task => {
                    const priority =
                        calculatePriority(task.deadline);

                    return (
                        priority.level === "high" &&
                        !task.completed
                    );
                }).length;
            const overdue =
                tasks.filter(task => {
                    const priority = calculatePriority(task.deadline);
                    return priority.level === "overdue";
                }).length;

            document.getElementById("totalTasks").textContent = total;
            document.getElementById("activeTasks").textContent = active;
            document.getElementById("completedTasks").textContent = completed;
            document.getElementById("urgentTasks").textContent = urgent;
            document.getElementById("overdueTasks").textContent = overdue;
        }
        renderTasks();