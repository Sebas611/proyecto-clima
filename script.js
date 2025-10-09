// script.js
(function () {
  // Utils
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-index
  let selectedDate = null;

  const grid = document.getElementById('calendar-grid');
  const title = document.getElementById('month-year');
  const prevBtn = document.getElementById('prev-month');
  const nextBtn = document.getElementById('next-month');

  const selDateEl = document.getElementById('selected-date');
  const tempEl = document.getElementById('temp');
  const descEl = document.getElementById('desc');
  const precEl = document.getElementById('prec');
  const windEl = document.getElementById('wind');
  const iconEl = document.getElementById('weather-icon');

    // Referencias a elementos del DOM
    const fechaInput = document.getElementById('fecha');
    const humedadEl = document.getElementById('humedad');
    const estadoEl = document.getElementById('estado');
    const graficoCanvas = document.getElementById('graficoTemp').getContext('2d');

    let grafico; // Para el gráfico de Chart.js

    // Función para generar datos sintéticos según la fecha
    function generarClimaSintetico(fecha) {
        const seed = fecha.getDate() + fecha.getMonth() + fecha.getFullYear();
        
        // Temperaturas diarias (mañana, media mañana, mediodía, tarde, noche)
        const horas = [6, 9, 12, 15, 18, 21];
        const temperaturas = horas.map((h, i) => {
            // Base: temperatura promedio
            let base = 18 + i*2 + (seed % 5); // 18°C por la mañana, sube hasta 30°C
            return base + Math.floor(Math.random() * 3); // Variación +/- 2°C
        });

        // Humedad sintética (40% - 90%)
        const humedad = 40 + (seed % 50);

        // Estado del cielo según precipitación aleatoria
        const estados = ["Soleado", "Parcialmente nublado", "Nublado", "Lluvioso"];
        const estado = estados[seed % estados.length];

        return {
            temperaturas,
            humedad,
            estado,
            horas
        };
    }

    // Función para actualizar los datos de clima
    function actualizarClima(fecha) {
        const clima = generarClimaSintetico(fecha);
        
        tempEl.textContent = clima.temperaturas[2] + " °C"; // temperatura al mediodía como ejemplo
        humedadEl.textContent = clima.humedad + " %";
        estadoEl.textContent = clima.estado;

        // Si el gráfico ya existe, lo destruimos antes de crear uno nuevo
        if (grafico) grafico.destroy();

        // Crear gráfico de líneas con Chart.js
        grafico = new Chart(graficoCanvas, {
            type: 'line',
            data: {
                labels: clima.horas.map(h => h + ":00"),
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: clima.temperaturas,
                    borderColor: 'rgba(74, 144, 226, 1)',
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: 15,
                        suggestedMax: 35
                    }
                }
            }
        });
    }

    // Evento: cuando se selecciona una fecha
    fechaInput.addEventListener('change', () => {
        const fecha = new Date(fechaInput.value);
        if (fecha.toString() !== "Invalid Date") {
            actualizarClima(fecha);
        }
    });

    // Inicializar con fecha actual
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    let mm = hoy.getMonth() + 1; // Mes: 1-12
    let dd = hoy.getDate();
    if (mm < 10) mm = "0" + mm;
    if (dd < 10) dd = "0" + dd;
    fechaInput.value = `${yyyy}-${mm}-${dd}`;
    actualizarClima(hoy);

  // Deterministic pseudo-random from string (simple hash)
  function hashToSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return (h >>> 0) / 0xffffffff;
  }

  function generateSyntheticWeather(date) {
    // date: Date object
    const key = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
    const seed = hashToSeed(key);
    // Temperature range depends on seed and month (simple seasonal bias)
    const month = date.getMonth();
    const baseByMonth = [23,23,24,24,24,24,25,25,24,23,23,23]; // ejemplo Costa Rica (suave)
    const variance = (seed * 10) - 5; // -5..+5
    const temperature = Math.round(baseByMonth[month] + variance);

    // Precipitation chance (higher during some months)
    const rainBase = [20,20,30,40,50,60,70,60,50,40,30,25]; // ejemplo
    const precip = Math.round(Math.min(95, Math.max(0, rainBase[month] + (seed*40 - 20))));

    // Wind 0-30 km/h
    const wind = Math.round(seed * 30);

    // Simple description and icon selection
    const raininess = precip > 65 ? 'Lluvioso' : (precip > 35 ? 'Parcial lluvia' : 'Mayormente seco');
    const iconType = precip > 65 ? 'rain' : (precip > 35 ? 'cloud-rain' : 'sun');

    return {
      temperature,
      precip,
      wind,
      desc: raininess,
      icon: iconType
    };
  }

  // Small inline SVG icons
  function iconSVG(type) {
    if (type === 'rain') {
      return `<svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 40c-4-4-2-10 3-12 2-6 8-10 16-8 6 2 9 7 9 12" />
          <path d="M25 49l-3 6" />
          <path d="M32 49l-3 6" />
          <path d="M44 49l-3 6" />
        </g>
      </svg>`;
    } else if (type === 'cloud-rain') {
      return `<svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M22 30c-3-1-3-6 1-8 3-3 9-4 13-2 6 2 8 6 8 10" />
          <path d="M25 44l-2 5" />
          <path d="M33 44l-2 5" />
        </g>
      </svg>`;
    } else {
      return `<svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g fill="currentColor">
          <circle cx="32" cy="24" r="8" />
        </g>
        <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M32 8v-4" />
          <path d="M32 56v-4" />
          <path d="M48 32h4" />
          <path d="M12 32h4" />
          <path d="M45 13l2-2" />
          <path d="M17 51l2-2" />
          <path d="M45 51l2 2" />
          <path d="M17 13l2 2" />
        </g>
      </svg>`;
    }
  }

  // Render calendar grid for viewMonth/viewYear
  function renderCalendar() {
    grid.innerHTML = '';
    title.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startDay = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    // Find date of first cell (may be previous month's days)
    const firstCellDate = new Date(viewYear, viewMonth, 1 - startDay);

    // 6 rows x 7 cols = 42 cells (covers all months)
    for (let i = 0; i < 42; i++) {
      const d = new Date(firstCellDate.getFullYear(), firstCellDate.getMonth(), firstCellDate.getDate() + i);
      const cell = document.createElement('div');
      cell.className = 'day';
      cell.setAttribute('role','gridcell');
      // mark muted days (not this month)
      if (d.getMonth() !== viewMonth) cell.classList.add('muted');
      // mark today
      if (d.toDateString() === (new Date()).toDateString()) cell.classList.add('today');

      const num = document.createElement('div');
      num.className = 'date-num';
      num.textContent = d.getDate();
      cell.appendChild(num);

      const meta = document.createElement('div');
      meta.className = 'meta';
      // small preview: show synthetic temp as hint
      const preview = generateSyntheticWeather(d);
      meta.textContent = `${preview.temperature}°C • ${preview.desc}`;
      cell.appendChild(meta);

      // data attributes
      cell.dataset.date = d.toISOString();

      // click handler
      cell.addEventListener('click', () => {
        // clear previous
        const prev = grid.querySelector('.day.selected');
        if (prev) prev.classList.remove('selected');
        cell.classList.add('selected');
        selectedDate = d;
        updateWeatherPanel(d);
      });

      grid.appendChild(cell);
    }

    // If selectedDate is in current view, highlight it
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
    const w = generateSyntheticWeather(date);
    const fmt = date.toLocaleDateString('es-CR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    selDateEl.textContent = fmt.charAt(0).toUpperCase() + fmt.slice(1);
    tempEl.textContent = `${w.temperature} °C`;
    descEl.textContent = w.desc;
    precEl.textContent = `Precip: ${w.precip}%`;
    windEl.textContent = `Viento: ${w.wind} km/h`;
    iconEl.innerHTML = iconSVG(w.icon);
  }

  // Buttons
  prevBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  // Init
  function init() {
    // default selected: today
    selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    renderCalendar();
    updateWeatherPanel(selectedDate);
  }

  // keyboard accessibility: arrow keys move selection (left/right day)
  document.addEventListener('keydown', (ev) => {
    if (!selectedDate) return;
    if (ev.key === 'ArrowLeft') { selectedDate.setDate(selectedDate.getDate() - 1); viewMonth = selectedDate.getMonth(); viewYear = selectedDate.getFullYear(); renderCalendar(); updateWeatherPanel(selectedDate); }
    if (ev.key === 'ArrowRight') { selectedDate.setDate(selectedDate.getDate() + 1); viewMonth = selectedDate.getMonth(); viewYear = selectedDate.getFullYear(); renderCalendar(); updateWeatherPanel(selectedDate); }
    if (ev.key === 'ArrowUp') { selectedDate.setDate(selectedDate.getDate() - 7); viewMonth = selectedDate.getMonth(); viewYear = selectedDate.getFullYear(); renderCalendar(); updateWeatherPanel(selectedDate); }
    if (ev.key === 'ArrowDown') { selectedDate.setDate(selectedDate.getDate() + 7); viewMonth = selectedDate.getMonth(); viewYear = selectedDate.getFullYear(); renderCalendar(); updateWeatherPanel(selectedDate); }
  });

  init();
})();
