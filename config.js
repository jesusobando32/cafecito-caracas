// Configuración opcional.
// googlePlacesKey: clave de Google Places API (New). Si se deja vacía, la app funciona solo con OpenStreetMap.
// La clave queda visible en el navegador: restríngela por "referrer HTTP" (tu dominio de GitHub Pages y localhost)
// y solo a "Places API (New)" en Google Cloud Console.
window.CAFECITO_CONFIG = {
  googlePlacesKey: '',
  // true (por defecto): foto + horario + valoración + web + teléfono (plan Enterprise de Google, más caro por consulta).
  // false: solo la foto y el enlace al lugar (plan Pro, más barato).
  googlePlacesDetails: true,
};
