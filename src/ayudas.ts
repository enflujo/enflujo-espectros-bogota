export function reducirDecimales(valor: number, numeroDeDecimales = 2) {
  return Math.floor(valor).toString().padStart(numeroDeDecimales, '0');
}

export async function cargarImgs(imagenes): Promise<void> {
  return new Promise((resolver, rechazar) => {
    let imagenesCargadas = 0;
    const totalImgs = Object.keys(imagenes).length;
    if (!totalImgs) resolver();

    for (const nombre in imagenes) {
      imagenes[nombre].img.onload = () => {
        imagenesCargadas++;
        imagenes[nombre].ancho = imagenes[nombre].img.naturalWidth;
        imagenes[nombre].alto = imagenes[nombre].img.naturalHeight;

        if (imagenesCargadas === totalImgs) {
          resolver();
        }
      };

      imagenes[nombre].img.onerror = () => {
        rechazar(`La imagen ${imagenes[nombre].ruta} no esta disponible`);
      };
      imagenes[nombre].img.src = imagenes[nombre].ruta;
    }
  });
}
