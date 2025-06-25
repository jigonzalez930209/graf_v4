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
use nalgebra::{DMatrix, DVector};
use web_sys::console;

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
 * @param coords_x - An array of x-coordinates (as f64).
 * @param coords_y - An array of y-coordinates (as f64).
 * @returns The area of the polygon as a f64.
 */
#[wasm_bindgen]
pub fn calculate_polygon_area(coords_x: &[f64], coords_y: &[f64]) -> f64 {
    let n = coords_x.len();
    if n != coords_y.len() || n < 3 {
        console::warn_1(&"Not a valid polygon: requires at least 3 points and matching coordinates".into());
        return 0.0; // Not a polygon
    }

    let mut area = 0.0;

    for i in 0..n {
        let x1 = coords_x[i];
        let y1 = coords_y[i];
        let x2 = coords_x[(i + 1) % n];
        let y2 = coords_y[(i + 1) % n];

        area += x1 * y2 - x2 * y1;
    }

    // The formula gives a signed area, so we take the absolute value.
    (area / 2.0).abs()
}

/**
 * Calculates the numerical first derivative of a curve given by (x, y) points using central differences.
 * @param coords_x - An array of x-coordinates.
 * @param coords_y - An array of y-coordinates.
 * @returns A flattened array of [x, dy/dx] coordinates.
 */
#[wasm_bindgen]
pub fn numerical_derivative(coords_x: &[f64], coords_y: &[f64]) -> Vec<f64> {
    let n = coords_x.len();
    if n != coords_y.len() {
        console::error_1(&"Input arrays must have the same length".into());
        return [].to_vec();
    }
    if n < 2 {
        console::warn_1(&"Not enough points to calculate a derivative".into());
        return [].to_vec();
    }

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

        // Avoid division by zero if x points are identical
        let deriv = if dx.abs() < 1e-10 { 0.0 } else { dy / dx };
        result.push(coords_x[i]);
        result.push(deriv);
    }

    result
}

/**
 * Smooths data using a Savitzky-Golay filter.
 * This implementation follows the TypeScript version by fitting a polynomial to a window of points
 * and using it to estimate the smoothed value at the center.
 *
 * @param coords_x - The array of x-coordinates.
 * @param coords_y - The array of y-coordinates.
 * @param window_size - The number of points in the smoothing window. Must be an odd integer >= 3.
 * @param poly_order - The order of the polynomial to fit. Must be less than window_size and between 1 and 5.
 * @returns A new flattened array of smoothed [x, y_smoothed] coordinates.
 */
#[wasm_bindgen]
pub fn savitzky_golay_smooth(
    window_size: usize,
    poly_order: usize,
    coords_x: &[f64],
    coords_y: &[f64],
) -> Vec<f64> {
    // Validations matching the TypeScript implementation
    if window_size % 2 == 0 || window_size < 3 {
        console::error_1(&"windowSize must be odd and >= 3".into());
        return [].to_vec(); // Return empty array on error to match JS behavior
    }
    if poly_order >= window_size {
        console::error_1(&"polyOrder must be less than windowSize".into());
        return [].to_vec();
    }
    if poly_order < 1 || poly_order > 5 {
        console::error_1(&"polyOrder must be between 1 and 5. Higher orders require a larger windowSize.".into());
        return [].to_vec();
    }

    let n = coords_x.len();
    if n != coords_y.len() {
        console::error_1(&"Input arrays must have the same length".into());
        return [].to_vec();
    }

    let half_window = window_size / 2;
    let mut smoothed_coords = Vec::with_capacity(n * 2);

    for i in 0..n {
        // Do not smooth the edges where the window is not complete, return original points
        if i < half_window || i >= n - half_window {
            smoothed_coords.push(coords_x[i]);
            smoothed_coords.push(coords_y[i]);
            continue;
        }

        let start = i - half_window;
        let end = i + half_window + 1;
        let x_window = &coords_x[start..end];
        let y_window = &coords_y[start..end];
        let x_center = coords_x[i];
        
        // Use relative x-coordinates for better numerical stability (matching TypeScript)
        let x_relative: Vec<f64> = x_window.iter().map(|x| x - x_center).collect();

        // Create Vandermonde matrix as in the TypeScript implementation
        let mut x_matrix_data = Vec::with_capacity(window_size * (poly_order + 1));
        for val in &x_relative {
            for j in 0..=poly_order {
                x_matrix_data.push(val.powi(j as i32));
            }
        }
        
        // Create the matrix and vectors
        let x_matrix = DMatrix::from_row_slice(window_size, poly_order + 1, &x_matrix_data);
        let y_vector = DVector::from_row_slice(y_window);

        // Compute the least squares solution
        match x_matrix.svd(true, true).solve(&y_vector, 1e-10) {
            Ok(coeffs) => {
                // The smoothed value is the first coefficient (c_0) when using relative x
                // This is the same logic as in the TypeScript implementation
                let y_smoothed = coeffs[0];
                smoothed_coords.push(coords_x[i]);
                smoothed_coords.push(y_smoothed);
            },
            Err(_) => {
                // Fallback to original point if solver fails, matching TS implementation
                console::warn_1(&format!("Could not compute smoothed value at index {}. Falling back to original point.", i).into());
                smoothed_coords.push(coords_x[i]);
                smoothed_coords.push(coords_y[i]);
            }
        }
    }

    smoothed_coords
}

