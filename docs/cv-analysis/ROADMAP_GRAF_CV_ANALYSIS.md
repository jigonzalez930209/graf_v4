# Roadmap Graf v4 — Análisis Electroquímico (CV, Simulación, IA)

Este documento adapta el roadmap genérico de una app de análisis electroquímico al estado **real** de Graf v4. Está pensado como guía de trabajo para seguir evolucionando el módulo de **Voltametría Cíclica (CV)**, la simulación digital y, más adelante, IA.

Convención de estado:

- ✅ Implementado (ya existe en Graf, al menos en versión útil)
- 🟡 Parcial / mejorable
- ⏳ Pendiente / futuro

Fuentes principales:

- Código en `src/renderer/src/hooks/cv-analysis/`
- Componentes en `src/renderer/src/components/vc-analysis/`
- Documentación en `docs/cv-analysis/`

---

## 🧱 FASE 1 — MVP consolidado

Objetivo: consolidar lo que ya existe para CV (importación, visualización, picos, parámetros clásicos) y dejarlo bien documentado y usable.

### Módulo 1 — Importación y normalización de datos CV

**Objetivo:** llevar cualquier archivo compatible a una estructura estándar `{ potential[], current[], scanRate }` lista para análisis.

- ✅ **Estado actual**
  - Soporte de archivos:
    - `teq4`, `teq4Z`, `csv` (ver `README.md` y hooks `useImportData`, `useData`).
  - Estructura estándar `IProcessFile` con:
    - `content: [ [E, I], ... ]`
    - `voltammeter.scanRate`, `samplesSec`, `range`, etc.
  - Hooks `useCVAnalysis` / `useMultiCVAnalysis` ya extraen `{potential, current}` desde `IProcessFile`.

- 🟡 **Mejoras propuestas**
  - Crear un helper único, p.ej. `toCVData(file: IProcessFile) → { potential, current, scanRate }`, y reutilizarlo en:
    - `useCVAnalysis`
    - `useMultiCVAnalysis`
    - Tabs de derivadas, integrales, fits, etc.
  - Añadir validaciones de entrada:
    - Longitud mínima de datos.
    - Filtros de `NaN` / valores no numéricos.
    - Monotonía del potencial si aplica.

- ⏳ **Extensión a más formatos**
  - Parseadores dedicados para `TXT`, `POT` y CSV “arbitrarios” con mapeo de columnas configurable.
  - Mini asistente en UI para mapear columnas `E`, `I` cuando el CSV no sigue el formato estándar.

---

### Módulo 2 — Visualización interactiva de CV

**Objetivo:** ofrecer gráficos de VC claros, comparables y conectados al análisis.

- ✅ **Estado actual**
  - `curve-plot.tsx` + `vc-dialog.tsx` para visualización de curvas con Plotly.
  - Tabs de análisis (`operations-tab`, `derivate-tab`, `integral-tab`, `fit-tab`) integradas con el contexto de VC.
  - Diálogos avanzados:
    - `scan-rate-dialog.tsx` (correlación con velocidad de barrido).
    - `cv-multi-analysis-dialog/` con múltiples gráficos (Randles-Sevcik, ΔEp, log-log, Laviron, etc.).
  - Hooks de soporte: `usePlotlyOptions`, `useColorsPalette`, etc.

- 🟡 **Mejoras propuestas**
  - Añadir capas visuales “inteligentes” en `curve-plot` cuando haya análisis CV:
    - Serie **raw**.
    - Serie **suavizada** (Savitzky–Golay).
    - Marcadores para picos anódico y catódico.
    - Lazo de histéresis sombreado cuando aplique.
  - Mejorar UX de comparación:
    - Posibilidad de “pinnear” una curva como referencia y comparar otras contra ella.

- ⏳ **Herramientas de medición**
  - Crosshair con lectura exacta de `(E, I)`.
  - Regla interactiva para medir ΔE entre dos puntos.

---

### Módulo 3 — Detección automática de picos

