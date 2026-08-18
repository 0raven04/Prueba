const { sumar, restar, multiplicar, dividir, obtenerInfoNavegador } = require('./app');

// ==========================================
// Tests de la Calculadora
// ==========================================

describe('Calculadora', () => {
    test('sumar dos números positivos', () => {
        expect(sumar(2, 3)).toBe(5);
    });

    test('sumar números negativos', () => {
        expect(sumar(-2, -3)).toBe(-5);
    });

    test('sumar con cero', () => {
        expect(sumar(5, 0)).toBe(5);
    });

    test('restar dos números', () => {
        expect(restar(10, 4)).toBe(6);
    });

    test('restar resultado negativo', () => {
        expect(restar(3, 10)).toBe(-7);
    });

    test('multiplicar dos números', () => {
        expect(multiplicar(4, 5)).toBe(20);
    });

    test('multiplicar por cero', () => {
        expect(multiplicar(100, 0)).toBe(0);
    });

    test('dividir dos números', () => {
        expect(dividir(10, 2)).toBe(5);
    });

    test('dividir con decimales', () => {
        expect(dividir(7, 2)).toBe(3.5);
    });

    test('dividir entre cero lanza error', () => {
        expect(() => dividir(5, 0)).toThrow('No se puede dividir entre cero');
    });
});

// ==========================================
// Tests de Utilidades
// ==========================================

describe('Utilidades', () => {
    test('obtenerInfoNavegador retorna objeto en Node.js', () => {
        const info = obtenerInfoNavegador();
        expect(info).toHaveProperty('entorno', 'Node.js / Test');
    });
});
