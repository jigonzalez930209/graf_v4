# Mecanismo de Detección de Mecanismos Electroquímicos

## 🔍 Visión General

El algoritmo de diagnóstico automático analiza múltiples parámetros electroquímicos para identificar el mecanismo de reacción subyacente. Utiliza un enfoque **multi-criterio** que combina:

1. **Pendiente log(Ip) vs log(v)** - Indica el tipo de control (difusión vs adsorción)
2. **ΔEp (Peak Separation)** - Mide la reversibilidad del proceso
3. **Histéresis (Área del lazo)** - Detecta mecanismos acoplados
4. **Presencia/ausencia de picos** - Identifica reacciones incompletas

---

## 📊 Criterios de Diagnóstico

### 1. **DIFFUSION** (Control Difusional)

**Condiciones:**

```
✓ Pendiente log(Ip) vs log(v) ≈ 0.5 (±0.15)
✓ ΔEp < 80 mV (reversible)
✓ Ambos picos presentes (anódico + catódico)
✓ Histéresis baja (< 1e-6 A·V)
```

**Ecuación de Randles-Sevcik:**

```
Ip = 0.4463 × n × F × A × C × √(n × F × v / R × T)
```

**Confianza:** 0.75 - 0.80

**Notas del algoritmo:**

- "Pendiente log(ip)-log(v) ≈ 0.5 indica control difusional (Randles-Sevcik)."
- "ΔEp cercano a 59/n mV consistente con sistema reversible controlado por difusión."

**Ejemplo:**

```
Slope (log-log) = 0.48
ΔEp = 0.065 V (65 mV)
Hysteresis = 5e-7 A·V
→ DIFFUSION (80% confianza)
```

---

### 2. **ADSORPTION** (Especie Adsorbida)

**Condiciones:**

```
✓ Pendiente log(Ip) vs log(v) ≈ 1.0 (±0.15)
✓ ΔEp variable (puede ser alto)
✓ Ambos picos presentes
✓ Histéresis moderada
```

**Comportamiento:**

- La corriente es proporcional a v (no √v)
- Indica que la especie está adsorbida en el electrodo
- Menos dependencia de difusión

**Confianza:** 0.85

**Notas del algoritmo:**

- "Pendiente log(ip)-log(v) ≈ 1 sugiere especie adsorbida."

**Ejemplo:**

```
Slope (log-log) = 0.98
ΔEp = 0.12 V (120 mV)
Hysteresis = 1.5e-6 A·V
→ ADSORPTION (85% confianza)
```

---

### 3. **KINETIC** (Control Cinético)

**Condiciones:**

```
✓ ΔEp > 120 mV (irreversible)
✓ Picos bien separados
✓ Puede haber pendiente anómala
```

**Comportamiento:**

- La reacción es lenta (cinética controlada)
- Transferencia de electrones lenta
- Sigue ecuación de Laviron

**Ecuación de Laviron:**

```
Ep = E° + (RT/αnF) × ln(k°) + (RT/αnF) × ln(v)
```

**Confianza:** 0.70

**Notas del algoritmo:**

- "ΔEp grande indica cinética lenta / casi irreversible (Laviron)."

**Ejemplo:**

```
ΔEp = 0.18 V (180 mV)
Slope (log-log) = 0.45
→ KINETIC (70% confianza)
```

---

### 4. **EC** (Mecanismo Acoplado Electroquímico-Químico)

**Condiciones:**

```
✓ Ausencia de pico catódico
✓ Histéresis ALTA (> 1e-6 A·V)
✓ Solo pico anódico visible
```

**Comportamiento:**

- Reacción electroquímica seguida de reacción química
- El producto no se reduce (no hay pico catódico)
- Ejemplo: E + A → B (B no se reduce)

**Confianza:** 0.75

**Notas del algoritmo:**

- "Ausencia de pico catódico + histéresis alta → posible mecanismo EC rápido."

**Ejemplo:**

```
Picos: Solo anódico (Ep,a = 0.5 V, Ip,a = 1e-5 A)
Catódico: AUSENTE
Hysteresis = 5e-6 A·V (ALTA)
→ EC (75% confianza)
```

---

### 5. **ECE** (Mecanismo Acoplado Electroquímico-Químico-Electroquímico)

**Condiciones:**