**Objetivo:** detectar Ep,a / Ep,c, Ip,a / Ip,c de forma robusta y configurable.

- ✅ **Estado actual**
  - `helpers/smoothing.ts` usando `savitzkyGolaySmooth` (JS fallback) con validaciones de ventana.
  - `helpers/peaks.ts` con detección de máximos/mínimos (picos anódico/catódico).
  - Tests unitarios de picos y suavizado (Vitest).
  - `useCVAnalysis` expone `peaks`, `parameters.deltaEp`, etc.

- 🟡 **Mejoras propuestas**
  - Exponer configuración de suavizado en UI:
    - `smooth` on/off.
    - `windowSize`, `polyOrder` con presets.
  - Crear un **“Peak inspector”**:
    - Tabla con `Ep,a`, `Ip,a`, `Ep,c`, `Ip,c`, índice, prominencia.
    - Opción para ajustar manualmente un pico cuando el automático falla.

- ⏳ **Soporte multi-ciclo**
  - Si los datos incluyen varios ciclos, segmentar por ciclo y detectar picos ciclo a ciclo.

---

### Módulo 4 — Parámetros clásicos (Randles–Ševčík)

**Objetivo:** extraer parámetros difusionales (especialmente D) a partir de Ip vs √v.

- ✅ **Estado actual**
  - `helpers/randles.ts` con fórmulas de Randles-Sevcik.
  - `useMultiCVAnalysis` calcula correlaciones `Ip vs √v`.
  - `randles-sevcik-chart.tsx` + sección en `cv-multi-analysis-dialog`.
  - Módulo de diagnóstico de mecanismos ya usa slopes (log-log, etc.).

- 🟡 **Mejoras propuestas**
  - Calcular **D** explícitamente usando slope de `Ip vs √v` + inputs (`n`, `A`, `C`, `T`).
  - UI: tabla con
    - `File`, `v`, `Ip`, `D` estimado, intervalo de confianza.
  - Exportar resultados Randles a JSON/CSV.

---

## 🔬 FASE 2 — Análisis avanzado

Objetivo: extraer cinética (ks, k0, α) y tipo de control (difusión vs adsorción) de forma clara.

### Módulo 5 — Análisis de Laviron

**Objetivo:** obtener α, ks y E0' a partir de Ep vs log(v) / ln(v) para sistemas de cinética lenta.

- ✅ **Estado actual**
  - `helpers/laviron.ts` con lógica específica.
  - Gráfico `laviron-analysis-chart.tsx`.
  - `laviron-kinetics-section.tsx` + sección en el diálogo multi-análisis.
  - `useMultiCVAnalysis` ya calcula `Ep vs ln(v)` y correlaciones.
  - Documentación conceptual en `MECHANISM_DETECTION.md`.

- 🟡 **Mejoras propuestas**
  - Completar cálculo y UI de Laviron:
    - Separar análisis anódico/catódico.
    - Mostrar `α`, `ks`, `E0'` con errores.
    - Panel con:
      - Gráfico Ep vs ln(v).
      - Tabla de regresión (slope, intercept, R²).
      - Mensajes tipo “ΔEp grande → Laviron aplicable”.

- ⏳ **Validaciones de Laviron**
  - Número mínimo de velocidades.
  - Flags cuando ΔEp < umbral (no aplicar Laviron).

---

### Módulo 6 — Nicholson k⁰ (cinética intermedia)

**Objetivo:** estimar k0 a partir de ΔEp y tablas de Nicholson.

- 🟡 **Estado actual**
  - Mencionado en documentación como extensión futura.
  - No hay helpers específicos de Nicholson ni curvas ψ(ΔEp).

- ⏳ **Tareas propuestas**
  - Implementar helper Nicholson:
    - Tabla discreta de ψ(ΔEp) + interpolación.
    - Cálculo de `k0` a partir de ψ y parámetros experimentales.
  - UI Nicholson:
    - Gráfico ΔEp vs v.
    - Tabla con `ΔEp`, `ψ`, `k0` por archivo.
    - Badge en resumen: “región cinética intermedia (Nicholson)”.

