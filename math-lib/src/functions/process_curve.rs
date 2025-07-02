use js_sys::Float64Array;
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct CurveMetrics {
    pub area: f64,
    pub peak_height: f64,
}

#[wasm_bindgen]
pub fn process_curve_data(coords_js: Float64Array) -> CurveMetrics {
    let coords: Vec<f64> = coords_js.to_vec();
    if coords.len() % 2 != 0 || coords.len() < 4 {
        // A curve needs at least 2 points for peak height calculation.
        console::warn_1(&"Invalid input: requires at least 2 points for processing.".into());
        return CurveMetrics { area: 0.0, peak_height: 0.0 };
    }

    let n = coords.len() / 2;
    let coords_x: Vec<f64> = coords.iter().step_by(2).cloned().collect();
    let coords_y: Vec<f64> = coords.iter().skip(1).step_by(2).cloned().collect();

    // --- Area Calculation (Shoelace Formula) ---
    let mut area = 0.0;
    if n >= 3 {
        for i in 0..n {
            let x1 = coords_x[i];
            let y1 = coords_y[i];
            let x2 = coords_x[(i + 1) % n];
            let y2 = coords_y[(i + 1) % n];
            area += x1 * y2 - x2 * y1;
        }
        // Take the absolute value of half the sum
        area = (area / 2.0).abs();
        
        // Debug output to verify calculation
        console::log_1(&format!("Rust calculated area: {}", area).into());
    }

    // --- Peak Height Calculation ---
    let mut peak_height = 0.0;
    if n >= 2 {
        let (x1, y1) = (coords_x[0], coords_y[0]);
        let (x2, y2) = (coords_x[n - 1], coords_y[n - 1]);
        let denominator = ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt();

        if denominator != 0.0 {
            for i in 1..(n - 1) {
                let px = coords_x[i];
                let py = coords_y[i];
                let numerator = ((x2 - x1) * (y1 - py) - (x1 - px) * (y2 - y1)).abs();
                let distance = numerator / denominator;
                if distance > peak_height {
                    peak_height = distance;
                }
            }
        }
    }

    CurveMetrics {
        area,
        peak_height,
    }
}
