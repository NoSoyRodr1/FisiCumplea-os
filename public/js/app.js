let calendar;

// Función para cargar cumpleaños de Firestore
async function loadBirthdays() {
    const tarjetasContainer = document.querySelector('.tarjetas-container');
    tarjetasContainer.innerHTML = ''; // Limpiar contenedor

    try {
        const snapshot = await db.collection('birthdays')
            .where('userId', '==', auth.currentUser.uid)
            .get();

        const birthdays = [];
        snapshot.forEach(doc => {
            birthdays.push({ id: doc.id, ...doc.data() });
        });

        renderBirthdays(birthdays);
        updateCalendar(birthdays);
    } catch (error) {
        console.error('Error cargando cumpleaños:', error);
        alert('Error al cargar los cumpleaños');
    }
}

// Función para renderizar tarjetas de cumpleaños
function renderBirthdays(birthdays) {
    const tarjetasContainer = document.querySelector('.tarjetas-container');
    
    birthdays.forEach(({ id, name, birthDate }) => {
        const nextBirthdayDate = getNextBirthday(birthDate);
        const nextAge = calculateAge(birthDate, nextBirthdayDate.getFullYear());
        
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta';
        tarjeta.innerHTML = `
            <h3>${name}</h3>
            <p>Fecha de nacimiento: ${formatDate(birthDate)}</p>
            <p>Próximo cumpleaños: ${formatDate(nextBirthdayDate)}</p>
            <p>Cumplirá: ${nextAge} años</p>
            <button onclick="deleteBirthday('${id}')" class="delete-btn">Eliminar</button>
        `;
        tarjetasContainer.appendChild(tarjeta);
    });
}

// Función para actualizar el calendario
function updateCalendar(birthdays) {
    const calendarEl = document.getElementById('calendar');
    
    if (!calendar) {
        calendar = new FullCalendar.Calendar(calendarEl, {
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

    // Limpiar eventos existentes
    calendar.removeAllEvents();

    // Agregar nuevos eventos
    const events = birthdays.map(({ name, birthDate }) => {
        const nextBirthday = getNextBirthday(birthDate);
        const nextAge = calculateAge(birthDate, nextBirthday.getFullYear());
        return {
            title: `🎂 ${name} (${nextAge} años)`,
            start: nextBirthday,
            allDay: true,
            className: 'birthday-event'
        };
    });

    calendar.addEventSource(events);
    calendar.render();
}

// Función para agregar nuevo cumpleaños
document.getElementById('birthdayForm').addEventListener('submit', async (e) => {
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

        document.getElementById('birthdayForm').reset();
        loadBirthdays(); // Recargar cumpleaños
    } catch (error) {
        console.error('Error agregando cumpleaños:', error);
        alert('Error al agregar el cumpleaños');
    }
});

// Función para eliminar cumpleaños
async function deleteBirthday(id) {
    if (confirm('¿Estás seguro de querer eliminar este cumpleaños?')) {
        try {
            await db.collection('birthdays').doc(id).delete();
            loadBirthdays(); // Recargar cumpleaños
        } catch (error) {
            console.error('Error eliminando cumpleaños:', error);
            alert('Error al eliminar el cumpleaños');
        }
    }
}

// Funciones auxiliares
function calculateAge(birthDate, currentYear = new Date().getFullYear()) {
    const birth = new Date(birthDate);
    return currentYear - birth.getFullYear();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getNextBirthday(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    return nextBirthday;
}