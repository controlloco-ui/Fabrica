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

## Fábrica Tycoon — juego tipo tycoon (`tycoon/`)

Juego estilo tycoon de Roblox para el móvil (abre `tycoon/index.html` o instala el APK de la release `tycoon-latest`, que compila `.github/workflows/tycoon-apk.yml`).

- **Vista 2.5D** con cámara inclinada (ángulo cenital, medio o bajo), sombras suaves, luz de ventanas, humo y máquinas en 3D. Fábrica grande con zona de producción, zona de máquinas y **zona de descanso** para decorar.
- **Menú**: pantalla de título con continuar, nueva partida y cargar (3 ranuras), guardar, opciones y salir.
- **Personaje** mujer u hombre con vista de frente, espalda y perfil, **física** (rebote del cuerpo, pelo y falda) y 11 barras de físico (incluye glúteos). Ropa por nivel y dinero: pantalones, pitillo, ancho, shorts, minishorts, microshorts, faldas (larga, midi, tubo, plisada, mini, micro), bikini, bañador, vestidos, tops y más.
- **5 fábricas** con 3 cintas cada una: dispensadores, escáner láser ×2, duplicador y prensa hidráulica ×3, más 5 **máquinas independientes** con 10 niveles (mina, imprenta de billetes, servidores, planta solar y brazo robótico).
- **Tienda**: 21 muebles que se colocan libremente (arrastrar, girar, cambiar color), 14 suelos (fábrica y zona de descanso por separado), 12 muros, cintas personalizables (dibujo, colores y brillo) y hornos.
- **Mejoras** por nivel y dinero (velocidad, trabajadores, automatización hasta auto-compra, ingeniería, valor, suerte, imán…), misiones, cofre, ruleta, eventos y renacimientos.
- **Controles**: joystick flotante o fijo con carrera, impulso, toque para ir andando, pellizco para zoom y arrastre con dos dedos para mover la cámara.
