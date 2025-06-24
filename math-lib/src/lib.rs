pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}

use wasm_bindgen::prelude::*;

// A utility function to set up panic hooks, which will forward
// Rust's panic messages to the browser's console.
#[wasm_bindgen]
pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * The coordinates are expected to be in order (clockwise or counter-clockwise).
 *
 * @param x_coords - An array of x-coordinates (as f64).
 * @param y_coords - An array of y-coordinates (as f64).
 * @returns The area of the polygon as a f64.
 */
#[wasm_bindgen]
pub fn calculate_polygon_area(x_coords: &[f64], y_coords: &[f64]) -> f64 {
    let n = x_coords.len();
    if n != y_coords.len() || n < 3 {
        return 0.0; // Not a polygon
    }

    let mut area = 0.0;

    for i in 0..n {
        let x1 = x_coords[i];
        let y1 = y_coords[i];
        let x2 = x_coords[(i + 1) % n];
        let y2 = y_coords[(i + 1) % n];

        area += x1 * y2 - x2 * y1;
    }

    // The formula gives a signed area, so we take the absolute value.
    (area / 2.0).abs()
}

/**
 * Calculates the numerical first derivative of a curve given by (x, y) points.
 * It uses central differences for intermediate points, and forward/backward differences for endpoints.
 * @param x_coords - An array of x-coordinates.
 * @param y_coords - An array of y-coordinates.
 * @returns A flattened array of [x, dy/dx] coordinates.
 */
#[wasm_bindgen]
pub fn numerical_derivative(x_coords: &[f64], y_coords: &[f64]) -> Vec<f64> {
    let n = x_coords.len();
    if n != y_coords.len() {
        // In a real-world scenario, you might want to return an error.
        // For this case, we'll panic to make the error obvious during development.
        panic!("Input arrays must have the same length.");
    }
    if n < 2 {
        // Not enough points to calculate a derivative.
        // Returning an empty vector is a signal to the JS side.
        return vec![];
    }

    let mut result = Vec::with_capacity(n * 2);

    for i in 0..n {
        let (dx, dy) = if i == 0 {
            // Forward difference for the first point
            (x_coords[i + 1] - x_coords[i], y_coords[i + 1] - y_coords[i])
        } else if i == n - 1 {
            // Backward difference for the last point
            (x_coords[i] - x_coords[i - 1], y_coords[i] - y_coords[i - 1])
        } else {
            // Central difference for intermediate points
            (x_coords[i + 1] - x_coords[i - 1], y_coords[i + 1] - y_coords[i - 1])
        };

        // Avoid division by zero and handle potential NaN results.
        let deriv = if dx == 0.0 { 0.0 } else { dy / dx };
        result.push(x_coords[i]);
        result.push(if deriv.is_nan() { 0.0 } else { deriv });
    }

    result
}