/**
 * Calculates the first derivative using a Savitzky-Golay filter.
 * This implementation follows the TypeScript version by fitting a polynomial to a window of data
 * and then calculating the analytical derivative of that polynomial at the center point.
 *
 * @param coords_x - The array of x-coordinates.
 * @param coords_y - The array of y-coordinates.
 * @param window_size - The number of points in the window. Must be an odd integer >= 3.
 * @param poly_order - The order of the polynomial to fit. Must be >= 1 and less than window_size.
 * @returns A new flattened array of [x, dy/dx] coordinates.
 */
#[wasm_bindgen]
pub fn savitzky_golay_derivative(
    window_size: usize,
    poly_order: usize,
    coords_x: &[f64],
    coords_y: &[f64],
) -> Vec<f64> {
    // Validations matching the TypeScript implementation
    if window_size % 2 == 0 || window_size < 3 {
        console::error_1(&"windowSize must be odd and >= 3".into());
        return [].to_vec(); // Return empty array on error to match JS behavior
    }
    if poly_order >= window_size {
        console::error_1(&"polyOrder must be less than windowSize".into());
        return [].to_vec();
    }
    if poly_order < 1 || poly_order > 5 {
        console::error_1(&"polyOrder must be between 1 and 5.".into());
        return [].to_vec();
    }

    let n = coords_x.len();
    if n != coords_y.len() {
        console::error_1(&"Input arrays must have the same length".into());
        return [].to_vec();
    }

    let half_window = window_size / 2;
    let mut derivative_coords = Vec::with_capacity(n * 2);

    // Fallback for insufficient data points
    if n < window_size {
        console::warn_1(&format!(
            "Not enough data points ({}) for window size ({}). Falling back to simple numerical derivative.",
            n, window_size
        ).into());
        return numerical_derivative(coords_x, coords_y);
    }

    for i in 0..n {
        // Fallback to simpler difference methods for edges where the full window is not available
        if i < half_window || i >= n - half_window {
            let (dx, dy) = if i == 0 && n > 1 {
                // Forward difference for the first point
                (coords_x[i + 1] - coords_x[i], coords_y[i + 1] - coords_y[i])
            } else if i == n - 1 && n > 1 {
                // Backward difference for the last point
                (coords_x[i] - coords_x[i - 1], coords_y[i] - coords_y[i - 1])
            } else if i > 0 && i < n - 1 {
                // Central difference for other edge points
                (coords_x[i + 1] - coords_x[i - 1], coords_y[i + 1] - coords_y[i - 1])
            } else {
                // Not enough points for any difference (e.g., n=1), derivative is 0
                derivative_coords.push(coords_x[i]);
                derivative_coords.push(0.0);
                continue;
            };

            let deriv = if dx.abs() < 1e-10 { 0.0 } else { dy / dx };
            derivative_coords.push(coords_x[i]);
            derivative_coords.push(deriv);
            continue;
        }

        let start = i - half_window;
        let end = i + half_window + 1;
        let x_window = &coords_x[start..end];
        let y_window = &coords_y[start..end];
        let x_center = coords_x[i];
        
        // Use relative x-coordinates for better numerical stability (matching TypeScript)
        let x_relative: Vec<f64> = x_window.iter().map(|x| x - x_center).collect();

        // Create Vandermonde matrix as in the TypeScript implementation
        let mut x_matrix_data = Vec::with_capacity(window_size * (poly_order + 1));
        for val in &x_relative {
            for j in 0..=poly_order {
                x_matrix_data.push(val.powi(j as i32));
            }
        }

        // Create the matrix and vectors
        let x_matrix = DMatrix::from_row_slice(window_size, poly_order + 1, &x_matrix_data);
        let y_vector = DVector::from_row_slice(y_window);

        // Compute the least squares solution using SVD for better numerical stability
        match x_matrix.svd(true, true).solve(&y_vector, 1e-10) {
            Ok(coeffs) => {
                // The first derivative at the center (x_relative=0) is the c[1] coefficient
                // This is the same logic as in the TypeScript implementation
                let derivative = if coeffs.len() > 1 { coeffs[1] } else { 0.0 };
                derivative_coords.push(coords_x[i]);
                derivative_coords.push(derivative);
            },
            Err(_) => {
                // Fallback to zero if solver fails, matching TS implementation
                console::warn_1(&format!("Could not compute derivative at index {}. Falling back to zero.", i).into());
                derivative_coords.push(coords_x[i]);
                derivative_coords.push(0.0);
            }
        }
    }

    derivative_coords
}