---

### Módulo 7 — Control: difusión vs adsorción

**Objetivo:** determinar si el proceso está controlado por difusión o por adsorción.

- ✅ **Estado actual**
  - `helpers/diagnostics.ts` + `MECHANISM_DETECTION.md`:
    - Slope log(Ip) vs log(v) ≈ 0.5 → difusión.
    - Slope log(Ip) vs log(v) ≈ 1.0 → adsorción.
  - `useMultiCVAnalysis` ya calcula las regresiones necesarias.
  - Tab de integrales (`integral-tab.tsx`) + tabla de áreas (`integral-results-table.tsx`).

- 🟡 **Mejoras propuestas**
  - Conectar q = ∫I dt (áreas) con el diagnóstico del mecanismo:
    - Ver si el área del pico se mantiene (adsorción) o escala con √v (difusión).
  - UI explícita:
    - Gráfico `Ip vs v` (adsorción).
    - Gráfico `Ip vs √v` (difusión).
    - Mensaje automático: “lineal en v → adsorción”, “lineal en √v → difusión”.

- ⏳ **Resumen de control**
  - Badge en el resumen ejecutivo: `Control: difusión`, `Control: adsorción`, `Mixto`.

---

### Módulo 8 — Clasificación de “simplicidad del mecanismo”

**Objetivo:** etiquetar E, EC, CE, ECE, reversible/quasi/irreversible, etc.

- ✅ **Estado actual**
  - `helpers/diagnostics.ts` + `MECHANISM_DETECTION.md` implementan un clasificador basado en reglas:
    - Usa ΔEp, histéresis, presencia/ausencia de pico catódico, slopes, etc.
    - Mecanismos actuales: `diffusion`, `adsorption`, `EC`, `kinetic`, `unknown`.

- 🟡 **Mejoras propuestas**
  - Formalizar reglas tipo “semáforo” en código + UI:
    - ΔEp ≈ 59/n mV → reversible.
    - ΔEp > 100 mV → quasi irreversible.
    - ΔEp > 200 mV → irreversible.
  - Mostrar estas etiquetas en `executive-summary-section.tsx`.

- ⏳ **Extender mecanismos y resumen global**
  - Reglas adicionales para:
    - `ECE` (pendientes anómalas, picos múltiples deformados).
    - “Dispersión del electrodo” (ΔEp irregular entre ciclos/archivos).
  - En `cv-multi-analysis-dialog`: mecanismo global + explicación (basado en `diagnostics.notes`).

---

## ⚙️ FASE 3 — Simulación digital (1D + ajuste)

Objetivo: simular CV digitalmente (difusión semi-infinita + Butler–Volmer) y ajustar parámetros a curvas experimentales.

### Módulo 9 — Simulación 1D (difusión + Butler–Volmer)

**Objetivo:** generar CV simuladas para comparar con datos experimentales.

- 🟡 **Estado actual**
  - Existe `math-lib` en Rust, usado para utilidades numéricas.
  - Parte del código de smoothing/derivadas en Rust está deshabilitado (dependencias previas).
  - Aún no hay un solver explícito de difusión 1D para CV.

- ⏳ **Tareas propuestas**
  - Diseño del módulo numérico en `math-lib`:
    - Mallado 1D en x.
    - Esquema Crank–Nicolson para `∂C/∂t = D ∂²C/∂x²`.
    - Condiciones de contorno + Butler–Volmer en la superficie del electrodo.
  - Exponer una API WASM:
    - `simulateCV(params) → { potential[], current[] }`.
  - Nuevo diálogo “Digital Simulation” en la UI:
    - Inputs: `D`, `ks`, `α`, `kf`, `kb`, `Cbulk`, `A`, ruido.
    - Gráficos:
      - Curva experimental.
      - Curva simulada.
      - Error (residuo).

---

### Módulo 10 — Ajuste automático modelo ↔ experimental

