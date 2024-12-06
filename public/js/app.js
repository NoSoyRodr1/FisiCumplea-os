document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    alert('Clic derecho deshabilitado.');
});
document.addEventListener('keydown', function(e) {
    if (e.key === "F12") {
        e.preventDefault();
    }
    if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) {
        e.preventDefault();
    }
    if (e.ctrlKey && e.key === "U") {
        e.preventDefault();
    }
});
class BirthdayManager {
    constructor() {
        this.calendar = null;
        this.setupCalendar();
    }

    setupEventListeners() {
        document.getElementById('birthdayForm').addEventListener('submit', (e) => this.handleAddBirthday(e));
    }

    setupCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'es',
                height: 650,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                }
            });
        }
    }

    async loadBirthdays() {
        if (!auth.currentUser) return;

        const tarjetasContainer = document.querySelector('.tarjetas-container');
        if (tarjetasContainer) {
            tarjetasContainer.innerHTML = '';
        }

        try {
            const snapshot = await db.collection('birthdays').get();

            const birthdays = [];
            snapshot.forEach(doc => {
                birthdays.push({ id: doc.id, ...doc.data() });
            });

            this.renderBirthdays(birthdays);
            this.updateCalendar(birthdays);
        } catch (error) {
            console.error('Error cargando cumpleaños:', error);
            alert('Error al cargar los cumpleaños');
        }
    }

    renderBirthdays(birthdays) {
        const tarjetasContainer = document.querySelector('.tarjetas-container');
        
        birthdays.forEach(({ id, name, birthDate }) => {
            const nextBirthdayDate = this.getNextBirthday(birthDate);
            const nextAge = this.calculateAge(birthDate, nextBirthdayDate.getFullYear());
            
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta';
            tarjeta.innerHTML = `
                <h3>${name}</h3>
                <p>Fecha de nacimiento: ${this.formatDate(birthDate)}</p>
                <p>Próximo cumpleaños: ${this.formatDate(nextBirthdayDate)}</p>
                <p>Cumplirá: ${nextAge} años</p>
                <button onclick="birthdayManager.deleteBirthday('${id}')" class="delete-btn">Eliminar</button>
            `;
            tarjetasContainer.appendChild(tarjeta);
        });
    }

    updateCalendar(birthdays) {
        const calendarEl = document.getElementById('calendar');
        
        if (!this.calendar) {
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                locale: 'es',
                height: 650,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                }
            });
        }

        this.calendar.removeAllEvents();

        const events = birthdays.map(({ name, birthDate }) => {
            const nextBirthday = this.getNextBirthday(birthDate);
            const nextAge = this.calculateAge(birthDate, nextBirthday.getFullYear());
            return {
                title: `🎂 ${name} (${nextAge} años)`,
                start: nextBirthday,
                allDay: true,
                className: 'birthday-event'
            };
        });

        this.calendar.addEventSource(events);
        this.calendar.render();
    }

    async handleAddBirthday(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const birthDate = document.getElementById('birthDate').value;

        try {
            await db.collection('birthdays').add({
                userId: auth.currentUser.uid,
                name,
                birthDate,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            e.target.reset();
            this.loadBirthdays();
        } catch (error) {
            console.error('Error agregando cumpleaños:', error);
            alert('Error al agregar el cumpleaños');
        }
    }

    async deleteBirthday(id) {
        if (confirm('¿Estás seguro de querer eliminar este cumpleaños?')) {
            try {
                await db.collection('birthdays').doc(id).delete();
                this.loadBirthdays();
            } catch (error) {
                console.error('Error eliminando cumpleaños:', error);
                alert('Error al eliminar el cumpleaños');
            }
        }
    }

    calculateAge(birthDate, currentYear = new Date().getFullYear()) {
        const birth = new Date(birthDate);
        return currentYear - birth.getFullYear();
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getNextBirthday(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return nextBirthday;
    }
    async addBirthday(birthdayData) {
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        if (!this.validateBirthdayData(birthdayData)) {
            throw new Error('Datos de cumpleaños inválidos');
        }

        const birthday = {
            userId: auth.currentUser.uid,
            name: birthdayData.name.trim(),
            birthDate: birthdayData.birthDate,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            const docRef = await db.collection('birthdays').add(birthday);
            console.log('Cumpleaños agregado con ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error agregando cumpleaños:', error);
            throw error;
        }
    }

    validateBirthdayData(data) {
        if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
            return false;
        }
        
        if (!data.birthDate) {
            return false;
        }

        const birthDate = new Date(data.birthDate);
        if (isNaN(birthDate.getTime())) {
            return false;
        }

        if (birthDate > new Date()) {
            return false;
        }

        return true;
    }

    async queryBirthdays() {
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const snapshot = await db.collection('birthdays')
                .where('userId', '==', auth.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error consultando cumpleaños:', error);
            throw error;
        }
    }

    async updateBirthday(birthdayId, updateData) {
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const birthdayRef = db.collection('birthdays').doc(birthdayId);
            const doc = await birthdayRef.get();

            if (!doc.exists) {
                throw new Error('Cumpleaños no encontrado');
            }

            if (doc.data().userId !== auth.currentUser.uid) {
                throw new Error('No autorizado para modificar este cumpleaños');
            }

            await birthdayRef.update({
                ...updateData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error actualizando cumpleaños:', error);
            throw error;
        }
    }
}

// Initialize managers
const authManager = new AuthManager();
const birthdayManager = new BirthdayManager();