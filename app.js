// ==========================================
// Funciones de la Calculadora
// ==========================================

function sumar(a, b) {
    return a + b;
}

function restar(a, b) {
    return a - b;
}

function multiplicar(a, b) {
    return a * b;
}

function dividir(a, b) {
    if (b === 0) {
        throw new Error('No se puede dividir entre cero');
    }
    return a / b;
}

function calcular() {
    const num1 = parseFloat(document.getElementById('num1').value);
    const num2 = parseFloat(document.getElementById('num2').value);
    const operacion = document.getElementById('operacion').value;

    let resultado;
    try {
        switch (operacion) {
            case 'sumar':
                resultado = sumar(num1, num2);
                break;
            case 'restar':
                resultado = restar(num1, num2);
                break;
            case 'multiplicar':
                resultado = multiplicar(num1, num2);
                break;
            case 'dividir':
                resultado = dividir(num1, num2);
                break;
            default:
                resultado = 'Operación no válida';
        }
    } catch (error) {
        resultado = error.message;
    }

    document.getElementById('resultado').textContent = resultado;
}

// ==========================================
// Funciones de la Lista de Tareas
// ==========================================

function agregarTarea() {
    const input = document.getElementById('nuevaTarea');
    const texto = input.value.trim();

    if (texto === '') {
        alert('Escribe una tarea primero');
        return;
    }

    const lista = document.getElementById('listaTareas');
    const li = document.createElement('li');
    li.textContent = texto;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
        li.style.textDecoration = li.style.textDecoration === 'line-through' ? 'none' : 'line-through';
    });

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = ' ❌';
    btnEliminar.addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
    });
    li.appendChild(btnEliminar);

    lista.appendChild(li);
    input.value = '';
}

function obtenerTareas() {
    const items = document.querySelectorAll('#listaTareas li');
    return Array.from(items).map(li => li.firstChild.textContent);
}

// ==========================================
// Funciones del Contador
// ==========================================

let contadorValor = 0;

function cambiarContador(delta) {
    contadorValor += delta;
    document.getElementById('contador').textContent = contadorValor;
}

function resetContador() {
    contadorValor = 0;
    document.getElementById('contador').textContent = contadorValor;
}

function obtenerContador() {
    return contadorValor;
}

// ==========================================
// Utilidades
// ==========================================

function obtenerInfoNavegador() {
    if (typeof window === 'undefined') {
        return { entorno: 'Node.js / Test' };
    }
    return {
        userAgent: navigator.userAgent,
        idioma: navigator.language,
        plataforma: navigator.platform,
        cookiesHabilitadas: navigator.cookieEnabled,
        online: navigator.onLine,
        fecha: new Date().toLocaleString('es-MX'),
    };
}

// Exportar funciones para tests (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sumar,
        restar,
        multiplicar,
        dividir,
        obtenerInfoNavegador,
    };
}
