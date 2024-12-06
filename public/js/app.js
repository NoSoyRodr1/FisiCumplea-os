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
        this.initializeCalendar();
    }

    initializeCalendar() {
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
            this.calendar.render();
        }
    }

    async loadBirthdays() {
        const tarjetasContainer = document.querySelector('.tarjetas-container');
        if (!tarjetasContainer) return;
        
        tarjetasContainer.innerHTML = '';

        try {
            if (!auth.currentUser) {
                console.error('No hay usuario autenticado');
                return;
            }

            console.log('Consultando cumpleaños para usuario:', auth.currentUser.uid);
            
            const snapshot = await db.collection('birthdays')
                .where('userId', '==', auth.currentUser.uid)
                .get();

            const birthdays = [];
            snapshot.forEach(doc => {
                birthdays.push({ id: doc.id, ...doc.data() });
                console.log('Cumpleaños encontrado:', doc.data());
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
            console.log('Renderizando tarjeta para:', name, birthDate);
            
            const nextBirthdayDate = this.getNextBirthday(birthDate);
            const nextAge = this.calculateAge(birthDate, nextBirthdayDate.getFullYear());
            
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta';
            tarjeta.innerHTML = `
                <h3>${name}</h3>
                <p>Fecha de nacimiento: ${this.formatDate(birthDate)}</p>
                <p>Próximo cumpleaños: ${this.formatDate(nextBirthdayDate)}</p>
                <p>Cumplirá: ${nextAge} años</p>
            `;
            tarjetasContainer.appendChild(tarjeta);
        });
    }

    updateCalendar(birthdays) {
        if (!this.calendar) {
            console.error('Calendario no inicializado');
            return;
        }

        this.calendar.removeAllEvents();

        const events = birthdays.map(({ name, birthDate }) => {
            console.log('Creando evento para:', name, birthDate);
            const nextBirthday = this.getNextBirthday(birthDate);
            const nextAge = this.calculateAge(birthDate, nextBirthday.getFullYear());
            return {
                title: `🎂 ${name} (${nextAge} años)`,
                start: nextBirthday.toISOString().split('T')[0],
                allDay: true,
                className: 'birthday-event'
            };
        });

        console.log('Eventos del calendario:', events);
        this.calendar.addEventSource(events);
        this.calendar.render();
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
const styles = `
.tarjeta {
    background-color: white;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tarjeta h3 {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.tarjetas-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
}

.birthday-event {
    background-color: var(--primary-color) !important;
    border-color: var(--primary-color) !important;
}
`;

// Agregar los estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);