```
✓ Pendiente anómala (0.3 - 0.4)
✓ Histéresis muy alta
✓ Picos múltiples o deformados
```

**Comportamiento:**

- Reacción electroquímica → Reacción química → Reacción electroquímica
- Ejemplo: E + A → B → C (donde C se reduce a potencial diferente)

**Confianza:** 0.60 - 0.70

**Notas del algoritmo:**

- (Actualmente no detectado explícitamente, requiere análisis más complejo)

---

### 6. **UNKNOWN** (Mecanismo No Identificado)

**Condiciones:**

```
✓ Pendiente anómala (< 0.3 o > 1.2)
✓ Datos insuficientes
✓ Parámetros contradictorios
```

**Confianza:** 0.40 (por defecto)

**Notas del algoritmo:**

- "Datos insuficientes para un diagnóstico concluyente."

---

## 🧮 Algoritmo de Diagnóstico

### Pseudocódigo

```typescript
function diagnoseMechanism(params) {
  mechanism = 'unknown'
  confidence = 0.4
  notes = []

  // Paso 1: Analizar pendiente log-log
  if (slope ≈ 0.5 ± 0.15) {
    mechanism = 'diffusion'
    confidence = 0.8
    notes.push("Randles-Sevcik")
  } else if (slope ≈ 1.0 ± 0.15) {
    mechanism = 'adsorption'
    confidence = 0.85
    notes.push("Especie adsorbida")
  }

  // Paso 2: Detectar mecanismo EC
  if (!cathodicPeak && hysteresis > 1e-6) {
    mechanism = 'EC'
    confidence = 0.75
    notes.push("EC rápido")
  }

  // Paso 3: Detectar cinética lenta
  if (deltaEp > 120 mV) {
    mechanism = 'kinetic'
    confidence = max(confidence, 0.7)
    notes.push("Laviron")
  }

  // Paso 4: Confirmar reversibilidad
  if (ambos_picos && deltaEp < 80 mV) {
    mechanism = 'diffusion'
    confidence = max(confidence, 0.75)
    notes.push("Sistema reversible")
  }

  return { mechanism, confidence, notes }
}
```

### Flujo de Decisión

```
┌─────────────────────────────────────┐
│  Analizar parámetros CV             │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ ¿Slope ≈ 0.5?      │
    └────┬───────────┬───┘
         │ SÍ        │ NO
         ▼           ▼
      DIFFUSION   ┌────────────────────┐
      (0.8)       │ ¿Slope ≈ 1.0?      │
                  └────┬───────────┬───┘
                       │ SÍ        │ NO
                       ▼           ▼
                    ADSORPTION  ┌────────────────────┐
                    (0.85)      │ ¿No cathodic peak? │
                                │ & High hysteresis? │
                                └────┬───────────┬───┘
                                     │ SÍ        │ NO
                                     ▼           ▼
                                    EC        ┌────────────────────┐
                                   (0.75)     │ ΔEp > 120 mV?      │
                                              └────┬───────────┬───┘
                                                   │ SÍ        │ NO
                                                   ▼           ▼
                                                KINETIC    UNKNOWN
                                                (0.70)     (0.40)
```

---

## 📈 Parámetros de Entrada

### Requeridos

| Parámetro        | Tipo   | Rango     | Descripción                 |
| ---------------- | ------ | --------- | --------------------------- |
| `hysteresisArea` | number | > 0       | Área del lazo (A·V)         |
| `slopeLogLog`    | number | 0.2 - 1.5 | Pendiente log(Ip) vs log(v) |
| `deltaEp`        | number | 0 - 0.5 V | Separación de picos (V)     |
| `anodicPeak`     | Peak?  | -         | Pico anódico                |
| `cathodicPeak`   | Peak?  | -         | Pico catódico               |

### Thresholds (Configurables)

```typescript
CV_THRESHOLDS = {
  slopeTolerance: 0.15, // ±15% alrededor de 0.5 o 1.0
  hysteresisArea: 1e-6, // 1 μA·V (umbral EC)
  deltaEpKinetic: 0.12 // 120 mV (umbral cinética)
}
```

---

## 🎯 Confianza (Confidence Score)

La confianza se calcula como un valor entre 0 y 1:

```
0.0 - 0.4  → Muy baja (diagnóstico poco confiable)
0.4 - 0.6  → Baja (requiere validación)
0.6 - 0.75 → Moderada (probablemente correcto)
0.75 - 0.85 → Alta (muy probablemente correcto)
0.85 - 1.0 → Muy alta (casi seguro)
```

