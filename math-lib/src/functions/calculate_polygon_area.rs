use js_sys::Float64Array;
use wasm_bindgen::prelude::*;
use web_sys::console;

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * The coordinates are expected to be in order (clockwise or counter-clockwise).
 *
 * @param coords_x - An array of x-coordinates (as f64).
 * @param coords_y - An array of y-coordinates (as f64).
 * @returns The area of the polygon as a f64.
 */
#[wasm_bindgen]
pub fn calculate_polygon_area(coords_js: Float64Array) -> f64 {
    let coords: Vec<f64> = coords_js.to_vec();
    if coords.len() % 2 != 0 || coords.len() < 6 {
        console::warn_1(
            &"Not a valid polygon: requires at least 3 points and matching (x,y) coordinates".into(),
        );
        return 0.0; // Not a polygon
    }

    let n = coords.len() / 2;
    let coords_x: Vec<f64> = coords.iter().step_by(2).cloned().collect();
    let coords_y: Vec<f64> = coords.iter().skip(1).step_by(2).cloned().collect();

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
