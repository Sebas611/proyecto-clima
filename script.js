(function () {
  // Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyChBH089Anzh8V5RirHq5M10vOyJOikfWg",
    authDomain: "proyectoiot-44421.firebaseapp.com",
    projectId: "proyectoiot-44421",
    storageBucket: "proyectoiot-44421.appspot.com",
    messagingSenderId: "775816020229",
    appId: "1:775816020229:web:04951a0d3b4f505d88b76c",
    measurementId: "G-N5XJYTEZWF"
  };

  // Inicializar Firebase
  try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado correctamente");
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }

  const db = firebase.firestore();

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;

  // Elementos del DOM
  const grid = document.getElementById('calendar-grid');
  const title = document.getElementById('month-year');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');
  const selDateEl = document.getElementById('selected-date');
  const tempEl = document.getElementById('temp');
  const tempDisplayEl = document.getElementById('temp-display');
  const descEl = document.getElementById('desc');
  const precEl = document.getElementById('prec');
  const windEl = document.getElementById('wind');
  const iconEl = document.getElementById('weather-icon');
  const fechaInput = document.getElementById('fecha');
  const humedadEl = document.getElementById('humedad');
  const estadoEl = document.getElementById('estado');
  const graficoCtx = document.getElementById('graficoTemp').getContext('2d');
  const graficoAvanzadoCtx = document.getElementById('graficoAvanzado').getContext('2d');
  const graficoBarrasCtx = document.getElementById('graficoBarras').getContext('2d');

  let graficoDiario = null;
  let graficoAvanzado = null;
  let graficoBarras = null;
  let datosActuales = [];
  let vistaActual = 'lineas'; // 'lineas' o 'barras'

  // ===== FUNCIÓN DE ICONOS =====
  function iconSVG(type) {
    switch (type) {
      case 'suncludy':
        return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ec5e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 4 17.25"></path>
        </svg>`;

      case 'rain':
        return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00bfff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="19" x2="10" y2="23"></line>
          <line x1="16" y1="19" x2="18" y2="23"></line>
          <line x1="12" y1="19" x2="14" y2="23"></line>
          <path d="M20 16.58A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.25"></path>
        </svg>`;

      case 'cloud':
        return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ec5e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 17.58A5 5 0 0 0 18 10h-1.26A8 8 0 1 0 4 17.25 H5z"></path>

          <line x1="5" y1="12" x2="5" y2="12"></line>
          <line x1="5.5" y1="8.5" x2="5.5" y2="8.5"></line>
          <line x1="9" y1="7" x2="9" y2="7"></line>
          <line x1="12" y1="8" x2="12" y2="8"></line>
          <line x1="13" y1="11" x2="13" y2="11"></line>

          <line x1="16.5" y1="14" x2="16.5" y2="14"></line>
          <line x1="8" y1="14" x2="8" y2="14"></line>
          <line x1="12" y1="14" x2="12" y2="14"></line>

          <line x1="9" y1="11" x2="9" y2="11"></line>


        </svg>`;
      default:
        return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffd84d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>`;
    }
  }

  // ===== FUNCIONES DE FIREBASE =====
  async function guardarEnFirebase(datos) {
    try {
      if (!datos || typeof datos !== 'object') {
        throw new Error('Datos inválidos');
      }

      const datosValidados = {
        temperatura: datos.temperatura !== undefined ? Number(datos.temperatura) : null,
        humedad: datos.humedad !== undefined ? Number(datos.humedad) : null,
        estado: datos.estado || 'Desconocido',
        precipitacion: datos.precipitacion !== undefined ? Number(datos.precipitacion) : null,
        viento: datos.viento !== undefined ? Number(datos.viento) : null,
        fecha: datos.fecha || new Date().toISOString().split('T')[0],
        hora: datos.hora || new Date().toTimeString().slice(0, 5),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (isNaN(datosValidados.temperatura) || isNaN(datosValidados.humedad)) {
        throw new Error('Datos numéricos inválidos');
      }

      const docRef = await db.collection('datosAmbientales').add(datosValidados);
      console.log("Datos guardados en Firebase. ID:", docRef.id);
      actualizarEstado(`Datos guardados correctamente (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error("Error guardando en Firebase:", error);
      actualizarEstado(`Error guardando en Firebase: ${error.message}`);
      throw error;
    }
  }

  async function cargarDeFirebase(rangoFechas) {
    try {
      const inicioStr = rangoFechas.inicio.toISOString().split('T')[0];
      const finStr = rangoFechas.fin.toISOString().split('T')[0];

      actualizarEstado(`Cargando datos del ${inicioStr} al ${finStr}...`);

      const snapshot = await db.collection('datosAmbientales')
        .where('fecha', '>=', inicioStr)
        .where('fecha', '<=', finStr)
        .orderBy('fecha', 'asc')
        .get();

      if (snapshot.empty) {
        console.log('No hay documentos en el rango', inicioStr, finStr);
        return [];
      }

      const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      datosActuales = datos;
      return datos;
    } catch (error) {
      console.error("Error cargando datos:", error);
      throw error;
    }
  }

  // ===== GENERACIÓN DE DATOS SINTÉTICOS (MEJORADA) =====
  // Implementa: datos mensuales, ciclo diurno, semilla reproducible, persistencia lluvia (Markov-like),
  // viento con ráfagas, viento entre 0.5 y 30 km/h, precipitación en mm/h.
  function generarClimaSintetico(fecha) {
    // --- valores mensuales (extraídos de la imagen) ---
    const tempMediaMensual = [22.6, 23.1, 24.0, 24.9, 24.7, 24.3, 24.0, 24.2, 24.3, 24.0, 23.3, 22.9];
    const tempMinMensual   = [20.1, 19.9, 20.6, 21.5, 22.0, 21.9, 21.7, 21.7, 21.6, 21.5, 21.2, 20.7];
    const tempMaxMensual   = [26.3, 27.4, 28.6, 29.4, 28.6, 27.9, 27.4, 27.9, 28.2, 27.5, 26.4, 26.2];

    const precipMensualMm  = [87, 57, 52, 86, 303, 312, 245, 262, 320, 356, 260, 144];
    const diasLluviaMensual= [11, 8, 9, 12, 20, 21, 21, 21, 21, 21, 19, 15];
    const humedadMensual   = [89,85,82,82,89,92,92,92,92,93,93,91]; // %
    const horasSolMensual  = [5.6,6.5,6.7,6.7,5.1,4.7,5.0,5.0,4.6,3.9,3.6,4.6]; // horas/día

    const year = fecha.getFullYear();
    const month = fecha.getMonth(); // 0..11
    const day = fecha.getDate();
    const hour = fecha.getHours();
    const minute = fecha.getMinutes();

    // --- generador pseudoaleatorio reproducible (Mulberry32) por hora ---
    const seedInt = day + (month+1)*100 + year*10000 + hour*1000000; // único por hora
    function mulberry32(a) {
      return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    const rnd = mulberry32(seedInt);
    const r = rnd();

    // Para persistencia de lluvia: determinamos si la hora anterior estaba lloviendo
    // usando un generador con semilla del "hora anterior" (determinístico).
    const prevSeedInt = seedInt - 1;
    const rndPrev = mulberry32(prevSeedInt);
    const prevR = rndPrev();

    // --- Temperatura: combina media mensual con ciclo diurno y rango (min/max) ---
    const media = tempMediaMensual[month];
    const tMin = tempMinMensual[month];
    const tMax = tempMaxMensual[month];

    const amp = Math.max((tMax - tMin) / 2, 1.0);
    // sinusoide desplazada: mínimo aproximado 4-6am, máximo 15-16h
    const diurnal = Math.sin(((hour - 4) / 24) * 2 * Math.PI); // -1..1
    const tempBase = media + diurnal * amp;
    const temperatura = Number(Math.min(tMax + 0.5, Math.max(tMin - 0.5, tempBase + (r * 2 - 1))).toFixed(1));

    // --- Humedad: base mensual + efecto inverso de la temperatura + ruido pequeño ---
    const humBase = humedadMensual[month];
    const humFromTemp = ((media - temperatura) / Math.max(1, amp)) * 4;
    const humedadRaw = humBase + humFromTemp + (r * 6 - 3);
    const humedad = Number(Math.min(100, Math.max(10, humedadRaw)).toFixed(1));

    // --- Precipitación (mm/h) con persistencia ---
    const diasLluvia = diasLluviaMensual[month];
    const diasMes = new Date(year, month + 1, 0).getDate();

    const horasLluviaPorDia = 4; // aproximado
    const probHoraLluviaBase = diasLluvia > 0 ? (diasLluvia / diasMes) * (horasLluviaPorDia / 24) : 0;
    // Si la hora anterior llovía (prevR < probHoraLluviaBase) aumentamos prob de seguir lloviendo
    const prevRaining = prevR < probHoraLluviaBase;
    let probHoraLluvia = probHoraLluviaBase;
    if (prevRaining) {
      probHoraLluvia = Math.min(0.98, probHoraLluviaBase + 0.4 * (1 - probHoraLluviaBase)); // fuerte persistencia
    }

    const mmPorDiaLluvioso = diasLluvia > 0 ? (precipMensualMm[month] / diasLluvia) : 0;
    const mmPorHoraLluvioso = mmPorDiaLluvioso / horasLluviaPorDia;

    let precipitacion = 0;
    const lluviaOcurrencia = r < probHoraLluvia;
    if (lluviaOcurrencia) {
      // intensidad alrededor de mmPorHoraLluvioso con variación 0.2x..1.8x
      const variacion = 0.2 + (r * 1.6);
      precipitacion = Number((mmPorHoraLluvioso * variacion).toFixed(1));
      if (precipitacion < 0.1) precipitacion = 0;
    }

    // --- Viento (km/h) con ráfagas ---
    // base lento-moderado según rnd (0.5..6.0)
    let vientoBase = 0.5 + r * 6;
    // si hay lluvia intensa, aumentar viento base
    if (precipitacion > Math.max(1, mmPorHoraLluvioso * 1.2)) {
      vientoBase += 3 + r * 6;
    }
    // ligera dependencia con horas de sol (menos sol -> a veces más viento)
    vientoBase += ((6 - horasSolMensual[month]) / 6) * (r * 2);

    // añadir posibilidad de ráfaga (gust): pequeña probabilidad pero con impacto
    const gustChance = 0.06 + (precipitacion > 5 ? 0.08 : 0); // 6% base, +8% si lluvia fuerte
    let viento = vientoBase;
    if (r < gustChance) {
      // ráfaga: entre +5 a +18 km/h
      const gust = 5 + rnd() * 13;
      viento += gust;
    }

    // saturar viento en el rango 0.5..30
    viento = Number(Math.min(30, Math.max(0.5, viento)).toFixed(1));

    // --- Estado del cielo (REEMPLAZO MEJORADO) ---
    const tendenciaLluviaMensual = precipMensualMm[month] / 400; // escala 0..~1
    const roll = r; // usar el número aleatorio ya calculado

    // probabilidad base de nublado (más conservadora que antes)
    let probNublado = Math.min(0.85, 0.10 + tendenciaLluviaMensual * 0.45 + ((100 - humedad) / 500));

    // Ajustes por temperatura: si hace mucho más calor que la media, subir chance de soleado
    let bonusSoleado = 0;
    if (temperatura >= media + 2) bonusSoleado = 0.25;    // condición caliente -> +25% a soleado
    else if (temperatura >= media + 1) bonusSoleado = 0.12;

    // Distribuimos probabilidades cuando NO está lloviendo
    // p_nublado = probNublado
    // p_soleado = baseSoleado + bonusSoleado
    // p_parcial = restante
    const baseSoleado = 0.12; // baseline de sol
    let p_nublado = probNublado;
    let p_soleado = Math.min(0.8, baseSoleado + bonusSoleado);
    // si p_nublado + p_soleado > 0.98, reducir p_nublado
    if (p_nublado + p_soleado > 0.98) p_nublado = Math.max(0, 0.98 - p_soleado);
    let p_parcial = Math.max(0, 1 - p_nublado - p_soleado);

    if (precipitacion >= 1.0) {
      estado = "Lluvioso";
    } else {
      // elegir por roll en [0,1)
      if (roll < p_nublado) estado = "Nublado";
      else if (roll < p_nublado + p_parcial) estado = "Parcialmente nublado";
      else estado = "Soleado";
    }



    // hora formateada
    const horaStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    return {
      temperatura,
      humedad,
      estado,
      precipitacion, // mm en esta hora
      viento,
      fecha: fecha.toISOString().split('T')[0],
      hora: horaStr,
      meta: {
        mes: month + 1,
        mediaMensual: media,
        tempMinMensual: tMin,
        tempMaxMensual: tMax,
        diasLluviaMensual: diasLluvia,
        probHoraLluvia: Number(probHoraLluvia.toFixed(4)),
        prevRaining
      }
    };
  }

  // ===== FILTRO DE VALORES ATÍPICOS =====
  function filtrarValoresAtipicos(datos) {
    return datos.filter(dato => {
      // Temperatura: -10°C a 50°C (rango realista)
      const tempOk = dato.temperatura >= -10 && dato.temperatura <= 50;
      // Humedad: 0% a 100%
      const humOk = dato.humedad >= 0 && dato.humedad <= 100;
      // Precipitación: 0 mm a 1000 mm (rango amplio)
      const precOk = dato.precipitacion >= 0 && dato.precipitacion <= 1000;
      // Viento: 0 km/h a 200 km/h (rango realista)
      const vientoOk = dato.viento >= 0 && dato.viento <= 200;
      
      return tempOk && humOk && precOk && vientoOk;
    });
  }

  // ===== GENERACIÓN DE DATASET COMPLETO =====
  async function generarDatasetCompleto() {
    actualizarEstado('Generando dataset completo (10 días, cada 30 minutos)...');
    
    try {
      const ahora = new Date();
      let contador = 0;
      const totalRegistros = 10 * 24 * 2;

      for (let d = 0; d < 10; d++) {
        const fechaBase = new Date(ahora);
        fechaBase.setDate(ahora.getDate() - d - 1);

        for (let h = 0; h < 24; h++) {
          for (let m = 0; m < 60; m += 30) {
            const horaActual = new Date(fechaBase);
            horaActual.setHours(h, m, 0, 0);

            const datos = generarClimaSintetico(horaActual);
            await guardarEnFirebase(datos);
            
            contador++;
            
            if (contador % 10 === 0) {
              const progreso = ((contador / totalRegistros) * 100).toFixed(1);
              actualizarEstado(`Generando dataset... ${progreso}% (${contador}/${totalRegistros})`);
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
      }

      actualizarEstado(`Dataset completo generado (${contador} registros)`);
      await generarCSVCompleto();
      
    } catch (error) {
      actualizarEstado(`Error generando dataset: ${error.message}`);
      console.error('Error en generarDatasetCompleto:', error);
    }
  }

  // ===== CALENDARIO =====
  function renderCalendar() {
    grid.innerHTML = '';
    title.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDay = firstOfMonth.getDay();
    const firstCellDate = new Date(viewYear, viewMonth, 1 - startDay);

    for (let i = 0; i < 42; i++) {
      const d = new Date(firstCellDate.getFullYear(), firstCellDate.getMonth(), firstCellDate.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'day';
      cell.setAttribute('role','gridcell');

      if (d.getMonth() !== viewMonth) cell.classList.add('muted');
      if (d.toDateString() === (new Date()).toDateString()) cell.classList.add('today');

      const num = document.createElement('div');
      num.className = 'date-num';
      num.textContent = d.getDate();
      cell.appendChild(num);

      const meta = document.createElement('div');
      meta.className = 'meta';
      const preview = generarClimaSintetico(d);
      meta.textContent = `${preview.temperatura}°C • ${preview.estado}`;
      cell.appendChild(meta);

      cell.dataset.date = d.toISOString();

      cell.addEventListener('click', () => {
        const prev = grid.querySelector('.day.selected');
        if (prev) prev.classList.remove('selected');
        cell.classList.add('selected');
        selectedDate = d;
        updateWeatherPanel(d);
        actualizarClima(d);
      });

      grid.appendChild(cell);
    }

    if (selectedDate && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear) {
      const cells = grid.querySelectorAll('.day');
      cells.forEach(c => {
        if (new Date(c.dataset.date).toDateString() === selectedDate.toDateString()) {
          c.classList.add('selected');
        }
      });
    }
  }

  function updateWeatherPanel(date) {
    const w = generarClimaSintetico(date);
    const fmt = date.toLocaleDateString('es-CR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    selDateEl.textContent = fmt.charAt(0).toUpperCase() + fmt.slice(1);
    tempDisplayEl.textContent = `${w.temperatura} °C`;
    descEl.textContent = w.estado;
    // mostrar precipitación en mm/h
    precEl.textContent = `Precip: ${w.precipitacion} mm`;
    windEl.textContent = `Viento: ${w.viento} km/h`;
    humedadEl.textContent = w.humedad + " %";
    estadoEl.textContent = w.estado;

    let iconType = 'sun';
    if (w.estado.includes('Lluvia') || w.estado.includes('Lluvioso')) iconType = 'rain';
    else if (w.estado.includes('Parcialmente')) iconType = 'suncludy';
    else if (w.estado.includes('Soleado')) iconType = 'sun';
    else if (w.estado.includes('Nublado')) iconType = 'cloud';

    iconEl.innerHTML = iconSVG(iconType);
  }

  // ===== ACTUALIZACIÓN DE CLIMA =====
  function actualizarClima(fecha) {
    const clima = generarClimaSintetico(fecha);

    tempEl.textContent = clima.temperatura + " °C";
    tempDisplayEl.textContent = clima.temperatura + " °C";
    humedadEl.textContent = clima.humedad + " %";
    estadoEl.textContent = clima.estado;
    // precip en mm/h
    precEl.textContent = `Precip: ${clima.precipitacion} mm`;
    windEl.textContent = `Viento: ${clima.viento} km/h`;

    if (graficoDiario) graficoDiario.destroy();

    const horas = [6, 9, 12, 15, 18, 21];
    const temperaturas = horas.map(h => {
      const tempHora = new Date(fecha);
      tempHora.setHours(h, 0, 0, 0);
      return generarClimaSintetico(tempHora).temperatura;
    });

    graficoDiario = new Chart(graficoCtx, {
      type: 'line',
      data: {
        labels: horas.map(h => h + ":00"),
        datasets: [{
          label: 'Temperatura (°C)',
          data: temperaturas,
          borderColor: 'rgba(74, 144, 226, 1)',
          backgroundColor: 'rgba(74, 144, 226, 0.15)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: true },
          title: {
            display: true,
            text: 'Evolución de Temperatura durante el Día',
            color: getComputedStyle(document.body).getPropertyValue('--white')
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            suggestedMin: Math.min(...temperaturas) - 2,
            suggestedMax: Math.max(...temperaturas) + 2,
            ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') }
          },
          x: {
            ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') }
          }
        }
      }
    });

    guardarEnFirebase(clima).catch(e => {
      console.error('Error guardando en Firebase:', e);
    });
  }

  // ===== CONSULTA AVANZADA =====
  async function aplicarConsultaAvanzada() {
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const horaEspecifica = document.getElementById('hora-especifica').value;
    
    const variablesSeleccionadas = Array.from(document.querySelectorAll('input[name="variables"]:checked'))
        .map(checkbox => checkbox.value);
    
    const estadisticasSeleccionadas = Array.from(document.querySelectorAll('input[name="stats"]:checked'))
        .map(checkbox => checkbox.value);
    const filtrarAtipicos = document.getElementById('filtro-atipicos').checked;

    // Validaciones
    if (!fechaInicio || !fechaFin) {
        alert('Por favor selecciona un rango de fechas');
        return;
    }

    const inicioDate = new Date(fechaInicio);
    const finDate = new Date(fechaFin);

    if (inicioDate > finDate) {
        alert('La fecha inicio debe ser anterior o igual a la fecha fin');
        return;
    }

    if (variablesSeleccionadas.length === 0) {
        alert('Por favor selecciona al menos una variable');
        return;
    }

    if (estadisticasSeleccionadas.length === 0) {
        alert('Por favor selecciona al menos una estadística');
        return;
    }

    const boton = document.getElementById('aplicar-consulta');
    const textoOriginal = boton.textContent;
    boton.textContent = 'Procesando...';
    boton.disabled = true;

    try {
        let datos = await cargarDeFirebase({ inicio: inicioDate, fin: finDate });

        if (datos.length === 0) {
            alert('No hay datos para el rango de fechas seleccionado');
            return;
        }

        if (filtrarAtipicos) {
            const datosOriginales = datos.length;
            datos = filtrarValoresAtipicos(datos);
            const datosFiltrados = datos.length;
            actualizarEstado(`Filtrados ${datosOriginales - datosFiltrados} valores atípicos`);
        }

        datosActuales = datos;

        calcularEstadisticas(datos);
        mostrarGraficoAvanzado(datos, variablesSeleccionadas);
        
        document.getElementById('seccion-grafico-avanzado').style.display = 'block';
        document.getElementById('seccion-grafico-barras').style.display = 'none';
        vistaActual = 'lineas';
        
        actualizarEstado(`Consulta ejecutada: ${datos.length} registros procesados`);
            
    } catch (error) {
        console.error('Error en consulta avanzada:', error);
        alert('Error al cargar los datos (ver consola)');
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
  }

  // ===== ESTADÍSTICAS =====
  function calcularEstadisticas(datos) {
    // Temperatura
    const temperaturas = datos.map(d => Number(d.temperatura)).filter(t => !isNaN(t));
    if (temperaturas.length > 0) {
      document.getElementById('temp-max').textContent = Math.max(...temperaturas).toFixed(1);
      document.getElementById('temp-min').textContent = Math.min(...temperaturas).toFixed(1);
      document.getElementById('temp-prom').textContent = (temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length).toFixed(1);
    }

    // Humedad
    const humedades = datos.map(d => Number(d.humedad)).filter(h => !isNaN(h));
    if (humedades.length > 0) {
      document.getElementById('hum-max').textContent = Math.max(...humedades).toFixed(1);
      document.getElementById('hum-min').textContent = Math.min(...humedades).toFixed(1);
      document.getElementById('hum-prom').textContent = (humedades.reduce((a, b) => a + b, 0) / humedades.length).toFixed(1);
    }

    // Precipitación (mm)
    const precipitaciones = datos.map(d => Number(d.precipitacion)).filter(p => !isNaN(p));
    if (precipitaciones.length > 0) {
      document.getElementById('prec-max').textContent = Math.max(...precipitaciones).toFixed(1);
      document.getElementById('prec-min').textContent = Math.min(...precipitaciones).toFixed(1);
      document.getElementById('prec-prom').textContent = (precipitaciones.reduce((a, b) => a + b, 0) / precipitaciones.length).toFixed(1);
    }

    // Viento
    const vientos = datos.map(d => Number(d.viento)).filter(v => !isNaN(v));
    if (vientos.length > 0) {
      document.getElementById('viento-max').textContent = Math.max(...vientos).toFixed(1);
      document.getElementById('viento-min').textContent = Math.min(...vientos).toFixed(1);
      document.getElementById('viento-prom').textContent = (vientos.reduce((a, b) => a + b, 0) / vientos.length).toFixed(1);
    }
  }

  // ===== GRÁFICO AVANZADO - LÍNEAS =====
  function mostrarGraficoAvanzado(datos, variables) {
    if (!graficoAvanzadoCtx) {
      console.error("No se encontró el contexto del gráfico avanzado");
      return;
    }

    if (graficoAvanzado) {
      graficoAvanzado.destroy();
    }

    // Agrupar datos por fecha
    const datosPorFecha = {};
    datos.forEach(dato => {
      if (!datosPorFecha[dato.fecha]) {
        datosPorFecha[dato.fecha] = [];
      }
      datosPorFecha[dato.fecha].push(dato);
    });

    const fechas = Object.keys(datosPorFecha).sort();
    const datasets = [];

    const colores = {
      temperatura: { border: '#ff5733', background: 'rgba(255, 87, 51, 0.1)' },
      humedad: { border: '#33b5ff', background: 'rgba(51, 181, 255, 0.1)' },
      precipitacion: { border: '#7a42f4', background: 'rgba(122, 66, 244, 0.1)' },
      viento: { border: '#00e676', background: 'rgba(0, 230, 118, 0.1)' }
    };

    if (variables.includes('temperatura')) {
      const promediosTemperatura = fechas.map(fecha => {
        const temps = datosPorFecha[fecha].map(d => Number(d.temperatura)).filter(t => !isNaN(t));
        return temps.length > 0 ? (temps.reduce((a, b) => a + b, 0) / temps.length) : null;
      });
      
      datasets.push({
        label: 'Temperatura Promedio (°C)',
        data: promediosTemperatura,
        borderColor: colores.temperatura.border,
        backgroundColor: colores.temperatura.background,
        tension: 0.4,
        fill: true,
        borderWidth: 2
      });
    }

    if (variables.includes('humedad')) {
      const promediosHumedad = fechas.map(fecha => {
        const hums = datosPorFecha[fecha].map(d => Number(d.humedad)).filter(h => !isNaN(h));
        return hums.length > 0 ? (hums.reduce((a, b) => a + b, 0) / hums.length) : null;
      });
      
      datasets.push({
        label: 'Humedad Promedio (%)',
        data: promediosHumedad,
        borderColor: colores.humedad.border,
        backgroundColor: colores.humedad.background,
        tension: 0.4,
        fill: true,
        borderWidth: 2
      });
    }

    if (variables.includes('precipitacion')) {
      const promediosPrecipitacion = fechas.map(fecha => {
        const precs = datosPorFecha[fecha].map(d => Number(d.precipitacion)).filter(p => !isNaN(p));
        return precs.length > 0 ? (precs.reduce((a, b) => a + b, 0) / precs.length) : null;
      });
      
      datasets.push({
        label: 'Precipitación Promedio (mm)',
        data: promediosPrecipitacion,
        borderColor: colores.precipitacion.border,
        backgroundColor: colores.precipitacion.background,
        tension: 0.4,
        fill: true,
        borderWidth: 2
      });
    }

    if (variables.includes('viento')) {
      const promediosViento = fechas.map(fecha => {
        const vientos = datosPorFecha[fecha].map(d => Number(d.viento)).filter(v => !isNaN(v));
        return vientos.length > 0 ? (vientos.reduce((a, b) => a + b, 0) / vientos.length) : null;
      });
      
      datasets.push({
        label: 'Viento Promedio (km/h)',
        data: promediosViento,
        borderColor: colores.viento.border,
        backgroundColor: colores.viento.background,
        tension: 0.4,
        fill: true,
        borderWidth: 2
      });
    }

    graficoAvanzado = new Chart(graficoAvanzadoCtx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: datasets
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--white'),
              font: { size: 12 }
            }
          },
          title: {
            display: true,
            text: 'Evolución de Variables Ambientales - Promedios Diarios',
            color: getComputedStyle(document.body).getPropertyValue('--white'),
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--muted'),
              maxRotation: 45
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--muted')
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  // ===== GRÁFICO DE BARRAS COMPARATIVAS =====
  function mostrarGraficoBarras(datos, variables) {
    if (!graficoBarrasCtx) {
      console.error("No se encontró el contexto del gráfico de barras");
      return;
    }

    if (graficoBarras) {
      graficoBarras.destroy();
    }

    // Agrupar datos por fecha
    const datosPorFecha = {};
    datos.forEach(dato => {
      if (!datosPorFecha[dato.fecha]) {
        datosPorFecha[dato.fecha] = [];
      }
      datosPorFecha[dato.fecha].push(dato);
    });

    const fechas = Object.keys(datosPorFecha).sort();
    const datasets = [];

    const colores = {
      temperatura: '#ff5733',
      humedad: '#33b5ff', 
      precipitacion: '#7a42f4',
      viento: '#00e676'
    };

    variables.forEach((variable, index) => {
      const promedios = fechas.map(fecha => {
        const valores = datosPorFecha[fecha].map(d => Number(d[variable])).filter(v => !isNaN(v));
        return valores.length > 0 ? (valores.reduce((a, b) => a + b, 0) / valores.length) : null;
      });

      let label = '';
      switch(variable) {
        case 'temperatura': label = 'Temp (°C)'; break;
        case 'humedad': label = 'Hum (%)'; break;
        case 'precipitacion': label = 'Prec (mm)'; break;
        case 'viento': label = 'Viento (km/h)'; break;
      }

      datasets.push({
        label: label,
        data: promedios,
        backgroundColor: colores[variable] + '80', // 80 para transparencia
        borderColor: colores[variable],
        borderWidth: 1
      });
    });

    graficoBarras = new Chart(graficoBarrasCtx, {
      type: 'bar',
      data: {
        labels: fechas,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: getComputedStyle(document.body).getPropertyValue('--white')
            }
          },
          title: {
            display: true,
            text: '📊 Comparación entre Días - Vista de Barras',
            color: getComputedStyle(document.body).getPropertyValue('--white'),
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--muted')
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue('--muted')
            }
          }
        }
      }
    });
  }

  // ===== CAMBIO DE VISTA ENTRE GRÁFICOS =====
  function cambiarVistaGrafico() {
    // Obtener variables seleccionadas desde los checkboxes
    const variables = Array.from(document.querySelectorAll('input[name="variables"]:checked'))
      .map(checkbox => checkbox.value);
    
    if (variables.length === 0) {
      alert('Por favor selecciona al menos una variable');
      return;
    }
    
    if (datosActuales.length === 0) {
      alert('No hay datos para mostrar. Ejecuta una consulta primero.');
      return;
    }

    if (vistaActual === 'lineas') {
      // Cambiar a barras
      document.getElementById('seccion-grafico-avanzado').style.display = 'none';
      document.getElementById('seccion-grafico-barras').style.display = 'block';
      vistaActual = 'barras';
      mostrarGraficoBarras(datosActuales, variables);
    } else {
      // Cambiar a líneas
      document.getElementById('seccion-grafico-avanzado').style.display = 'block';
      document.getElementById('seccion-grafico-barras').style.display = 'none';
      vistaActual = 'lineas';
      mostrarGraficoAvanzado(datosActuales, variables);
    }
  }

  // ===== VALIDACIONES =====
  function configurarValidaciones() {
      const fechaInicio = document.getElementById('fecha-inicio');
      const fechaFin = document.getElementById('fecha-fin');
      const variablesCheckboxes = document.querySelectorAll('input[name="variables"]'); 
      const estadisticasCheckboxes = document.querySelectorAll('input[name="stats"]');
      const botonAplicar = document.getElementById('aplicar-consulta');

      function validarFormulario() {
          const fechaInicioVal = fechaInicio.value;
          const fechaFinVal = fechaFin.value;
          const variablesSeleccionadas = Array.from(variablesCheckboxes).some(cb => cb.checked); 
          const estadisticasSeleccionadas = Array.from(estadisticasCheckboxes).some(cb => cb.checked);

          const valido = fechaInicioVal && fechaFinVal && 
                        variablesSeleccionadas &&
                        estadisticasSeleccionadas &&
                        new Date(fechaInicioVal) <= new Date(fechaFinVal);

          botonAplicar.disabled = !valido;
          return valido;
      }

      fechaInicio.addEventListener('change', validarFormulario);
      fechaFin.addEventListener('change', validarFormulario);
      variablesCheckboxes.forEach(cb => {
          cb.addEventListener('change', validarFormulario);
      });
      estadisticasCheckboxes.forEach(cb => {
          cb.addEventListener('change', validarFormulario);
      });

      document.getElementById('select-all-vars').addEventListener('click', (e) => {
          e.stopPropagation();
          seleccionarTodasVariables();
      });

      document.getElementById('clear-vars').addEventListener('click', (e) => {
          e.stopPropagation();
          limpiarVariables();
      });

      inicializarDropdown();

      validarFormulario(); 
  }

  // ===== EXPORTACIÓN =====
  async function exportarCSV() {
    try {
      actualizarEstado('Preparando exportación CSV...');

      let datos = datosActuales;

      if (datos.length === 0) {
        alert('No hay datos para exportar. Ejecuta una consulta primero.');
        return;
      }

      let csv = 'Fecha,Hora,Temperatura (°C),Humedad (%),Estado,Precipitación (mm),Viento (km/h)\n';
      
      datos.forEach(dato => {
        csv += `"${dato.fecha || ''}","${dato.hora || ''}",${dato.temperatura || ''},${dato.humedad || ''},"${dato.estado || ''}",${dato.precipitacion || ''},${dato.viento || ''}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `datos_ambientales_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      actualizarEstado(`CSV exportado correctamente (${datos.length} registros)`);
      
    } catch (error) {
      console.error('Error exportando CSV:', error);
      actualizarEstado(`Error exportando CSV: ${error.message}`);
    }
  }

  async function exportarPDF() {
    try {
      actualizarEstado('Generando PDF...');

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Título
      doc.setFontSize(20);
      doc.setTextColor(55, 136, 234); // Color azul del tema
      doc.text('Reporte de Datos Ambientales', 20, 20);

      // Fecha de generación
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generado el: ${new Date().toLocaleString('es-CR')}`, 20, 30);
      
      // Línea separadora
      doc.setDrawColor(55, 136, 234);
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);

      // Estadísticas
      doc.setFontSize(16);
      doc.setTextColor(55, 136, 234);
      doc.text('Estadísticas del Período', 20, 45);

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let yPos = 55;
      
      // Temperatura
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Temperatura:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`   Máxima: ${document.getElementById('temp-max').textContent}°C`, 20, yPos);
      yPos += 6;
      doc.text(`   Mínima: ${document.getElementById('temp-min').textContent}°C`, 20, yPos);
      yPos += 6;
      doc.text(`   Promedio: ${document.getElementById('temp-prom').textContent}°C`, 20, yPos);
      yPos += 10;

      // Humedad
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Humedad:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`   Máxima: ${document.getElementById('hum-max').textContent}%`, 20, yPos);
      yPos += 6;
      doc.text(`   Mínima: ${document.getElementById('hum-min').textContent}%`, 20, yPos);
      yPos += 6;
      doc.text(`   Promedio: ${document.getElementById('hum-prom').textContent}%`, 20, yPos);
      yPos += 10;

      // Precipitación
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Precipitación:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`   Máxima: ${document.getElementById('prec-max').textContent} mm`, 20, yPos);
      yPos += 6;
      doc.text(`   Mínima: ${document.getElementById('prec-min').textContent} mm`, 20, yPos);
      yPos += 6;
      doc.text(`   Promedio: ${document.getElementById('prec-prom').textContent} mm`, 20, yPos);
      yPos += 10;

      // Viento
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Viento:', 20, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`   Máximo: ${document.getElementById('viento-max').textContent} km/h`, 20, yPos);
      yPos += 6;
      doc.text(`   Mínimo: ${document.getElementById('viento-min').textContent} km/h`, 20, yPos);
      yPos += 6;
      doc.text(`   Promedio: ${document.getElementById('viento-prom').textContent} km/h`, 20, yPos);

      // Agregar gráfico si existe
      if (graficoAvanzado || graficoBarras) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(55, 136, 234);
        doc.text('Gráfico de Datos', 20, 20);
        
        // Línea separadora
        doc.setDrawColor(55, 136, 234);
        doc.line(20, 25, 190, 25);
        
        const canvas = vistaActual === 'lineas' ? 
          document.getElementById('graficoAvanzado') : 
          document.getElementById('graficoBarras');
          
        if (canvas) {
          try {
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 15, 35, 180, 120);
          } catch (error) {
            console.error('Error al capturar gráfico:', error);
            doc.setFontSize(10);
            doc.setTextColor(255, 0, 0);
            doc.text('Error al capturar el gráfico', 20, 40);
          }
        }
      }

      // Resumen del Dataset
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(55, 136, 234);
      doc.text('Resumen del Dataset', 20, 20);
      
      // Línea separadora
      doc.setDrawColor(55, 136, 234);
      doc.line(20, 25, 190, 25);
      
      if (datosActuales.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        // Total de registros
        doc.setFont(undefined, 'bold');
        doc.text('Total de registros:', 20, 35);
        doc.setFont(undefined, 'normal');
        doc.text(datosActuales.length.toString(), 70, 35);
        
        // Período
        doc.setFont(undefined, 'bold');
        doc.text('Período:', 20, 45);
        doc.setFont(undefined, 'normal');
        const periodoTexto = `${datosActuales[0].fecha} al ${datosActuales[datosActuales.length - 1].fecha}`;
        doc.text(periodoTexto, 70, 45);
        
        // Variables analizadas - CORRECCIÓN AQUÍ
        doc.setFont(undefined, 'bold');
        doc.text('Variables analizadas:', 20, 55);
        doc.setFont(undefined, 'normal');
        
        const variablesSeleccionadas = Array.from(document.querySelectorAll('input[name="variables"]:checked'))
          .map(cb => {
            switch(cb.value) {
              case 'temperatura': return 'Temperatura';
              case 'humedad': return 'Humedad';
              case 'precipitacion': return 'Precipitación';
              case 'viento': return 'Viento';
              default: return cb.value;
            }
          });
        
        doc.text(`${variablesSeleccionadas.length} variables`, 70, 55);
        
        // Listar las variables
        let yPosVar = 65;
        variablesSeleccionadas.forEach(variable => {
          doc.text(`• ${variable}`, 25, yPosVar);
          yPosVar += 7;
        });
        
        // Información adicional
        yPosVar += 5;
        doc.setFont(undefined, 'bold');
        doc.text('Tipo de vista:', 20, yPosVar);
        doc.setFont(undefined, 'normal');
        doc.text(vistaActual === 'lineas' ? 'Gráfico de líneas' : 'Gráfico de barras', 70, yPosVar);
      } else {
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('No hay datos disponibles para mostrar en el resumen.', 20, 35);
      }

      // Pie de página en todas las páginas
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Sistema de Monitoreo Ambiental - Página ${i} de ${totalPages}`, 20, 285);
        doc.text(`Generado automáticamente`, 150, 285);
      }

      // Guardar el PDF
      doc.save(`reporte_ambiental_${new Date().toISOString().split('T')[0]}.pdf`);
      
      actualizarEstado('✅ PDF exportado correctamente');
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      actualizarEstado(`❌ Error exportando PDF: ${error.message}`);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
    }
  }

  // ===== ARCHIVO DE MUESTRA =====
  async function generarCSVCompleto() {
    actualizarEstado('Generando archivo de muestra...');
    
    const datos = [];
    const ahora = new Date();
    
    for (let d = 0; d < 10; d++) {
      const fechaBase = new Date(ahora);
      fechaBase.setDate(ahora.getDate() - d - 1);

      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
          const horaActual = new Date(fechaBase);
          horaActual.setHours(h, m, 0, 0);
          datos.push(generarClimaSintetico(horaActual));
        }
      }
    }

    let csv = 'Fecha,Hora,Temperatura (°C),Humedad (%),Estado,Precipitación (mm),Viento (km/h)\n';
    datos.forEach(dato => {
      csv += `"${dato.fecha}","${dato.hora}",${dato.temperatura},${dato.humedad},"${dato.estado}",${dato.precipitacion},${dato.viento}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'dataset_ambiental_muestra_10dias.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    actualizarEstado(' Archivo de muestra generado (10 días, cada 30 min)');
  }
    // Función para inicializar el dropdown
  function inicializarDropdown() {
      const toggle = document.getElementById('variables-toggle');
      const menu = document.getElementById('variables-menu');
      const checkboxes = document.querySelectorAll('input[name="variables"]');

      // Toggle del dropdown
      toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownAbierto = !dropdownAbierto;
          toggle.parentElement.classList.toggle('active', dropdownAbierto);
      });

      // Cerrar dropdown al hacer clic fuera
      document.addEventListener('click', (e) => {
          if (!toggle.contains(e.target) && !menu.contains(e.target)) {
              dropdownAbierto = false;
              toggle.parentElement.classList.remove('active');
          }
      });

      // Actualizar texto del botón cuando cambien las selecciones
      checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', actualizarTextoDropdown);
      });

      // Inicializar texto
      actualizarTextoDropdown();
  }

  // Función para actualizar el texto del dropdown
  function actualizarTextoDropdown() {
      const checkboxes = document.querySelectorAll('input[name="variables"]:checked');
      const toggle = document.getElementById('variables-toggle');
      const selectedText = toggle.querySelector('.selected-text');

      if (checkboxes.length === 0) {
          selectedText.textContent = 'Seleccionar variables...';
      } else if (checkboxes.length === 4) {
          selectedText.textContent = 'Todas las variables';
      } else {
          const nombres = Array.from(checkboxes).map(cb => {
              switch(cb.value) {
                  case 'temperatura': return 'Temp';
                  case 'humedad': return 'Hum';
                  case 'precipitacion': return 'Prec';
                  case 'viento': return 'Viento';
                  default: return cb.value;
              }
          });
          selectedText.textContent = nombres.join(', ');
      }
  }

  // Función para seleccionar todas las variables
  function seleccionarTodasVariables() {
      document.querySelectorAll('input[name="variables"]').forEach(checkbox => {
          checkbox.checked = true;
      });
      actualizarTextoDropdown();
      document.querySelector('input[name="variables"]').dispatchEvent(new Event('change'));
  }

  // Función para limpiar selección de variables
  function limpiarVariables() {
      document.querySelectorAll('input[name="variables"]').forEach(checkbox => {
          checkbox.checked = false;
      });
      actualizarTextoDropdown();
      document.querySelector('input[name="variables"]').dispatchEvent(new Event('change'));
  }

  // ===== UTILIDADES =====
  function actualizarEstado(mensaje) {
    document.getElementById('estado-firebase').innerHTML = mensaje;
  }

  // ===== INICIALIZACIÓN =====
  function init() {
    // Inicializar fechas
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    let mm = hoy.getMonth() + 1;
    let dd = hoy.getDate();
    if (mm < 10) mm = "0" + mm;
    if (dd < 10) dd = "0" + dd;
    fechaInput.value = `${yyyy}-${mm}-${dd}`;

    // Inicializar rango de fechas (últimos 7 días)
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaFin.getDate() - 7);
    
    document.getElementById('fecha-inicio').value = fechaInicio.toISOString().split('T')[0];
    document.getElementById('fecha-fin').value = fechaFin.toISOString().split('T')[0];

    // Inicializar hora actual
    document.getElementById('hora-especifica').value = 
      `${hoy.getHours().toString().padStart(2, '0')}:${hoy.getMinutes().toString().padStart(2, '0')}`;

    selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    renderCalendar();
    updateWeatherPanel(selectedDate);
    actualizarClima(selectedDate);

    // Event listeners
    prevBtn.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      renderCalendar();
    });

    // Event listeners para botones
    document.getElementById('btn-csv').addEventListener('click', exportarCSV);
    document.getElementById('btn-pdf').addEventListener('click', exportarPDF);
    document.getElementById('aplicar-consulta').addEventListener('click', aplicarConsultaAvanzada);
   // document.getElementById('btn-generar-datos').addEventListener('click', generarDatasetCompleto);
   // document.getElementById('btn-exportar-muestra').addEventListener('click', generarCSVCompleto);
    document.getElementById('btn-cambiar-vista').addEventListener('click', cambiarVistaGrafico);
    document.getElementById('btn-cambiar-lineas').addEventListener('click', cambiarVistaGrafico);

    configurarValidaciones();

    

    // Ocultar secciones de gráficos inicialmente
    document.getElementById('seccion-grafico-avanzado').style.display = 'none';
    document.getElementById('seccion-grafico-barras').style.display = 'none';

    actualizarEstado('Sistema inicializado correctamente. Listo para consultas.');
    console.log("Aplicación inicializada correctamente");
  }

  // Inicialización
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Modo claro
  const btn = document.getElementById("toggle-ligth");
  btn.addEventListener('click', () => {
    document.body.classList.toggle('ligth-mode');
    // Cambia texto e icono
    const label = btn.querySelector('.label');
    const icon = btn.querySelector('.icon');
    const width = btn.querySelector(".whi")
    const esClaro = document.body.classList.contains('ligth-mode');
    if (esClaro) {
      label.textContent = "Modo oscuro";
      icon.textContent = "🌙";
    } else {
     label.textContent = "Modo claro";
      icon.textContent = "☀️";
    }  
    // Actualizar gráficos cuando cambie el modo
    if (datosActuales.length > 0) {
      const variables = Array.from(document.getElementById('variables-select').selectedOptions)
        .map(option => option.value);
      if (vistaActual === 'lineas') {
        mostrarGraficoAvanzado(datosActuales, variables);
      } else {
        mostrarGraficoBarras(datosActuales, variables);
      }
    }
  });

})();