**Objetivo:** ajustar D, ks, α, etc. para minimizar el error entre simulación y experimento.

- ❌ **Estado actual**
  - No hay aún optimizador dedicado para CV (solo fits polinomiales en el `fit-tab`).

- ⏳ **Tareas propuestas**
  - Fase 1 — “ajuste manual asistido”:
    - Sliders para D, ks, α, etc. con recalculo rápido de la simulación.
    - Métricas de error: RMSE, χ², etc.
  - Fase 2 — “auto-fit”:
    - Implementar un optimizador (p.ej. Levenberg-Marquardt o GA) en TS o Rust.
    - Output: D, ks, α + intervalo de confianza + diagnóstico de mejor mecanismo.

---

## 🧠 FASE 4 — IA y automatización

Objetivo: pasar de un análisis asistido por reglas a un análisis semiautomático/automático con ML.

### Módulo 11 — Clasificador de mecanismos basado en ML

**Objetivo:** entrenar un modelo que clasifique mecanismos a partir de features CV.

- ✅ **Base actual**
  - Clasificador basado en reglas (`helpers/diagnostics.ts`) usando:
    - ΔEp.
    - Slope log(Ip) vs log(v).
    - Área de histéresis.
    - Presencia/ausencia de pico catódico.

- ⏳ **Tareas propuestas**
  - Construir un **dataset de entrenamiento**:
    - Exportar features por CV (ΔEp, Ip,a/Ip,c, slopes, histéresis, etc.).
    - Añadir etiquetas manuales (mecanismo real esperado: E, EC, CE, ECE, etc.).
  - Entrenar un modelo ML offline (Python / Scikit / etc.).
  - Exportar el modelo (p.ej. a JSON) e integrarlo en el cliente:
    - API: `mlPredictMechanism(features) → { mechanism, probabilities }`.
  - Combinar predicción ML + reglas actuales para robustez.

---

### Módulo 12 — Pipeline totalmente automático (“One-click analysis”)

**Objetivo:** que el usuario envíe un conjunto de CV y la app devuelva todo el paquete de resultados.

- 🟡 **Piezas ya disponibles**
  - Picos, ΔEp, histéresis, D (Randles, una vez expuesto), diagnóstico de mecanismo, análisis multi-scan, helpers Laviron y futuras extensiones Nicholson.

- ⏳ **Tareas propuestas**
  - Nuevo botón “Analizar CVs seleccionadas” en la UI principal de VC:
    - Ejecuta en cadena:
      - `useMultiCVAnalysis` + Randles + Laviron + (Nicholson cuando esté).
    - Devuelve un “paquete” de resultados con:
      - Mecanismo global.
      - `k0`, `ks`, `α`, `D` cuando apliquen.
      - Clasificación difusión/adsorción.
      - Indicadores de EC/ECE/dispersión.
  - Vista tipo “informe” (PDF/HTML o sección especial) con resumen ejecutivo + tablas + gráficos clave.
  - Integrar el clasificador ML cuando esté listo para que refine/valide los diagnósticos.

---

## Prioridades sugeridas

### Corto plazo (1–3 semanas)

- **Randles-Sevcik:** exponer D en la UI (tablas + export).
- **Laviron:** completar cálculo y presentación de α, ks, E0'.
- **Control difusión/adsorción:** conectar integrales + vistas Ip vs v / Ip vs √v con diagnóstico claro.

### Medio plazo (1–2 meses)

- Implementar Nicholson k0 (helpers + UI).
- Consolidar un “mecanismo global” en `cv-multi-analysis-dialog` (resumen ejecutivo).
- Empezar la infraestructura numérica de simulación 1D en `math-lib`.

### Largo plazo

- Simulación digital completa + auto-fit de parámetros.
- Clasificador ML + pipeline de análisis completamente automatizado.

---

Este archivo sirve como hoja de ruta viva: a medida que se implementen módulos, conviene ir actualizando estados (✅/🟡/⏳) y añadiendo referencias a PRs, tests y decisiones de diseño relevantes.
