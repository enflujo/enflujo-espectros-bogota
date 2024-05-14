/**
 * Una matriz puede transformar una imagen 2D de esta manera: https://en.wikipedia.org/wiki/Transformation_matrix#/media/File:2D_affine_transformation_matrix.svg
 * En la imagen se ven arrays de 9 elementos, pero la última línea es para el eje Z que acá no se usa (en el imagen se ven en gris).
 *
 * ```
 * |a c e|
 * |b d f|
 * ```
 *
 * @ejemplo
 * ```js
 * const t = new Transform();
 * t.transladar(100, 100).rotar(Math.PI / 4);
 * ctx.setTranform(...t.matriz);
 * ```
 */
export default class Transformacion {
  matriz: [a: number, b: number, c: number, d: number, e: number, f: number];

  constructor() {
    this.identidad();
  }

  /**
   * Matriz sin transformación.
   * ```
   * |1 0 0|
   * |0 1 0|
   * ```
   */
  identidad() {
    this.matriz = [1, 0, 0, 1, 0, 0];
    return this;
  }

  /**
   * ```
   * |1 0 x|
   * |0 1 y|
   * ```
   */
  transladar(x: number, y = 0) {
    this.matriz[4] += this.matriz[0] * x + this.matriz[2] * y;
    this.matriz[5] += this.matriz[1] * x + this.matriz[3] * y;
    return this;
  }

  /**
   * ```
   * |ancho   0     0|
   * |0       alto  0|
   * ```
   * @param x Proporción escala a lo ancho
   * @param y Proporción escala a lo alto
   * @returns this
   */
  escalar(escalaX: number, escalaY = escalaX) {
    this.matriz[0] *= escalaX;
    this.matriz[1] *= escalaX;
    this.matriz[2] *= escalaY;
    this.matriz[3] *= escalaY;
    return this;
  }

  /**
   * ```
   * |cosθ -senθ 0|
   * |senθ cosθ  0|
   * ```
   * @param angulo Ángulo en radianes
   */
  rotar(angulo: number) {
    const x = Math.cos(angulo);
    const y = Math.sin(angulo);
    const a = this.matriz[0] * x + this.matriz[2] * y;
    const b = this.matriz[1] * x + this.matriz[3] * y;
    const c = this.matriz[0] * -y + this.matriz[2] * x;
    const d = this.matriz[1] * -y + this.matriz[3] * x;
    this.matriz[0] = a;
    this.matriz[1] = b;
    this.matriz[2] = c;
    this.matriz[3] = d;
    return this;
  }

  multiplicar(matrizB: Transformacion) {
    const [a1, b1, c1, d1, e1, f1] = this.matriz;
    const [a2, b2, c2, d2, e2, f2] = matrizB.matriz;

    const a = a1 * a2 + c1 * b2;
    const b = b1 * a2 + d1 * b2;
    const c = a1 * c2 + c1 * d2;
    const d = b1 * c2 + d1 * d2;
    const e = a1 * e2 + c1 * f2 + e1;
    const f = b1 * e2 + d1 * f2 + f1;
    this.matriz = [a, b, c, d, e, f];
    return this;
  }
}
