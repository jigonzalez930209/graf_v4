use js_sys::Float64Array;
use wasm_bindgen::prelude::*;
use web_sys::console;

/**
 * Calculates the numerical first derivative of a curve given by (x, y) points using central differences.
 * @param coords_js - A JS Float64Array of interleaved x and y coordinates (x1, y1, x2, y2, ...).
 * @returns A flattened array of [x, dy/dx] coordinates.
 */
#[wasm_bindgen]
pub fn numerical_derivative(coords_js: Float64Array) -> Float64Array {
    let coords: Vec<f64> = coords_js.to_vec();
    console::log_1(&format!("Rust numerical_derivative received coords with length: {}", coords.len()).into());

    if coords.len() % 2 != 0 {
        console::error_1(&"Input array must have an even number of elements (x,y pairs)".into());
        return Float64Array::new_with_length(0);
    }
    let n = coords.len() / 2;
    console::warn_1(&format!("Calculating numerical derivative for {} points", n).into());

    if n < 2 {
        console::warn_1(&"Not enough points to calculate a derivative".into());
        return Float64Array::new_with_length(0);
    }

    let coords_x: Vec<f64> = coords.iter().step_by(2).cloned().collect();
    let coords_y: Vec<f64> = coords.iter().skip(1).step_by(2).cloned().collect();

    let mut result = Vec::with_capacity(n * 2);

    for i in 0..n {
        let dx: f64;
        let dy: f64;

        if i == 0 {
            // Forward difference for the first point
            dx = coords_x[i + 1] - coords_x[i];
            dy = coords_y[i + 1] - coords_y[i];
        } else if i == n - 1 {
            // Backward difference for the last point
            dx = coords_x[i] - coords_x[i - 1];
            dy = coords_y[i] - coords_y[i - 1];
        } else {
            // Central difference for intermediate points
            dx = coords_x[i + 1] - coords_x[i - 1];
            dy = coords_y[i + 1] - coords_y[i - 1];
        }

        if dx.abs() < 1e-10 {
            result.push(coords_x[i]);
            result.push(0.0); // Avoid division by zero, derivative is undefined or infinite
        } else {
            let derivative = dy / dx;
            result.push(coords_x[i]);
            result.push(derivative);
        }
    }

    console::log_1(&format!("Rust numerical_derivative returning result with length: {}", result.len()).into());
    // Return as a Float64Array to ensure correct data transfer
    Float64Array::from(&result[..])
}