**Ejemplo de cálculo:**

```
Slope = 0.48 (muy cercano a 0.5)
→ confidence = 0.8 (alta)

Slope = 0.52 (cercano a 0.5, dentro de tolerancia)
→ confidence = 0.8 (alta)

Slope = 0.35 (fuera de tolerancia)
→ confidence = 0.4 (baja, mecanismo desconocido)
```

---

## 🔬 Casos de Uso Reales

### Caso 1: Proceso Reversible Controlado por Difusión

```
Datos:
- Slope (log-log) = 0.48
- ΔEp = 0.065 V (65 mV)
- Hysteresis = 5e-7 A·V
- Picos: Anódico (0.5 V) + Catódico (0.435 V)

Diagnóstico:
→ DIFFUSION
→ Confianza: 0.80
→ Notas:
   - "Pendiente log(ip)-log(v) ≈ 0.5 indica control difusional"
   - "ΔEp cercano a 59/n mV consistente con sistema reversible"
```

### Caso 2: Especie Adsorbida

```
Datos:
- Slope (log-log) = 0.98
- ΔEp = 0.12 V (120 mV)
- Hysteresis = 1.5e-6 A·V
- Picos: Anódico (0.6 V) + Catódico (0.48 V)

Diagnóstico:
→ ADSORPTION
→ Confianza: 0.85
→ Notas:
   - "Pendiente log(ip)-log(v) ≈ 1 sugiere especie adsorbida"
```

### Caso 3: Mecanismo EC (Producto No Reducible)

```
Datos:
- Picos: Solo anódico (0.5 V)
- Catódico: AUSENTE
- Hysteresis = 5e-6 A·V (ALTA)
- Slope = 0.45

Diagnóstico:
→ EC
→ Confianza: 0.75
→ Notas:
   - "Ausencia de pico catódico + histéresis alta"
   - "→ posible mecanismo EC rápido"
```

### Caso 4: Cinética Lenta (Irreversible)

```
Datos:
- ΔEp = 0.18 V (180 mV) >> 120 mV
- Slope (log-log) = 0.45
- Hysteresis = 2e-6 A·V
- Picos: Anódico (0.6 V) + Catódico (0.42 V)

Diagnóstico:
→ KINETIC
→ Confianza: 0.70
→ Notas:
   - "ΔEp grande indica cinética lenta / casi irreversible (Laviron)"
```

---

## 🛠️ Cómo Mejorar la Detección

### Opciones Futuras

1. **Análisis de Múltiples Ciclos**
   - Detectar histéresis creciente
   - Identificar procesos de pasivación

2. **Machine Learning**
   - Entrenar modelo con datos conocidos
   - Clasificación más precisa

3. **Análisis de Capacitancia**
   - Detectar adsorción de especies
   - Mejorar diagnóstico de adsorción

4. **Transformada de Fourier**
   - Detectar componentes armónicas
   - Identificar mecanismos complejos

5. **Integración con Bases de Datos**
   - Comparar con mecanismos conocidos
   - Validación cruzada

---

## 📝 Notas Técnicas

### Ecuaciones Clave

**Randles-Sevcik (Diffusion):**

```
Ip = 0.4463 × n × F × A × C × √(n × F × v / R × T)
→ Slope (log-log) ≈ 0.5
```

**Laviron (Kinetic):**

```
Ep = E° + (RT/αnF) × ln(k°) + (RT/αnF) × ln(v)
→ ΔEp > 120 mV
```

**Nernst (Reversible):**

```
ΔEp = 59/n mV (a 25°C)
→ ΔEp ≈ 59 mV para n=1
```

### Limitaciones Actuales

- ❌ No detecta ECE automáticamente
- ❌ No analiza múltiples ciclos
- ❌ No detecta pasivación
- ❌ Requiere datos de buena calidad
- ❌ No maneja ruido extremo

---

## 🎓 Referencias

- **Randles-Sevcik**: Electrochemistry, 2nd ed. (Bard & Faulkner)
- **Laviron**: J. Electroanal. Chem., 1979, 100, 263-270
- **Nicholson**: Anal. Chem., 1965, 37, 1351-1355

---

**Última actualización:** Noviembre 2025
