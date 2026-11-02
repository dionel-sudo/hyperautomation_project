let mediaRecorder;
let audioChunks = [];
let recordedAudioBase64 = null;

const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const audioPreview = document.getElementById('audioPreview');
const recordingStatus = document.getElementById('recordingStatus');
const opinionForm = document.getElementById('opinionForm');

// Inicializar Grabador de Audio del Navegador
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];
                const audioUrl = URL.createObjectURL(audioBlob);
                audioPreview.src = audioUrl;
                audioPreview.style.display = 'block';

                // Convertir Blob a Base64 para poder guardarlo en LocalStorage
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    recordedAudioBase64 = reader.result;
                };

                recordingStatus.textContent = "Audio recorded successfully! Ready to submit.";
            };
        })
        .catch(error => {
            console.error("Microphone access denied or not available.", error);
            recordingStatus.textContent = "Microphone access unavailable.";
        });
}

if (recordBtn && stopBtn) {
    recordBtn.addEventListener('click', () => {
        audioChunks = [];
        recordedAudioBase64 = null;
        mediaRecorder.start();
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        recordingStatus.textContent = "Recording in progress...";
    });

    stopBtn.addEventListener('click', () => {
        mediaRecorder.stop();
        recordBtn.disabled = false;
        stopBtn.disabled = true;
    });
}

// Manejar envío del formulario mediante LocalStorage (Ideal para Netlify)
if (opinionForm) {
    opinionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const comentario = document.getElementById('comentario').value;
        const fecha = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const nuevaOpinion = {
            id: Date.now(),
            nombre: nombre,
            comentario: comentario,
            audio: recordedAudioBase64,
            fecha: fecha
        };

        // Guardar en LocalStorage
        let opiniones = JSON.parse(localStorage.getItem('opiniones_hyperautomation')) || [];
        opiniones.unshift(nuevaOpinion);
        localStorage.setItem('opiniones_hyperautomation', JSON.stringify(opiniones));

        // Limpiar formulario y reproductor de vista previa
        opinionForm.reset();
        audioPreview.style.display = 'none';
        recordedAudioBase64 = null;
        recordingStatus.textContent = "Ready to record";

        // Mostrar alerta temporal de éxito
        mostrarAlerta("¡Opinión y audio registrados con éxito!");

        // Recargar lista visual
        cargarOpiniones();
    });
}

// Función para mostrar alertas dinámicas
function mostrarAlerta(texto) {
    // Evitar duplicados
    const alertaExistente = document.getElementById('successAlert');
    if (alertaExistente) alertaExistente.remove();

    const alertBox = document.createElement('div');
    alertBox.className = 'alert';
    alertBox.id = 'successAlert';
    alertBox.textContent = texto;

    const mainContainer = document.querySelector('main');
    mainContainer.insertBefore(alertBox, mainContainer.firstChild);

    setTimeout(() => {
        alertBox.style.transition = 'opacity 0.5s ease';
        alertBox.style.opacity = '0';
        setTimeout(() => alertBox.remove(), 500);
    }, 4000);
}

// Cargar opiniones guardadas al abrir la página
function cargarOpiniones() {
    let contenedor = document.getElementById('reviewsContainer');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'reviewsContainer';
        document.querySelector('main').appendChild(contenedor);
    }

    let opiniones = JSON.parse(localStorage.getItem('opiniones_hyperautomation')) || [];
    
    if (opiniones.length === 0) {
        contenedor.innerHTML = '<p class="no-reviews" style="text-align:center; color:#64748b; margin: 20px 0;">No opinions submitted yet. Be the first!</p>';
        return;
    }

    let htmlHTML = '';
    opiniones.forEach(op => {
        htmlHTML += `
            <div class="review-card" id="review-${op.id}">
                <h4>${escapeHtml(op.nombre)} <span class="date">${op.fecha}</span></h4>
                <p>${escapeHtml(op.comentario)}</p>
                ${op.audio ? `<audio controls class="review-audio" style="width:100%; margin-top:8px;"><source src="${op.audio}" type="audio/wav">Tu navegador no soporta audio.</audio>` : ''}
                <button type="button" class="btn-delete" onclick="eliminarOpinion(${op.id})">🗑️ Eliminar</button>
            </div>
        `;
    });

    contenedor.innerHTML = htmlHTML;
}

// Función global para eliminar opiniones guardadas
function eliminarOpinion(id) {
    if (confirm('Are you sure you want to delete this audio and opinion?')) {
        let opiniones = JSON.parse(localStorage.getItem('opiniones_hyperautomation')) || [];
        opiniones = opiniones.filter(op => op.id !== id);
        localStorage.setItem('opiniones_hyperautomation', JSON.stringify(opiniones));

        // Animación visual de salida
        const card = document.getElementById('review-' + id);
        if (card) {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        } else {
            cargarOpiniones();
        }
    }
}

// Seguridad básica para evitar inyecciones HTML en los inputs locales
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarOpiniones();
});