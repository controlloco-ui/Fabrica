# Fabrica
Stock

## Zancada — app de entrenamiento para runners (`runner/`)

PWA instalable y sin conexión (abre `runner/index.html`). Los datos se guardan en el dispositivo (con exportar/importar JSON).

- **Hoy**: entreno del día, semana con cumplimiento, km semana/mes, cuenta atrás a la carrera, ratio de carga aguda:crónica (riesgo de lesión) y consejo diario.
- **Correr**: seguimiento GPS (distancia, ritmo actual/medio, parciales por km con aviso por voz, recorrido) con avisos por voz configurables (cada distancia o tiempo), ritmo objetivo y meta; y constructor de sesiones de series: bloques con repeticiones, trabajo y recuperación por tiempo o distancia (m/km), ritmo objetivo por tramo, entrenador de ritmo por voz, sesiones guardadas y resultados por serie.
- **Mapa y resumen**: mapa en vivo con OpenStreetMap (Leaflet, incluido en `runner/vendor/`, capa satélite opcional) y, al terminar, resumen con el recorrido coloreado por ritmo, marcas por km, tiempo en movimiento, desnivel, calorías, gráfico de parciales, *negative split* y puntuación de efectividad (meta/plan, ritmo objetivo y regularidad). Exportación GPX para Strava, Garmin o Google Earth.
- **Pantalla apagada (Android)**: un servicio en primer plano mantiene GPS, cronómetro, series, voz (bajando el volumen de la música) y pitidos con la pantalla bloqueada, con una notificación que muestra el progreso.
- **Plan**: generador de planes 5K / 10K / media / maratón según nivel, días por semana, volumen actual y fecha de carrera. Periodización base → construcción → específico → taper, progresión ≤ 10 %, descarga cada 4 semanas, 80/20, fuerza incluida.
- **Diario**: registro con RPE, FC, zapatillas y notas; estadísticas (volumen semanal, distribución por intensidad, mejores marcas) y control de kilometraje de zapatillas.
- **Calcular**: VDOT de Daniels con ritmos E/M/T/I/R y predicción de marcas (y Riegel), ritmo/tiempo/distancia, zonas de FC (Karvonen + Tanaka), parciales con negative split, nutrición e hidratación en carrera, conversor ritmo/velocidad.
- **Guía**: principios, tipos de entreno, calentamiento, fuerza, prevención de lesiones, nutrición, técnica y checklist de carrera, con fuentes.

## Bot de inversión automatizado (`trading-bot/`)

Bot que invierte en ETFs vía Alpaca con filtro de tendencia, programado en GitHub Actions. Empieza en modo simulación/práctica. Ver [`trading-bot/README.md`](trading-bot/README.md).
